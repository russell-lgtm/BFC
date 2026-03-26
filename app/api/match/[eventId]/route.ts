import { NextRequest, NextResponse } from 'next/server'
import Parser from 'rss-parser'

const SITE_API = 'https://site.api.espn.com/apis/site/v2/sports/soccer/eng.3'
const rssParser = new Parser({ timeout: 6000, headers: { 'User-Agent': 'WWFC-FanHub/1.0' } })

export interface MatchEvent {
  minute: string
  teamId: string
  teamName: string
  type: 'goal' | 'ownGoal' | 'penalty' | 'redCard' | 'yellowRed'
  playerName?: string
}

export interface MatchDetails {
  events: MatchEvent[]
  reportLinks: { wwfc: string | null; external: string | null; externalSource: string | null }
}

async function fetchSummary(eventId: string) {
  try {
    const res = await fetch(`${SITE_API}/summary?event=${eventId}`, {
      next: { revalidate: 3600 },
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

// Get all WWFC match centre URLs from their sitemap (cached 24h)
async function getWWFCMatchUrls(): Promise<string[]> {
  try {
    const res = await fetch('https://www.brentfordfc.com/sitemap.xml', { next: { revalidate: 86400 } })
    if (!res.ok) return []
    const xml = await res.text()
    return [...xml.matchAll(/<loc>(https:\/\/www\.wwfc\.com\/match\/mens\/[^<]+)<\/loc>/g)]
      .map(m => m[1])
  } catch {
    return []
  }
}

// WWFC match pages (Nuxt SSR) include og:title: "Brentford FC - Luton Town | 14 Mar 2026"
// Match the right page by checking the title contains both the opponent and the date.
// All individual page fetches are cached 24h so only the first call is slow.
async function findWWFCMatchCentre(opponent: string, matchDate: Date): Promise<string | null> {
  const matchUrls = await getWWFCMatchUrls()
  if (!matchUrls.length) return null

  // Format date to match wwfc.com's format: "14 Mar 2026"
  const dateStr = matchDate.toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  }).replace(/\./g, '')  // some locales add dots after month abbreviation

  const oppFirst = opponent.split(' ')[0].toLowerCase()

  // Fetch all match pages in parallel — each is individually cached for 24h
  const results = await Promise.allSettled(
    matchUrls.map(async (url) => {
      const res = await fetch(url, { next: { revalidate: 86400 } })
      if (!res.ok) return { url, title: '' }
      const html = await res.text()
      const m = html.match(/data-hid="og:title"[^>]*content="([^"]+)"/)
      return { url, title: m?.[1] ?? '' }
    })
  )

  for (const r of results) {
    if (r.status !== 'fulfilled') continue
    const { url, title } = r.value
    const t = title.toLowerCase()
    if (t.includes(dateStr.toLowerCase()) && t.includes(oppFirst)) {
      return url
    }
  }
  return null
}

// Search Google News with site: filter and date window.
// Searches Google's full index so it finds articles from any point in the season.
async function googleNewsSearch(query: string, matchDate: Date): Promise<string | null> {
  const after = new Date(matchDate)
  after.setDate(after.getDate() - 1)
  const before = new Date(matchDate)
  before.setDate(before.getDate() + 4)
  const fmt = (d: Date) => d.toISOString().slice(0, 10)

  const q = `${query} after:${fmt(after)} before:${fmt(before)}`
  try {
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=en-GB&gl=GB&ceid=GB:en`
    const feed = await rssParser.parseURL(url)
    return feed.items[0]?.link ?? null
  } catch {
    return null
  }
}

async function findExternalReport(
  opponent: string,
  matchDate: Date,
): Promise<{ url: string; source: string } | null> {
  const oppFirst = opponent.split(' ')[0]
  const [skySports, the72] = await Promise.all([
    googleNewsSearch(`\"Brentford" "${oppFirst}" match report site:skysports.com`, matchDate),
    googleNewsSearch(`\"Brentford" "${oppFirst}" site:the72.co.uk`, matchDate),
  ])
  if (skySports) return { url: skySports, source: 'Sky Sports' }
  if (the72) return { url: the72, source: 'The 72' }
  return null
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await params
  const home = req.nextUrl.searchParams.get('home') ?? ''
  const away = req.nextUrl.searchParams.get('away') ?? ''
  const dateParam = req.nextUrl.searchParams.get('date') ?? ''

  const data = await fetchSummary(eventId)
  if (!data) {
    return NextResponse.json({ events: [], reportLinks: { wwfc: null, external: null, externalSource: null } })
  }

  const events: MatchEvent[] = []

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const plays: any[] = data.plays ?? []
  for (const play of plays) {
    const type = play.type?.text?.toLowerCase() ?? ''
    const clock = play.clock?.displayValue ?? ''
    const teamId = play.team?.id ?? ''
    const teamName = play.team?.displayName ?? ''
    const playerName = (play.athletesInvolved ?? [])[0]?.displayName ?? undefined

    if (play.scoringPlay) {
      const isOwn = type.includes('own goal')
      const isPen = type.includes('penalty')
      events.push({ minute: clock, teamId, teamName, type: isOwn ? 'ownGoal' : isPen ? 'penalty' : 'goal', playerName })
    } else if (type.includes('red card') && !type.includes('yellow')) {
      events.push({ minute: clock, teamId, teamName, type: 'redCard', playerName })
    } else if (type.includes('yellow-red') || type.includes('second yellow')) {
      events.push({ minute: clock, teamId, teamName, type: 'yellowRed', playerName })
    }
  }

  if (events.filter(e => ['goal', 'ownGoal', 'penalty'].includes(e.type)).length === 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const entry of (data.scoringSummary ?? []) as any[]) {
      const clock = entry.clock?.displayValue ?? ''
      const type = entry.type?.text?.toLowerCase() ?? ''
      events.push({
        minute: clock,
        teamId: entry.team?.id ?? '',
        teamName: entry.team?.displayName ?? '',
        type: (type.includes('own') || entry.ownGoal) ? 'ownGoal' : (type.includes('penalty') || entry.penaltyKick) ? 'penalty' : 'goal',
        playerName: entry.athlete?.displayName ?? undefined,
      })
    }
  }

  const comp = data.header?.competitions?.[0]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const homeTeam = home || comp?.competitors?.find((c: any) => c.homeAway === 'home')?.team?.displayName || ''
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const awayTeam = away || comp?.competitors?.find((c: any) => c.homeAway === 'away')?.team?.displayName || ''
  const matchDate = new Date(dateParam || comp?.date || '')
  const opponent = homeTeam.toLowerCase().includes('wycombe') ? awayTeam : homeTeam

  const [wwfc, external] = await Promise.all([
    findWWFCMatchCentre(opponent, matchDate),
    findExternalReport(opponent, matchDate),
  ])

  return NextResponse.json({
    events,
    reportLinks: { wwfc, external: external?.url ?? null, externalSource: external?.source ?? null },
  } satisfies MatchDetails)
}

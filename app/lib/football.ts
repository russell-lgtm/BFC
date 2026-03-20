const SITE_API = 'https://site.api.espn.com/apis/site/v2/sports/soccer/eng.3'
const WEB_API = 'https://site.web.api.espn.com/apis/v2/sports/soccer/eng.3'
export const WYCOMBE_ESPN_ID = '344'

async function espnFetch(url: string, revalidate = 1800) {
  try {
    const res = await fetch(url, { next: { revalidate } })
    if (!res.ok) return null
    return res.json()
  } catch (err) {
    console.error('ESPN fetch error:', url, err)
    return null
  }
}

// ── Types ──────────────────────────────────────────────────────────────────

export interface Fixture {
  id: string
  date: string
  status: 'finished' | 'live' | 'upcoming' | 'postponed'
  elapsed?: number
  home: { id: string; name: string; logo: string; score: number | null }
  away: { id: string; name: string; logo: string; score: number | null }
  competition: string
  round: string
}

export interface StandingEntry {
  rank: number
  team: { id: string; name: string; logo: string }
  played: number
  won: number
  drawn: number
  lost: number
  gf: number
  ga: number
  gd: number
  points: number
}

export interface Player {
  id: string
  name: string
  position: string
  photo: string
  jersey: string
  goals: number
  assists: number
  appearances: number
  yellowCards: number
  status: string
}

// ── Parsers ────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseEvent(event: any): Fixture | null {
  const comp = event.competitions?.[0]
  if (!comp) return null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const home = comp.competitors?.find((c: any) => c.homeAway === 'home')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const away = comp.competitors?.find((c: any) => c.homeAway === 'away')
  if (!home || !away) return null

  const st = event.status?.type
  let status: Fixture['status'] = 'upcoming'
  // ESPN schedule endpoint uses state:'post' for finished rather than completed:true
  if (st?.completed || st?.state === 'post') status = 'finished'
  else if (st?.state === 'in') status = 'live'
  else if (st?.name?.includes('POSTPONED') || st?.name?.includes('CANCELED')) status = 'postponed'

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const logo = (c: any) =>
    c.team?.logos?.[0]?.href ?? `https://a.espncdn.com/i/teamlogos/soccer/500/${c.id}.png`

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const score = (c: any) => {
    const v = c.score
    if (v == null) return null
    if (typeof v === 'string') return parseInt(v)
    if (typeof v === 'number') return v
    if (typeof v === 'object' && v.displayValue != null) return parseInt(v.displayValue)
    return null
  }

  return {
    id: event.id,
    date: event.date,
    status,
    elapsed: status === 'live' ? (event.status?.displayClock ? undefined : undefined) : undefined,
    home: { id: home.id, name: home.team?.displayName ?? '', logo: logo(home), score: score(home) },
    away: { id: away.id, name: away.team?.displayName ?? '', logo: logo(away), score: score(away) },
    competition: event.league?.abbreviation ?? 'L1',
    round: comp.notes?.[0]?.headline ?? comp.series?.title ?? '',
  }
}

// ── Exports ────────────────────────────────────────────────────────────────

export async function getFixtures(): Promise<Fixture[]> {
  // Past results: schedule endpoint (all events have no status field, so force 'finished')
  const pastData = await espnFetch(`${SITE_API}/teams/${WYCOMBE_ESPN_ID}/schedule`, 900)
  const pastFixtures: Fixture[] = (pastData?.events ?? [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((e: any) => parseEvent(e))
    .filter(Boolean)
    .map((f: Fixture) => ({ ...f, status: 'finished' as const }))

  // Upcoming fixtures: scoreboard from today to end of season, filtered to Wycombe
  const now = new Date()
  const seasonEnd = new Date(now.getFullYear(), 4, 15) // ~15 May
  const fmt = (d: Date) => d.toISOString().slice(0, 10).replace(/-/g, '')
  const url = `${SITE_API}/scoreboard?dates=${fmt(now)}-${fmt(seasonEnd)}&limit=200`
  const upcomingData = await espnFetch(url, 900)
  const upcomingFixtures: Fixture[] = (upcomingData?.events ?? [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((e: any) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      e.competitions?.[0]?.competitors?.some((c: any) => c.id === WYCOMBE_ESPN_ID)
    )
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((e: any) => parseEvent(e))
    .filter(Boolean)
    .map((f: Fixture) => {
      // Scoreboard upcoming events have status pre, mark as upcoming
      const st = f.status
      if (st !== 'finished' && st !== 'live') return { ...f, status: 'upcoming' as const }
      return f
    })

  // Merge: deduplicate by id in case of overlap
  const seen = new Set<string>()
  const all: Fixture[] = []
  for (const f of [...pastFixtures, ...upcomingFixtures]) {
    if (!seen.has(f.id)) {
      seen.add(f.id)
      all.push(f)
    }
  }
  return all
}

export async function getStandings(): Promise<StandingEntry[]> {
  const data = await espnFetch(`${WEB_API}/standings`, 3600)
  if (!data) return []

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const entries: any[] = data.children?.[0]?.standings?.entries ?? []
  return entries.map(e => {
    const stat = (name: string) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const s = e.stats?.find((s: any) => s.name === name)
      return Number(s?.value ?? 0)
    }
    return {
      rank: stat('rank'),
      team: {
        id: e.team?.id ?? '',
        name: e.team?.displayName ?? '',
        logo: e.team?.logos?.[0]?.href ?? `https://a.espncdn.com/i/teamlogos/soccer/500/${e.team?.id}.png`,
      },
      played: stat('gamesPlayed'),
      won: stat('wins'),
      drawn: stat('ties'),
      lost: stat('losses'),
      gf: stat('pointsFor'),
      ga: stat('pointsAgainst'),
      gd: stat('pointDifferential'),
      points: stat('points'),
    }
  }).sort((a, b) => a.rank - b.rank)
}

export async function getSquad(): Promise<Player[]> {
  const data = await espnFetch(`${SITE_API}/teams/${WYCOMBE_ESPN_ID}/roster`, 21600)
  if (!data) return []

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data.athletes ?? []).map((a: any) => {
    const stat = (name: string) => {
      const cats = a.statistics?.splits?.categories ?? []
      for (const cat of cats) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const s = cat.stats?.find((s: any) => s.name === name)
        if (s) return Number(s.value ?? 0)
      }
      return 0
    }
    return {
      id: a.id,
      name: a.displayName ?? '',
      position: a.position?.displayName ?? '',
      photo: a.headshot?.href ?? '',
      jersey: a.jersey ?? '',
      goals: stat('totalGoals'),
      assists: stat('goalAssists'),
      appearances: stat('appearances'),
      yellowCards: stat('yellowCards'),
      status: a.status?.type ?? 'active',
    }
  })
}

// Fetch an image from the news articles attached to a specific match event
export async function getLastMatchImage(eventId: string): Promise<{ url: string; caption: string } | null> {
  const data = await espnFetch(`${SITE_API}/summary?event=${eventId}`, 3600)
  if (!data) return null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const articles: any[] = data.news?.articles ?? []
  for (const a of articles) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const img = a.images?.find((i: any) => i.url?.includes('espncdn.com/photo'))
    if (img?.url) return { url: img.url, caption: a.headline ?? '' }
  }
  return null
}

// Full-season results for all League One teams — needed for accurate home/away stats
// Split into 4 smaller chunks so each response stays under Next.js's 2MB cache limit
export async function getRecentResults(): Promise<Fixture[]> {
  const fmt = (d: Date) => d.toISOString().slice(0, 10).replace(/-/g, '')
  const now = new Date()

  const chunks: [string, string][] = [
    ['20250801', '20251005'],
    ['20251005', '20251201'],
    ['20251201', '20260201'],
    ['20260201', fmt(now)],
  ]

  const responses = await Promise.all(
    chunks.map(([from, to]) =>
      espnFetch(`${SITE_API}/scoreboard?dates=${from}-${to}&limit=250`, 3600)
    )
  )

  const seen = new Set<string>()
  return responses
    .flatMap(d => d?.events ?? [])
    .filter(e => { if (seen.has(e.id)) return false; seen.add(e.id); return true })
    .map(parseEvent)
    .filter(Boolean) as Fixture[]
}

// Fetch Adams Park image from Wikipedia (Wikimedia Commons, very stable)
export async function getStadiumImage(): Promise<string | null> {
  try {
    const res = await fetch('https://en.wikipedia.org/api/rest_v1/page/summary/Adams_Park', {
      next: { revalidate: 86400 },
      headers: { 'User-Agent': 'WWFC-FanHub/1.0' },
    })
    if (!res.ok) return null
    const data = await res.json()
    return data?.originalimage?.source ?? data?.thumbnail?.source ?? null
  } catch {
    return null
  }
}

export interface OppositionData {
  recentResults: Fixture[]   // last 10 finished, sorted newest-first
  topScorers: Player[]       // sorted by goals desc
  topAssists: Player[]       // sorted by assists desc
  reverseFixture: Fixture | null  // already-played game vs Wycombe this season
}

export async function getOppositionData(teamId: string): Promise<OppositionData | null> {
  const [scheduleData, rosterData] = await Promise.all([
    espnFetch(`${SITE_API}/teams/${teamId}/schedule`, 900),
    espnFetch(`${SITE_API}/teams/${teamId}/roster`, 21600),
  ])

  const allFinished: Fixture[] = (scheduleData?.events ?? [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((e: any) => parseEvent(e))
    .filter(Boolean)
    .map((f: Fixture) => ({ ...f, status: 'finished' as const }))
    .sort((a: Fixture, b: Fixture) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const reverseFixture: Fixture | null = allFinished.find(
    (f: Fixture) => f.home.id === WYCOMBE_ESPN_ID || f.away.id === WYCOMBE_ESPN_ID
  ) ?? null

  const recentResults: Fixture[] = allFinished.slice(0, 10)

  const allPlayers: Player[] = (rosterData?.athletes ?? [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((a: any) => {
      const stat = (name: string) => {
        const cats = a.statistics?.splits?.categories ?? []
        for (const cat of cats) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const s = cat.stats?.find((s: any) => s.name === name)
          if (s) return Number(s.value ?? 0)
        }
        return 0
      }
      return {
        id: a.id,
        name: a.displayName ?? '',
        position: a.position?.displayName ?? '',
        photo: a.headshot?.href ?? `https://a.espncdn.com/i/headshots/soccer/players/full/${a.id}.png`,
        jersey: a.jersey ?? '',
        goals: stat('totalGoals'),
        assists: stat('goalAssists'),
        appearances: stat('appearances'),
        yellowCards: stat('yellowCards'),
        status: a.status?.type ?? 'active',
      }
    })

  const topScorers: Player[] = [...allPlayers]
    .filter((p: Player) => p.goals > 0)
    .sort((a: Player, b: Player) => b.goals - a.goals)
    .slice(0, 5)

  const topAssists: Player[] = [...allPlayers]
    .filter((p: Player) => p.assists > 0)
    .sort((a: Player, b: Player) => b.assists - a.assists)
    .slice(0, 5)

  return { recentResults, topScorers, topAssists, reverseFixture }
}

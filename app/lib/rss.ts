import Parser from 'rss-parser'

const parser = new Parser({
  timeout: 8000,
  headers: { 'User-Agent': 'WWFC-FanHub/1.0 (fan dashboard)' },
})

export interface NewsItem {
  title: string
  link: string
  pubDate: string
  source: string
  snippet: string
  type: 'article' | 'reddit'
}

interface FeedConfig {
  url: string
  source: string
  type: 'article' | 'reddit'
  /** If set, only include items containing this keyword (case-insensitive) */
  filter?: string
  /** If true, filter keyword must appear in the title (not just snippet) */
  filterTitleOnly?: boolean
  limit?: number
}

const WWFC_FEEDS: FeedConfig[] = [
  // Google News — broad aggregator (BBC Sport, Sky Sports, Guardian, local press etc.)
  {
    url: 'https://news.google.com/rss/search?q=%22Wycombe+Wanderers%22&hl=en-GB&gl=GB&ceid=GB:en',
    source: 'Google News',
    type: 'article',
    limit: 10,
  },
  // WWFC official news via Google News (wycombewanderers.co.uk WordPress site has been compromised)
  {
    url: 'https://news.google.com/rss/search?q=%22Wycombe+Wanderers%22+site%3Awwfc.com&hl=en-GB&gl=GB&ceid=GB:en',
    source: 'WWFC Official',
    type: 'article',
    limit: 8,
  },
  // The72 — EFL-specialist, filtered to Wycombe headline stories only
  {
    url: 'https://the72.co.uk/feed/',
    source: 'The72',
    type: 'article',
    filter: 'wycombe',
    filterTitleOnly: true,
    limit: 20,
  },
  // Vital Wycombe — fan news / transfer rumours
  {
    url: 'https://wycombe.vitalfootball.co.uk/feed/',
    source: 'Vital Wycombe',
    type: 'article',
    limit: 8,
  },
  // Local press via Google News — must mention Wycombe in headline to ensure it's the focus
  {
    url: 'https://news.google.com/rss/search?q=%22Wycombe+Wanderers%22+(site%3Abucksherald.co.uk+OR+site%3Abucksfreepress.co.uk+OR+site%3Agetreading.co.uk)&hl=en-GB&gl=GB&ceid=GB:en',
    source: 'Local Press',
    type: 'article',
    filter: 'wycombe',
    filterTitleOnly: true,
    limit: 6,
  },
  // BBC Sport via Google News
  {
    url: 'https://news.google.com/rss/search?q=%22Wycombe+Wanderers%22+site%3Abbc.co.uk&hl=en-GB&gl=GB&ceid=GB:en',
    source: 'BBC Sport',
    type: 'article',
    limit: 6,
  },
  // Reddit — r/wycombewanderers (community discussion, match threads)
  {
    url: 'https://www.reddit.com/r/wycombewanderers/.rss?limit=10',
    source: 'r/wycombewanderers',
    type: 'reddit',
    limit: 6,
  },
  // Reddit — r/leagueone filtered to Wycombe
  {
    url: 'https://www.reddit.com/r/leagueone/search.rss?q=wycombe&sort=top&t=week&limit=10',
    source: 'r/leagueone',
    type: 'reddit',
    filter: 'wycombe',
    limit: 4,
  },
]

/** Normalise a title for deduplication comparison */
function normaliseTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Strip HTML tags from Reddit's HTML-heavy snippets */
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&[a-z]+;/gi, ' ').trim()
}

async function fetchFeed(config: FeedConfig): Promise<NewsItem[]> {
  try {
    const feed = await parser.parseURL(config.url)
    const raw = (feed.items ?? []).slice(0, config.limit ?? 12)

    return raw
      .map(item => {
        const title = item.title ?? ''
        const snippet = stripHtml(
          (item.contentSnippet ?? item.summary ?? item.content ?? '').slice(0, 200)
        )
        return {
          title,
          link: item.link ?? '#',
          pubDate: item.pubDate ?? item.isoDate ?? '',
          source: config.source,
          snippet,
          type: config.type,
        }
      })
      .filter(item => {
        if (!item.title || item.link === '#') return false
        if (config.filter) {
          const kw = config.filter.toLowerCase()
          const inTitle = item.title.toLowerCase().includes(kw)
          if (config.filterTitleOnly) return inTitle
          return inTitle || item.snippet.toLowerCase().includes(kw)
        }
        return true
      })
  } catch (err) {
    console.warn(`RSS feed failed (${config.source}):`, (err as Error).message)
    return []
  }
}

/** Deduplicate by normalised title — keep highest-priority source version */
function deduplicate(items: NewsItem[]): NewsItem[] {
  const seen = new Map<string, NewsItem>()
  // Source priority — earlier = higher priority
  const priority = ['WWFC Official', 'Bucks Herald', 'Bucks Free Press', 'Vital Wycombe', 'The72', 'Google News', 'r/wycombewanderers', 'r/leagueone']
  const rank = (s: string) => { const i = priority.indexOf(s); return i === -1 ? 99 : i }

  for (const item of items) {
    const key = normaliseTitle(item.title).slice(0, 60)
    const existing = seen.get(key)
    if (!existing || rank(item.source) < rank(existing.source)) {
      seen.set(key, item)
    }
  }
  return Array.from(seen.values())
}

export async function getNews(): Promise<NewsItem[]> {
  const results = await Promise.all(WWFC_FEEDS.map(fetchFeed))
  const all = results.flat()

  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  return deduplicate(all)
    .filter(i => !i.pubDate || new Date(i.pubDate).getTime() > oneWeekAgo)
    .sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())
    .slice(0, 20)
}

export async function getNewsForTeam(teamName: string): Promise<NewsItem[]> {
  const q = encodeURIComponent(`"${teamName}"`)
  const feeds: FeedConfig[] = [
    {
      url: `https://news.google.com/rss/search?q=${q}&hl=en-GB&gl=GB&ceid=GB:en`,
      source: 'Google News',
      type: 'article',
      limit: 6,
    },
    {
      url: `https://www.reddit.com/r/leagueone/search.rss?q=${encodeURIComponent(teamName)}&sort=top&t=month&limit=10`,
      source: 'Reddit',
      type: 'reddit',
      filter: teamName.split(' ')[0].toLowerCase(),
      limit: 4,
    },
  ]

  const results = await Promise.all(feeds.map(fetchFeed))
  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  return deduplicate(results.flat())
    .filter(i => !i.pubDate || new Date(i.pubDate).getTime() > oneWeekAgo)
    .sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())
    .slice(0, 6)
}

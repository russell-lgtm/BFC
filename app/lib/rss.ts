import Parser from 'rss-parser'

const parser = new Parser({
  timeout: 8000,
  headers: { 'User-Agent': 'BFC-FanHub/1.0 (fan dashboard)' },
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

const BFC_FEEDS: FeedConfig[] = [
  // Google News — broad aggregator
  {
    url: 'https://news.google.com/rss/search?q=%22Brentford%22+football&hl=en-GB&gl=GB&ceid=GB:en',
    source: 'Google News',
    type: 'article',
    filter: 'brentford',
    filterTitleOnly: true,
    limit: 10,
  },
  // Brentford FC official news via Google News
  {
    url: 'https://news.google.com/rss/search?q=%22Brentford%22+site%3Abrentfordfc.com&hl=en-GB&gl=GB&ceid=GB:en',
    source: 'Brentford FC Official',
    type: 'article',
    limit: 8,
  },
  // BBC Sport
  {
    url: 'https://news.google.com/rss/search?q=%22Brentford%22+site%3Abbc.co.uk&hl=en-GB&gl=GB&ceid=GB:en',
    source: 'BBC Sport',
    type: 'article',
    filter: 'brentford',
    filterTitleOnly: true,
    limit: 6,
  },
  // Sky Sports
  {
    url: 'https://news.google.com/rss/search?q=%22Brentford%22+site%3Askysports.com&hl=en-GB&gl=GB&ceid=GB:en',
    source: 'Sky Sports',
    type: 'article',
    filter: 'brentford',
    filterTitleOnly: true,
    limit: 6,
  },
  // Reddit — r/Brentford
  {
    url: 'https://www.reddit.com/r/Brentford/.rss?limit=10',
    source: 'r/Brentford',
    type: 'reddit',
    limit: 6,
  },
  // Reddit — r/PremierLeague filtered to Brentford
  {
    url: 'https://www.reddit.com/r/PremierLeague/search.rss?q=brentford&sort=top&t=week&limit=10',
    source: 'r/PremierLeague',
    type: 'reddit',
    filter: 'brentford',
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
  const priority = ['Brentford FC Official', 'BBC Sport', 'Sky Sports', 'Google News', 'r/Brentford', 'r/PremierLeague']
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
  const results = await Promise.all(BFC_FEEDS.map(fetchFeed))
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
      url: `https://www.reddit.com/r/PremierLeague/search.rss?q=${encodeURIComponent(teamName)}&sort=top&t=month&limit=10`,
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

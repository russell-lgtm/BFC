export interface HighlightVideo {
  videoId: string
  title: string
}

const CHANNEL_ID = 'UCAalMUm3LIf504ItA3rqfug'

export async function getMatchHighlight(
  opponent: string,
  matchDate: string,
): Promise<HighlightVideo | null> {
  const apiKey = process.env.YOUTUBE_API_KEY
  if (!apiKey) return null

  const date = new Date(matchDate)

  // Search from midnight on match day to end of day after (highlights often posted next morning)
  const after = new Date(date)
  after.setUTCHours(0, 0, 0, 0)
  const before = new Date(date)
  before.setUTCDate(before.getUTCDate() + 2)
  before.setUTCHours(0, 0, 0, 0)

  const params = new URLSearchParams({
    part: 'snippet',
    channelId: CHANNEL_ID,
    q: `${opponent} highlights`,
    type: 'video',
    publishedAfter: after.toISOString(),
    publishedBefore: before.toISOString(),
    maxResults: '3',
    order: 'relevance',
    key: apiKey,
  })

  try {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/search?${params}`,
      { next: { revalidate: 86400 } },
    )
    if (!res.ok) return null
    const data = await res.json()
    const item = data.items?.[0]
    if (!item?.id?.videoId) return null
    return {
      videoId: item.id.videoId,
      title: item.snippet.title,
    }
  } catch {
    return null
  }
}

export interface HighlightVideo {
  videoId: string
  title: string
}

const CHANNEL_ID = 'UCAalMUm3LIf504ItA3rqfug'

// YouTube provides a free Atom RSS feed of the latest ~15 uploads per channel.
// No API key, no quota. We fetch once and cache for 1h, then match entries to fixtures.
async function getChannelVideos(): Promise<{ videoId: string; title: string; published: Date }[]> {
  try {
    const res = await fetch(
      `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`,
      { next: { revalidate: 3600 } },
    )
    if (!res.ok) return []
    const xml = await res.text()

    return [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].flatMap(m => {
      const entry = m[1]
      const videoId = entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1]
      const title = entry.match(/<title>([^<]+)<\/title>/)?.[1]
      const published = entry.match(/<published>([^<]+)<\/published>/)?.[1]
      if (!videoId || !title || !published) return []
      return [{ videoId, title, published: new Date(published) }]
    })
  } catch {
    return []
  }
}

export async function getMatchHighlight(
  opponent: string,
  matchDate: string,
): Promise<HighlightVideo | null> {
  const videos = await getChannelVideos()
  if (!videos.length) return null

  const matchDay = new Date(matchDate)
  const windowStart = new Date(matchDay)
  windowStart.setUTCHours(0, 0, 0, 0)
  const windowEnd = new Date(matchDay)
  windowEnd.setUTCDate(windowEnd.getUTCDate() + 4)
  windowEnd.setUTCHours(0, 0, 0, 0)

  // Match on opponent's first word (handles "Manchester City" → "manchester")
  const oppFirst = opponent.split(' ')[0].toLowerCase()

  for (const v of videos) {
    if (v.published < windowStart || v.published >= windowEnd) continue
    const t = v.title.toLowerCase()
    if (!t.includes('highlight')) continue
    if (!t.includes(oppFirst)) continue
    return { videoId: v.videoId, title: v.title }
  }

  return null
}

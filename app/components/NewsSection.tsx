import type { NewsItem } from '../lib/rss'

function timeAgo(dateStr: string) {
  if (!dateStr) return ''
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function SourceBadge({ source, type }: { source: string; type: NewsItem['type'] }) {
  if (source === 'WWFC Official') {
    return (
      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#009EE0]/20 text-[#009EE0] border border-[#009EE0]/30">
        {source}
      </span>
    )
  }
  if (type === 'reddit') {
    return (
      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/20">
        {source}
      </span>
    )
  }
  if (source === 'Vital Wycombe') {
    return (
      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#002147]/60 text-blue-300 border border-blue-800/50">
        {source}
      </span>
    )
  }
  if (source === 'The72') {
    return (
      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-900/30 text-purple-400 border border-purple-800/30">
        {source}
      </span>
    )
  }
  if (source === 'Local Press') {
    return (
      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-900/25 text-green-400 border border-green-800/30">
        {source}
      </span>
    )
  }
  if (source === 'BBC Sport') {
    return (
      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-900/30 text-red-400 border border-red-800/30">
        {source}
      </span>
    )
  }
  return (
    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/10 text-[#cce4f5]/70">
      {source}
    </span>
  )
}

export default function NewsSection({ news }: { news: NewsItem[] }) {
  const articles = news.filter(n => n.type === 'article')
  const reddit = news.filter(n => n.type === 'reddit')

  return (
    <section className="bg-[#060f1a]/96 backdrop-blur-sm rounded-xl border border-[#009EE0]/15 p-4" style={{ boxShadow: '0 0 25px rgba(0,158,224,0.05)' }} aria-label="Latest news">
      <h2 className="font-bold text-lg text-[#009EE0] uppercase tracking-[0.08em] mb-4" style={{ textShadow: '0 0 12px rgba(0,158,224,0.4)' }}>Latest News</h2>
      {news.length === 0 ? (
        <p className="text-[#009EE0]/50 text-sm">No news available</p>
      ) : (
        <div className="space-y-5">
          {/* Articles */}
          {articles.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {articles.map((item, i) => (
                <a
                  key={i}
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-3 border border-[#009EE0]/20 rounded-xl hover:border-[#009EE0]/60 hover:shadow-[0_0_15px_rgba(0,158,224,0.1)] transition-all group focus:outline-none focus:ring-2 focus:ring-[#009EE0]/50"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <SourceBadge source={item.source} type={item.type} />
                    <span className="text-xs text-[#009EE0]/50">{timeAgo(item.pubDate)}</span>
                  </div>
                  <h3 className="text-sm font-medium text-[#cce4f5] group-hover:text-white line-clamp-2">
                    {item.title}
                  </h3>
                  {item.snippet && (
                    <p className="text-xs text-[#cce4f5]/70 mt-1 line-clamp-2">{item.snippet}</p>
                  )}
                </a>
              ))}
            </div>
          )}

          {/* Reddit posts */}
          {reddit.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-[#009EE0]/55 uppercase tracking-[0.15em] mb-2 flex items-center gap-1.5">
                <span className="text-orange-400" aria-hidden="true">●</span> Fan Discussion
              </h3>
              <div className="space-y-2">
                {reddit.map((item, i) => (
                  <a
                    key={i}
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-3 p-2.5 border border-[#009EE0]/8 rounded-xl hover:border-orange-500/40 transition-all group focus:outline-none focus:ring-2 focus:ring-orange-400"
                  >
                    <span className="text-orange-500 mt-0.5 shrink-0 text-sm font-bold" aria-hidden="true">↑</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-[#cce4f5] group-hover:text-white line-clamp-2 leading-snug">
                        {item.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <SourceBadge source={item.source} type={item.type} />
                        <span className="text-xs text-[#009EE0]/50">{timeAgo(item.pubDate)}</span>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  )
}

import type { Fixture, OppositionData, StandingEntry } from '../lib/football'
import { WYCOMBE_ESPN_ID } from '../lib/football'
import { teamColor } from '../lib/teamColors'
import type { NewsItem } from '../lib/rss'

function isColorReadableOnDark(hex: string): boolean {
  if (!hex || hex.length < 7) return true
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  return (0.299 * r + 0.587 * g + 0.114 * b) > 0.22
}

function formResult(f: Fixture, teamId: string): 'W' | 'D' | 'L' {
  const isHome = f.home.id === teamId
  const scored = isHome ? (f.home.score ?? 0) : (f.away.score ?? 0)
  const conceded = isHome ? (f.away.score ?? 0) : (f.home.score ?? 0)
  return scored > conceded ? 'W' : scored === conceded ? 'D' : 'L'
}

function timeAgo(dateStr: string) {
  if (!dateStr) return ''
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export default function OppositionWatch({
  nextFixture,
  oppData,
  standing,
  news,
}: {
  nextFixture: Fixture
  oppData: OppositionData | null
  standing?: StandingEntry
  news: NewsItem[]
}) {
  const isHome = nextFixture.home.id === WYCOMBE_ESPN_ID
  const opponent = isHome ? nextFixture.away : nextFixture.home
  const opp = teamColor(opponent.name)
  const primaryReadable = isColorReadableOnDark(opp.primary)
  const accentColor = primaryReadable ? opp.primary : '#009EE0'

  const kickoff = new Date(nextFixture.date).toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Europe/London',
  })
  const kickoffTime = new Date(nextFixture.date).toLocaleTimeString('en-GB', {
    hour: '2-digit', minute: '2-digit', timeZone: 'Europe/London',
  })

  // Form from last 10 results (oldest first → rightmost = newest)
  const form10 = oppData?.recentResults
    .filter(f => f.home.id === opponent.id || f.away.id === opponent.id)
    .slice(0, 10)
    .reverse() ?? []

  // Goals stats from last 10
  const last10 = [...form10].reverse().slice(0, 10) // newest-first for counting
  const goalsFor = last10.reduce((sum, f) => {
    return sum + ((f.home.id === opponent.id ? f.home.score : f.away.score) ?? 0)
  }, 0)
  const goalsAgainst = last10.reduce((sum, f) => {
    return sum + ((f.home.id === opponent.id ? f.away.score : f.home.score) ?? 0)
  }, 0)
  const wins = last10.filter(f => formResult(f, opponent.id) === 'W').length
  const draws = last10.filter(f => formResult(f, opponent.id) === 'D').length
  const losses = last10.filter(f => formResult(f, opponent.id) === 'L').length

  // Reverse fixture: the already-played game between Wycombe and this opponent
  const reverseFixture = oppData?.reverseFixture ?? null

  return (
    <section className="bg-[#0e1f35]/90 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden">
      {/* Opposition colour top stripe */}
      <div className="h-1 w-full" style={{ backgroundColor: opp.primary }} />

      <div className="p-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={opponent.logo} alt={opponent.name} className="w-16 h-16 object-contain drop-shadow-lg shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-bold text-xl text-white leading-tight">{opponent.name}</h2>
              {standing && (
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-full border"
                  style={{
                    color: accentColor,
                    borderColor: `${accentColor}50`,
                    backgroundColor: `${accentColor}18`,
                  }}
                >
                  {standing.rank}{['th','st','nd','rd'][(standing.rank%100-20)%10] || ['th','st','nd','rd'][standing.rank%100] || 'th'}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-400 mt-0.5">
              {isHome ? 'Coming to Adams Park' : 'Away fixture'} · {kickoff} · {kickoffTime}
            </p>
            {standing && (
              <p className="text-xs text-gray-500 mt-0.5">
                {standing.played} played · {standing.points} pts · {standing.gd > 0 ? '+' : ''}{standing.gd} GD
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          {/* Left: Form + Stats */}
          <div className="space-y-4">
            {/* Form strip */}
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Last {form10.length} Results
              </h3>
              {form10.length === 0 ? (
                <p className="text-gray-600 text-sm">No recent data</p>
              ) : (
                <div className="flex gap-1">
                  {form10.map((f, i) => {
                    const r = formResult(f, opponent.id)
                    return (
                      <span
                        key={i}
                        title={`${f.home.name} ${f.home.score}–${f.away.score} ${f.away.name}`}
                        className={`w-7 h-7 rounded-full text-white text-xs flex items-center justify-center font-bold
                          ${r === 'W' ? 'bg-green-500' : r === 'D' ? 'bg-amber-400' : 'bg-red-500'}`}
                      >
                        {r}
                      </span>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Stats grid — last 10 */}
            {last10.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Last {last10.length} Games
                </h3>
                <div className="grid grid-cols-5 gap-2">
                  {[
                    { label: 'W', value: wins, color: 'text-green-400' },
                    { label: 'D', value: draws, color: 'text-amber-400' },
                    { label: 'L', value: losses, color: 'text-red-400' },
                    { label: 'GF', value: goalsFor, color: 'text-gray-100' },
                    { label: 'GA', value: goalsAgainst, color: 'text-gray-100' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="bg-[#142843] rounded-lg py-2 flex flex-col items-center">
                      <span className={`text-lg font-bold ${color}`}>{value}</span>
                      <span className="text-xs text-gray-500">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reverse fixture */}
            {reverseFixture && (() => {
              const wycHome = reverseFixture.home.id === WYCOMBE_ESPN_ID
              const wycScore = wycHome ? reverseFixture.home.score : reverseFixture.away.score
              const oppScore = wycHome ? reverseFixture.away.score : reverseFixture.home.score
              const result = wycScore != null && oppScore != null
                ? wycScore > oppScore ? 'W' : wycScore === oppScore ? 'D' : 'L'
                : null
              const resultColor = result === 'W' ? 'text-green-400' : result === 'L' ? 'text-red-400' : 'text-amber-400'
              const matchDate = new Date(reverseFixture.date).toLocaleDateString('en-GB', {
                day: 'numeric', month: 'short', timeZone: 'Europe/London',
              })
              return (
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Reverse Fixture
                  </h3>
                  <div className="bg-[#142843] rounded-xl p-3 flex items-center justify-between">
                    <div className="text-xs text-gray-400">{matchDate} · {wycHome ? 'Home' : 'Away'}</div>
                    <div className={`text-lg font-bold tabular-nums ${resultColor}`}>
                      {reverseFixture.home.score} – {reverseFixture.away.score}
                    </div>
                    {result && (
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                        result === 'W' ? 'bg-green-500/10 border-green-500/30 text-green-400' :
                        result === 'L' ? 'bg-red-500/10 border-red-500/30 text-red-400' :
                        'bg-amber-400/10 border-amber-400/30 text-amber-400'
                      }`}>{result}</span>
                    )}
                  </div>
                </div>
              )
            })()}
          </div>

          {/* Right: Top Scorers + Top Assists */}
          <div className="grid grid-cols-2 gap-3 items-start">
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Top Scorers
              </h3>
              {!oppData?.topScorers.length ? (
                <p className="text-gray-600 text-sm">No data available</p>
              ) : (
                <div className="space-y-1.5">
                  {oppData.topScorers.map(p => (
                    <div key={p.id} className="flex items-center gap-2.5 p-2 bg-[#142843]/80 rounded-xl">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 border"
                        style={{ backgroundColor: `${accentColor}18`, borderColor: `${accentColor}40` }}>
                        <span className="font-bold text-xs leading-none" style={{ color: accentColor }}>
                          {p.jersey || '?'}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-gray-100 truncate">{p.name}</div>
                        <div className="text-xs text-gray-500">{p.appearances} apps</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-base font-bold" style={{ color: accentColor }}>{p.goals}</div>
                        <div className="text-xs text-gray-600">goals</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Top Assists
              </h3>
              {!oppData?.topAssists.length ? (
                <p className="text-gray-600 text-sm">No data available</p>
              ) : (
                <div className="space-y-1.5">
                  {oppData.topAssists.map(p => (
                    <div key={p.id} className="flex items-center gap-2.5 p-2 bg-[#142843]/80 rounded-xl">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 border"
                        style={{ backgroundColor: `${accentColor}18`, borderColor: `${accentColor}40` }}>
                        <span className="font-bold text-xs leading-none" style={{ color: accentColor }}>
                          {p.jersey || '?'}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-gray-100 truncate">{p.name}</div>
                        <div className="text-xs text-gray-500">{p.appearances} apps</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-base font-bold" style={{ color: accentColor }}>{p.assists}</div>
                        <div className="text-xs text-gray-600">assists</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* News */}
        {news.length > 0 && (
          <div className="mt-5">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Latest News
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {news.map((item, i) => (
                <a
                  key={i}
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-2.5 rounded-xl border-2 transition-all group hover:bg-[#142843]"
                  style={{ borderColor: `${accentColor}40` }}
                >
                  {item.type === 'reddit' && (
                    <span className="text-orange-500 text-sm font-bold mr-1">↑</span>
                  )}
                  <p className="text-sm text-gray-200 group-hover:text-white line-clamp-2 leading-snug">
                    {item.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${
                      item.type === 'reddit'
                        ? 'bg-orange-500/20 text-orange-400'
                        : 'bg-white/10 text-gray-400'
                    }`}>
                      {item.source}
                    </span>
                    <span className="text-xs text-gray-600">{timeAgo(item.pubDate)}</span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Opposition colour bottom stripe */}
      <div className="h-1 w-full" style={{ backgroundColor: opp.primary }} />
    </section>
  )
}

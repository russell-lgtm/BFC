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
    <section className="bg-[#060f1a]/96 backdrop-blur-sm rounded-xl border border-[#009EE0]/15 overflow-hidden" style={{ boxShadow: '0 0 25px rgba(0,158,224,0.05)' }} aria-label={`Opposition Report: ${opponent.name}`}>
      {/* Opposition colour top stripe */}
      <div className="h-1 w-full" style={{ backgroundColor: opp.primary }} aria-hidden="true" />

      <div className="p-4">
        <h2 className="font-bold text-lg text-[#009EE0] uppercase tracking-[0.08em] mb-4" style={{ textShadow: '0 0 12px rgba(0,158,224,0.4)' }}>Opposition Report</h2>

        {/* Header */}
        <div className="flex items-center gap-4 mb-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={opponent.logo} alt={`${opponent.name} crest`} className="w-16 h-16 object-contain drop-shadow-lg shrink-0" />

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-bold text-xl text-[#cce4f5] leading-tight">{opponent.name}</h2>
              {standing && (
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-full border"
                  aria-label={`${standing.rank}${['th','st','nd','rd'][(standing.rank%100-20)%10] || ['th','st','nd','rd'][standing.rank%100] || 'th'} in the league`}
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
            <p className="text-sm text-[#cce4f5]/70 mt-0.5">
              {isHome ? 'Coming to Adams Park' : 'Away fixture'} · {kickoff} · {kickoffTime}
            </p>
            {standing && (
              <p className="text-xs text-[#009EE0]/50 mt-0.5">
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
              <h3 className="text-xs font-semibold text-[#009EE0]/55 uppercase tracking-[0.15em] mb-2">
                Last {form10.length} Results
              </h3>
              {form10.length === 0 ? (
                <p className="text-[#009EE0]/50 text-sm">No recent data</p>
              ) : (
                <div className="flex gap-1" aria-label={`Form: ${form10.map(f => formResult(f, opponent.id) === 'W' ? 'Win' : formResult(f, opponent.id) === 'D' ? 'Draw' : 'Loss').join(', ')}`}>
                  {form10.map((f, i) => {
                    const r = formResult(f, opponent.id)
                    return (
                      <span
                        key={i}
                        aria-hidden="true"
                        title={`${f.home.name} ${f.home.score}–${f.away.score} ${f.away.name}`}
                        className={`w-7 h-7 rounded-full text-xs flex items-center justify-center font-bold border
                          ${r === 'W' ? 'border-green-400 text-green-300' : r === 'D' ? 'border-amber-400 text-amber-300' : 'border-red-500 text-red-400'}`}
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
                <h3 className="text-xs font-semibold text-[#009EE0]/55 uppercase tracking-[0.15em] mb-2">
                  Last {last10.length} Games
                </h3>
                <div className="grid grid-cols-5 gap-2">
                  {[
                    { label: 'W', value: wins, color: 'text-green-400', fullLabel: 'Wins' },
                    { label: 'D', value: draws, color: 'text-amber-400', fullLabel: 'Draws' },
                    { label: 'L', value: losses, color: 'text-red-400', fullLabel: 'Losses' },
                    { label: 'GF', value: goalsFor, color: 'text-[#cce4f5]', fullLabel: 'Goals for' },
                    { label: 'GA', value: goalsAgainst, color: 'text-[#cce4f5]', fullLabel: 'Goals against' },
                  ].map(({ label, value, color, fullLabel }) => (
                    <div key={label} className="bg-[#030b14] border border-[#009EE0]/10 rounded-lg py-2 flex flex-col items-center" aria-label={`${fullLabel}: ${value}`}>
                      <span className={`text-lg font-bold ${color}`} aria-hidden="true">{value}</span>
                      <span className="text-xs text-[#009EE0]/50" aria-hidden="true">{label}</span>
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
                  <h3 className="text-xs font-semibold text-[#009EE0]/55 uppercase tracking-[0.15em] mb-2">
                    Reverse Fixture
                  </h3>
                  <div className="bg-[#091627]/80 rounded-xl p-3 flex items-center justify-between" aria-label={`Reverse fixture on ${matchDate}: ${reverseFixture.home.score}–${reverseFixture.away.score}, Wycombe ${result === 'W' ? 'won' : result === 'L' ? 'lost' : 'drew'}`}>
                    <div className="text-xs text-[#009EE0]/50">{matchDate} · {wycHome ? 'Home' : 'Away'}</div>
                    <div className={`text-lg font-bold tabular-nums ${resultColor}`} aria-hidden="true">
                      {reverseFixture.home.score} – {reverseFixture.away.score}
                    </div>
                    {result && (
                      <span aria-hidden="true" className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
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
              <h3 className="text-xs font-semibold text-[#009EE0]/55 uppercase tracking-[0.15em] mb-2">
                Top Scorers
              </h3>
              {!oppData?.topScorers.length ? (
                <p className="text-[#009EE0]/50 text-sm">No data available</p>
              ) : (
                <div className="space-y-1.5">
                  {oppData.topScorers.map(p => (
                    <div key={p.id} className="flex items-center gap-2.5 p-2 bg-[#091627]/80 rounded-xl" aria-label={`${p.name}, ${p.goals} goals`}>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 border"
                        style={{ backgroundColor: `${accentColor}18`, borderColor: `${accentColor}40` }}
                        aria-hidden="true">
                        <span className="font-bold text-xs leading-none" style={{ color: accentColor }}>
                          {p.jersey || '?'}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-[#cce4f5] truncate">{p.name}</div>
                        <div className="text-xs text-[#009EE0]/50">{p.appearances} apps</div>
                      </div>
                      <div className="text-right shrink-0" aria-hidden="true">
                        <div className="text-base font-bold" style={{ color: accentColor }}>{p.goals}</div>
                        <div className="text-xs text-[#009EE0]/50">goals</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h3 className="text-xs font-semibold text-[#009EE0]/55 uppercase tracking-[0.15em] mb-2">
                Top Assists
              </h3>
              {!oppData?.topAssists.length ? (
                <p className="text-[#009EE0]/50 text-sm">No data available</p>
              ) : (
                <div className="space-y-1.5">
                  {oppData.topAssists.map(p => (
                    <div key={p.id} className="flex items-center gap-2.5 p-2 bg-[#091627]/80 rounded-xl" aria-label={`${p.name}, ${p.assists} assists`}>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 border"
                        style={{ backgroundColor: `${accentColor}18`, borderColor: `${accentColor}40` }}
                        aria-hidden="true">
                        <span className="font-bold text-xs leading-none" style={{ color: accentColor }}>
                          {p.jersey || '?'}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-[#cce4f5] truncate">{p.name}</div>
                        <div className="text-xs text-[#009EE0]/50">{p.appearances} apps</div>
                      </div>
                      <div className="text-right shrink-0" aria-hidden="true">
                        <div className="text-base font-bold" style={{ color: accentColor }}>{p.assists}</div>
                        <div className="text-xs text-[#009EE0]/50">assists</div>
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
            <h3 className="text-xs font-semibold text-[#009EE0]/55 uppercase tracking-[0.15em] mb-2">
              Latest News
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {news.map((item, i) => (
                <a
                  key={i}
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-2.5 rounded-xl border-2 transition-all group focus:outline-none focus:ring-2 focus:ring-[#009EE0]/50"
                  style={{ borderColor: `${accentColor}40` }}
                >
                  {item.type === 'reddit' && (
                    <span className="text-orange-500 text-sm font-bold mr-1" aria-hidden="true">↑</span>
                  )}
                  <p className="text-sm text-[#cce4f5] group-hover:text-white line-clamp-2 leading-snug">
                    {item.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${
                      item.type === 'reddit'
                        ? 'bg-orange-500/20 text-orange-400'
                        : 'bg-white/10 text-[#cce4f5]/70'
                    }`}>
                      {item.source}
                    </span>
                    <span className="text-xs text-[#009EE0]/50">{timeAgo(item.pubDate)}</span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Opposition colour bottom stripe */}
      <div className="h-1 w-full" style={{ backgroundColor: opp.primary }} aria-hidden="true" />
    </section>
  )
}

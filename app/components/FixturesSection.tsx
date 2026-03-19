'use client'

import Link from 'next/link'
import type { Fixture, StandingEntry } from '../lib/football'
import { WYCOMBE_ESPN_ID } from '../lib/football'
import { teamColor, isReadableOnDark } from '../lib/teamColors'

function isHome(f: Fixture) { return f.home.id === WYCOMBE_ESPN_ID }

function getScore(f: Fixture) {
  if (f.status !== 'finished' && f.status !== 'live') return null
  return isHome(f)
    ? { scored: f.home.score ?? 0, conceded: f.away.score ?? 0 }
    : { scored: f.away.score ?? 0, conceded: f.home.score ?? 0 }
}

function getResult(f: Fixture): 'W' | 'D' | 'L' | null {
  const s = getScore(f)
  if (!s || f.status !== 'finished') return null
  if (s.scored > s.conceded) return 'W'
  if (s.scored === s.conceded) return 'D'
  return 'L'
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Europe/London',
  })
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('en-GB', {
    hour: '2-digit', minute: '2-digit', timeZone: 'Europe/London',
  })
}

function ordinalSuffix(n: number) {
  const v = n % 100
  return n + (['th', 'st', 'nd', 'rd'][(v - 20) % 10] || ['th', 'st', 'nd', 'rd'][v] || 'th')
}

function FixtureCard({
  f,
  isCenter,
  rank,
}: {
  f: Fixture
  isCenter: boolean
  rank?: number
}) {
  const home = isHome(f)
  const opponent = home ? f.away : f.home
  const score = getScore(f)
  const result = getResult(f)
  const opp = teamColor(opponent.name)
  const primaryReadable = isReadableOnDark(opp.primary)
  const accentColor = primaryReadable ? opp.primary : '#009EE0'

  const resultBg = result === 'W' ? 'bg-green-500' : result === 'D' ? 'bg-amber-400' : 'bg-red-500'
  const cardW = isCenter ? 'w-44' : 'w-32'
  const logoSize = isCenter ? 'w-14 h-14' : 'w-10 h-10'
  const scoreText = isCenter ? 'text-3xl' : 'text-xl'

  const resultLabel = result === 'W' ? 'Win' : result === 'D' ? 'Draw' : result === 'L' ? 'Loss' : null
  const cardLabel = result
    ? `${home ? 'Home' : 'Away'} vs ${opponent.name}, ${score?.scored}–${score?.conceded}, ${resultLabel}`
    : `${home ? 'Home' : 'Away'} vs ${opponent.name}, ${formatDate(f.date)}`

  return (
    <div
      aria-label={cardLabel}
      className={`flex-shrink-0 flex flex-col items-center rounded-xl overflow-hidden gap-1.5 ${cardW}
        ${isCenter
          ? 'bg-gradient-to-b from-[#004d8c] to-[#001f47] text-white shadow-2xl ring-2 ring-[#009EE0] shadow-[0_0_24px_rgba(0,158,224,0.25)]'
          : 'bg-[#142843] text-gray-200 shadow'
        }`}
    >
      {/* Opposition color top stripe */}
      <div className="w-full h-1 shrink-0" style={{ backgroundColor: opp.primary }} aria-hidden="true" />

      <div className="flex flex-col items-center gap-1.5 px-3 pb-3 w-full">
        {/* Home / Away badge */}
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
          home
            ? isCenter ? 'bg-[#009EE0] text-white' : 'bg-[#009EE0]/20 text-[#009EE0]'
            : isCenter ? 'bg-white/20 text-white' : 'bg-white/10 text-gray-300'
        }`}>
          {home ? 'HOME' : 'AWAY'}
        </span>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={opponent.logo} alt={`${opponent.name} crest`} className={`${logoSize} object-contain`} />

        {/* Opponent name */}
        <span className={`font-medium text-center leading-tight ${
          isCenter ? 'text-sm text-gray-200' : 'text-xs text-gray-300'
        }`}>
          {opponent.name}
        </span>

        {/* League position badge in opposition color */}
        {rank !== undefined && (
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full"
            aria-label={`${ordinalSuffix(rank)} in the league`}
            style={{
              backgroundColor: `${accentColor}20`,
              color: accentColor,
              border: `1px solid ${accentColor}50`,
            }}
          >
            {ordinalSuffix(rank)}
          </span>
        )}

        {/* Score or date */}
        {f.status === 'finished' && score ? (
          <div className="flex flex-col items-center gap-1 mt-0.5">
            <span className={`${scoreText} font-bold tabular-nums ${isCenter ? 'text-white' : 'text-gray-100'}`} aria-hidden="true">
              {score.scored}–{score.conceded}
            </span>
            {result && (
              <span className={`text-xs font-bold text-white px-2 py-0.5 rounded-full ${resultBg}`} aria-hidden="true">{result}</span>
            )}
          </div>
        ) : f.status === 'live' ? (
          <div className="flex flex-col items-center gap-0.5 mt-0.5">
            <span className="text-red-400 font-bold text-xs animate-pulse" role="status" aria-label="Match is live">LIVE</span>
            <span className={`${scoreText} font-bold tabular-nums ${isCenter ? 'text-white' : 'text-gray-100'}`} aria-hidden="true">
              {score ? `${score.scored}–${score.conceded}` : '0–0'}
            </span>
          </div>
        ) : (
          <div className="flex flex-col items-center mt-0.5">
            <span className={`font-semibold ${isCenter ? 'text-sm text-[#009EE0]' : 'text-xs text-gray-300'}`}>
              {formatDate(f.date)}
            </span>
            <span className={`text-xs ${isCenter ? 'text-gray-300' : 'text-gray-400'}`}>
              {formatTime(f.date)}
            </span>
          </div>
        )}

        {f.round && (
          <span className={`text-xs text-center mt-auto ${isCenter ? 'text-gray-400' : 'text-gray-400'}`}>
            {f.round}
          </span>
        )}
      </div>
    </div>
  )
}

export default function FixturesSection({
  fixtures,
  standings,
}: {
  fixtures: Fixture[]
  standings: StandingEntry[]
}) {
  if (!fixtures?.length) {
    return (
      <section className="bg-[#0e1f35]/90 backdrop-blur-sm rounded-2xl shadow-xl p-4" aria-label="Fixtures and results">
        <h2 className="font-bold text-lg text-white mb-2">Fixtures &amp; Results</h2>
        <p className="text-gray-400 text-sm">No fixture data available</p>
      </section>
    )
  }

  const rankMap = new Map(standings.map(s => [s.team.id, s.rank]))

  const sorted = [...fixtures].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  const live = sorted.filter(f => f.status === 'live')
  const upcoming = sorted.filter(f => f.status === 'upcoming')
  const center = live[0] ?? upcoming[0]
  if (!center) return null

  const ci = sorted.indexOf(center)
  const display = [
    sorted[ci - 2],
    sorted[ci - 1],
    center,
    sorted[ci + 1],
    sorted[ci + 2],
  ].filter(Boolean) as Fixture[]

  return (
    <section className="bg-[#0e1f35]/90 backdrop-blur-sm rounded-2xl shadow-xl p-4" aria-label="Fixtures and results">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-lg text-white">Fixtures &amp; Results</h2>
        <Link
          href="/fixtures"
          className="text-xs bg-gradient-to-b from-[#40c4f5] to-[#0077b5] text-white px-3 py-1.5 rounded-lg font-semibold shadow-[0_2px_6px_rgba(0,90,160,0.45),inset_0_1px_0_rgba(255,255,255,0.25)] hover:from-[#55ccff] hover:to-[#0088cc] active:from-[#0077b5] active:to-[#005590] transition-all focus:outline-none focus:ring-2 focus:ring-[#009EE0]"
        >
          View all
        </Link>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 justify-start sm:justify-center items-center" role="list" aria-label="Recent and upcoming fixtures">
        {display.map(f => {
          const opponentId = isHome(f) ? f.away.id : f.home.id
          return (
            <div key={f.id} role="listitem">
              <FixtureCard
                f={f}
                isCenter={f.id === center.id}
                rank={rankMap.get(opponentId)}
              />
            </div>
          )
        })}
      </div>
    </section>
  )
}

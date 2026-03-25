'use client'

import Link from 'next/link'
import type { Fixture, StandingEntry } from '../lib/football'
import { WYCOMBE_ESPN_ID } from '../lib/football'
import { teamColor, isReadableOnDark } from '../lib/teamColors'
import ScoreboardTitle from './ScoreboardTitle'

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

function FixtureCard({ f, isCenter, rank }: { f: Fixture; isCenter: boolean; rank?: number }) {
  const home = isHome(f)
  const opponent = home ? f.away : f.home
  const score = getScore(f)
  const result = getResult(f)
  const opp = teamColor(opponent.name)
  const primaryReadable = isReadableOnDark(opp.primary)
  const accentColor = primaryReadable ? opp.primary : '#009EE0'

  const resultNeon =
    result === 'W' ? 'border-green-400 text-green-300' :
    result === 'D' ? 'border-amber-400 text-amber-300' :
    'border-red-500 text-red-400'

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
      className={`flex-shrink-0 flex flex-col items-center rounded-xl overflow-hidden gap-1.5 ${cardW} ${
        isCenter
          ? 'bg-[#020e1e] border border-[#009EE0]/50'
          : 'bg-[#060f1a] border border-[#009EE0]/10'
      }`}
      style={isCenter ? { boxShadow: '0 0 30px rgba(0,158,224,0.18), inset 0 0 20px rgba(0,158,224,0.02)' } : undefined}
    >
      <div className="w-full h-0.5 shrink-0" style={{ backgroundColor: accentColor }} aria-hidden="true" />

      <div className="flex flex-col items-center gap-1.5 px-3 pb-3 w-full">
        <span className={`text-xs font-semibold px-2 py-0.5 rounded uppercase tracking-wider ${
          home
            ? isCenter ? 'border border-[#009EE0]/60 text-[#009EE0]' : 'border border-[#009EE0]/20 text-[#009EE0]'
            : isCenter ? 'border border-white/20 text-[#cce4f5]' : 'border border-white/10 text-[#cce4f5]'
        }`}>
          {home ? 'HOME' : 'AWAY'}
        </span>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={opponent.logo} alt={`${opponent.name} crest`} className={`${logoSize} object-contain`} />

        <span className={`font-medium text-center leading-tight ${isCenter ? 'text-sm text-[#cce4f5]' : 'text-xs text-[#cce4f5]'}`}>
          {opponent.name}
        </span>

        {rank !== undefined && (
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded uppercase tracking-wider"
            aria-label={`${ordinalSuffix(rank)} in the league`}
            style={{ backgroundColor: `${accentColor}15`, color: accentColor, border: `1px solid ${accentColor}40` }}
          >
            {ordinalSuffix(rank)}
          </span>
        )}

        {f.status === 'finished' && score ? (
          <div className="flex flex-col items-center gap-1 mt-0.5">
            <span
              className={`${scoreText} font-bold tabular-nums ${isCenter ? 'text-white' : 'text-[#cce4f5]'}`}
              aria-hidden="true"
              style={isCenter ? { textShadow: '0 0 12px rgba(255,255,255,0.25)' } : undefined}
            >
              {score.scored}–{score.conceded}
            </span>
            {result && (
              <span className={`text-xs font-bold px-2 py-0.5 rounded border ${resultNeon}`} aria-hidden="true">
                {result}
              </span>
            )}
          </div>
        ) : f.status === 'live' ? (
          <div className="flex flex-col items-center gap-0.5 mt-0.5">
            <span className="text-green-400 font-bold text-xs animate-pulse" role="status" aria-label="Match is live">LIVE</span>
            <span className={`${scoreText} font-bold tabular-nums text-white`} aria-hidden="true">
              {score ? `${score.scored}–${score.conceded}` : '0–0'}
            </span>
          </div>
        ) : (
          <div className="flex flex-col items-center mt-0.5">
            <span
              className={`font-semibold ${isCenter ? 'text-sm text-[#009EE0]' : 'text-xs text-[#009EE0]'}`}
              style={isCenter ? { textShadow: '0 0 8px rgba(0,158,224,0.5)' } : undefined}
            >
              {formatDate(f.date)}
            </span>
            <span className="text-xs text-[#cce4f5]">
              {formatTime(f.date)}
            </span>
          </div>
        )}

        {f.round && (
          <span className="text-xs text-center mt-auto text-[#009EE0]">
            {f.round}
          </span>
        )}
      </div>
    </div>
  )
}

export default function FixturesSection({ fixtures, standings }: { fixtures: Fixture[]; standings: StandingEntry[] }) {
  if (!fixtures?.length) {
    return (
      <section className="bg-[#060f1a]/96 backdrop-blur-sm rounded-xl border border-[#009EE0]/15 p-4" aria-label="Fixtures and results">
        <h2 className="sr-only">Fixtures &amp; Results</h2>
        <ScoreboardTitle text="Fixtures & Results" />
        <p className="text-[#cce4f5] text-sm">No fixture data available</p>
      </section>
    )
  }

  const rankMap = new Map(standings.map(s => [s.team.id, s.rank]))
  const sorted = [...fixtures].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  const live = sorted.filter(f => f.status === 'live')
  const upcoming = sorted.filter(f => f.status === 'upcoming')
  const center = live[0] ?? upcoming[0]
  if (!center) return null

  const ci = sorted.indexOf(center)
  const display = [sorted[ci - 2], sorted[ci - 1], center, sorted[ci + 1], sorted[ci + 2]].filter(Boolean) as Fixture[]

  return (
    <section
      className="bg-[#060f1a]/96 backdrop-blur-sm rounded-xl border border-[#009EE0]/15 p-4"
      style={{ boxShadow: '0 0 25px rgba(0,158,224,0.05)' }}
      aria-label="Fixtures and results"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="sr-only">Fixtures &amp; Results</h2>
        <ScoreboardTitle text="Fixtures & Results" />
        <Link
          href="/fixtures"
          className="text-xs border border-[#009EE0]/40 text-[#009EE0] px-3 py-1.5 rounded font-semibold uppercase tracking-wider hover:bg-[#009EE0]/8 hover:border-[#009EE0]/80 transition-all focus:outline-none focus:ring-2 focus:ring-[#009EE0]/50"
          style={{ textShadow: '0 0 8px rgba(0,158,224,0.4)' }}
        >
          View all
        </Link>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 justify-start sm:justify-center items-center" role="list" aria-label="Recent and upcoming fixtures">
        {display.map(f => {
          const opponentId = isHome(f) ? f.away.id : f.home.id
          return (
            <div key={f.id} role="listitem">
              <FixtureCard f={f} isCenter={f.id === center.id} rank={rankMap.get(opponentId)} />
            </div>
          )
        })}
      </div>
    </section>
  )
}

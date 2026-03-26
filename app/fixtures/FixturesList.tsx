'use client'

import { useRef, useLayoutEffect } from 'react'
import type { Fixture } from '../lib/football'
import { TEAM_ESPN_ID } from '../lib/football'

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
    timeZone: 'Europe/London',
  })
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('en-GB', {
    hour: '2-digit', minute: '2-digit', timeZone: 'Europe/London',
  })
}

function FixtureRow({
  fixture,
  isNext,
  anchorRef,
}: {
  fixture: Fixture
  isNext: boolean
  anchorRef?: React.RefObject<HTMLDivElement | null>
}) {
  const isWycHome = fixture.home.id === TEAM_ESPN_ID
  const isFinished = fixture.status === 'finished'
  const isLive = fixture.status === 'live'
  const isPostponed = fixture.status === 'postponed'

  const wycScore = isWycHome ? fixture.home.score : fixture.away.score
  const oppScore = isWycHome ? fixture.away.score : fixture.home.score
  const result = isFinished && wycScore != null && oppScore != null
    ? wycScore > oppScore ? 'W' : wycScore === oppScore ? 'D' : 'L'
    : null

  const resultColor = result === 'W' ? 'text-green-400' : result === 'L' ? 'text-red-400' : 'text-amber-400'

  const scoreLabel = isFinished && wycScore != null && oppScore != null
    ? `${fixture.home.name} ${fixture.home.score} - ${fixture.away.score} ${fixture.away.name}, result: ${result === 'W' ? 'Win' : result === 'L' ? 'Loss' : 'Draw'}`
    : `${fixture.home.name} vs ${fixture.away.name}, ${formatDate(fixture.date)}`

  return (
    <div
      ref={anchorRef}
      aria-label={scoreLabel}
      className={`rounded-xl border px-4 py-3 ${
        isNext
          ? 'border-[#e30613]/50 bg-[#e30613]/5 shadow-[0_0_15px_rgba(227,6,19,0.12)]'
          : isLive
            ? 'border-green-500/40 bg-green-500/5'
            : 'border-[#e30613]/8 bg-[#060f1a]/60'
      }`}
    >
      <div className="flex items-center gap-2">
        {/* Date / status */}
        <div className="w-28 shrink-0 text-left">
          {isLive ? (
            <span className="text-green-400 font-bold text-xs animate-pulse" role="status" aria-label="Match is live">LIVE</span>
          ) : isPostponed ? (
            <span className="text-[#e30613] text-xs">Postponed</span>
          ) : isNext ? (
            <div>
              <div className="text-xs text-[#e30613] font-medium">Next match</div>
              <div className="text-xs text-[#cce4f5]">{formatDate(fixture.date)}</div>
              <div className="text-xs text-[#e30613]/50">{formatTime(fixture.date)}</div>
            </div>
          ) : (
            <div>
              <div className="text-xs text-[#cce4f5]">{formatDate(fixture.date)}</div>
              {!isFinished && <div className="text-xs text-[#e30613]/50">{formatTime(fixture.date)}</div>}
            </div>
          )}
        </div>

        {/* Teams + score */}
        <div className="flex-1 flex items-center gap-2 min-w-0">
          <div className={`flex items-center gap-1.5 flex-1 justify-end min-w-0 ${fixture.home.id === TEAM_ESPN_ID ? 'font-bold text-[#e30613]' : 'text-[#cce4f5]'}`}>
            <span className="truncate text-sm">{fixture.home.name}</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={fixture.home.logo} alt="" aria-hidden="true" className="w-5 h-5 object-contain shrink-0" />
          </div>

          <div className="shrink-0 w-16 text-center">
            {isFinished || isLive ? (
              <span className={`font-bold text-base ${result ? resultColor : 'text-[#cce4f5]'}`} aria-hidden="true">
                {fixture.home.score} – {fixture.away.score}
              </span>
            ) : (
              <span className="text-[#e30613]/50 text-sm font-medium">vs</span>
            )}
          </div>

          <div className={`flex items-center gap-1.5 flex-1 justify-start min-w-0 ${fixture.away.id === TEAM_ESPN_ID ? 'font-bold text-[#e30613]' : 'text-[#cce4f5]'}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={fixture.away.logo} alt="" aria-hidden="true" className="w-5 h-5 object-contain shrink-0" />
            <span className="truncate text-sm">{fixture.away.name}</span>
          </div>
        </div>

        {/* Result badge */}
        <div className="w-8 shrink-0 flex items-center justify-end">
          {result && (
            <span
              aria-label={result === 'W' ? 'Win' : result === 'L' ? 'Loss' : 'Draw'}
              className={`w-5 h-5 rounded-full text-[9px] flex items-center justify-center font-bold border ${
                result === 'W' ? 'border-green-400 text-green-300' :
                result === 'L' ? 'border-red-500 text-red-400' :
                'border-amber-400 text-amber-300'
              }`}
            >
              {result}
            </span>
          )}
        </div>

      </div>

      {fixture.round && (
        <div className="text-xs text-[#e30613]/50 mt-0.5 pl-28">{fixture.round}</div>
      )}
    </div>
  )
}


export default function FixturesList({
  fixtures,
}: {
  fixtures: Fixture[]
}) {
  const sorted = [...fixtures].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  const nextIdx = sorted.findIndex(f => f.status === 'upcoming' || f.status === 'live')
  const nextRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    if (nextRef.current) {
      nextRef.current.scrollIntoView({ behavior: 'instant' as ScrollBehavior, block: 'start' })
      window.scrollBy({ top: -80, behavior: 'instant' as ScrollBehavior })
    }
  }, [])

  if (!sorted.length) {
    return <p className="text-[#e30613]/50 text-sm">No fixture data available.</p>
  }

  return (
    <ol className="space-y-2 list-none" aria-label="Fixtures and results">
      {sorted.map((f, i) => (
        <li key={f.id}>
          <FixtureRow
            fixture={f}
            isNext={i === nextIdx}
            anchorRef={i === nextIdx ? nextRef : undefined}
          />
        </li>
      ))}
    </ol>
  )
}

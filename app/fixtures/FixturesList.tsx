'use client'

import { useRef, useLayoutEffect } from 'react'
import type { Fixture } from '../lib/football'
import { WYCOMBE_ESPN_ID } from '../lib/football'

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
  const isWycHome = fixture.home.id === WYCOMBE_ESPN_ID
  const isFinished = fixture.status === 'finished'
  const isLive = fixture.status === 'live'
  const isPostponed = fixture.status === 'postponed'

  const wycScore = isWycHome ? fixture.home.score : fixture.away.score
  const oppScore = isWycHome ? fixture.away.score : fixture.home.score
  const result = isFinished && wycScore != null && oppScore != null
    ? wycScore > oppScore ? 'W' : wycScore === oppScore ? 'D' : 'L'
    : null

  const resultColor = result === 'W' ? 'text-green-400' : result === 'L' ? 'text-red-400' : 'text-amber-400'

  return (
    <div
      ref={anchorRef}
      className={`rounded-xl border px-4 py-3 ${
        isNext
          ? 'border-[#009EE0]/50 bg-[#009EE0]/5 ring-1 ring-[#009EE0]/20'
          : isLive
            ? 'border-green-500/40 bg-green-500/5'
            : 'border-white/10 bg-[#0e1f35]/60'
      }`}
    >
      <div className="flex items-center gap-2">
        {/* Date / status */}
        <div className="w-28 shrink-0 text-left">
          {isLive ? (
            <span className="text-green-400 font-bold text-xs animate-pulse">LIVE</span>
          ) : isPostponed ? (
            <span className="text-gray-500 text-xs">Postponed</span>
          ) : isNext ? (
            <div>
              <div className="text-xs text-[#009EE0] font-medium">Next match</div>
              <div className="text-xs text-gray-400">{formatDate(fixture.date)}</div>
              <div className="text-xs text-gray-500">{formatTime(fixture.date)}</div>
            </div>
          ) : (
            <div>
              <div className="text-xs text-gray-400">{formatDate(fixture.date)}</div>
              {!isFinished && <div className="text-xs text-gray-600">{formatTime(fixture.date)}</div>}
            </div>
          )}
        </div>

        {/* Teams + score */}
        <div className="flex-1 flex items-center gap-2 min-w-0">
          <div className={`flex items-center gap-1.5 flex-1 justify-end min-w-0 ${fixture.home.id === WYCOMBE_ESPN_ID ? 'font-bold text-[#009EE0]' : 'text-gray-200'}`}>
            <span className="truncate text-sm">{fixture.home.name}</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={fixture.home.logo} alt="" className="w-5 h-5 object-contain shrink-0" />
          </div>

          <div className="shrink-0 w-16 text-center">
            {isFinished || isLive ? (
              <span className={`font-bold text-base ${result ? resultColor : 'text-gray-200'}`}>
                {fixture.home.score} – {fixture.away.score}
              </span>
            ) : (
              <span className="text-gray-500 text-sm font-medium">vs</span>
            )}
          </div>

          <div className={`flex items-center gap-1.5 flex-1 justify-start min-w-0 ${fixture.away.id === WYCOMBE_ESPN_ID ? 'font-bold text-[#009EE0]' : 'text-gray-200'}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={fixture.away.logo} alt="" className="w-5 h-5 object-contain shrink-0" />
            <span className="truncate text-sm">{fixture.away.name}</span>
          </div>
        </div>

        {/* Result badge */}
        <div className="w-8 shrink-0 flex items-center justify-end">
          {result && (
            <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full border ${
              result === 'W' ? 'bg-green-500/10 border-green-500/30 text-green-400' :
              result === 'L' ? 'bg-red-500/10 border-red-500/30 text-red-400' :
              'bg-amber-400/10 border-amber-400/30 text-amber-400'
            }`}>{result}</span>
          )}
        </div>
      </div>

      {fixture.round && (
        <div className="text-xs text-gray-600 mt-0.5 pl-28">{fixture.round}</div>
      )}
    </div>
  )
}

const DUFF_APPOINTED = new Date('2025-09-18T00:00:00Z')

export default function FixturesList({ fixtures }: { fixtures: Fixture[] }) {
  const sorted = [...fixtures].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  const nextIdx = sorted.findIndex(f => f.status === 'upcoming' || f.status === 'live')
  const nextRef = useRef<HTMLDivElement>(null)
  const duffIdx = sorted.findIndex(f => new Date(f.date) >= DUFF_APPOINTED)

  useLayoutEffect(() => {
    if (nextRef.current) {
      nextRef.current.scrollIntoView({ behavior: 'instant' as ScrollBehavior, block: 'start' })
      window.scrollBy({ top: -80, behavior: 'instant' as ScrollBehavior })
    }
  }, [])

  if (!sorted.length) {
    return <p className="text-gray-500 text-sm">No fixture data available.</p>
  }

  return (
    <div className="space-y-2">
      {sorted.map((f, i) => (
        <div key={f.id}>
          {i === duffIdx && (
            <div className="flex items-center gap-3 py-2 mb-1">
              <div className="flex-1 h-px bg-[#009EE0]/30" />
              <span className="text-xs font-semibold text-[#009EE0] whitespace-nowrap tracking-wide">
                Mike Duff appointed — 18 Sep 2025
              </span>
              <div className="flex-1 h-px bg-[#009EE0]/30" />
            </div>
          )}
          <FixtureRow
            fixture={f}
            isNext={i === nextIdx}
            anchorRef={i === nextIdx ? nextRef : undefined}
          />
        </div>
      ))}
    </div>
  )
}

'use client'

import { useRef, useLayoutEffect } from 'react'
import type { Fixture } from '../lib/football'
import { WYCOMBE_ESPN_ID } from '../lib/football'
import type { HighlightVideo } from '../lib/youtube'

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
  highlight,
}: {
  fixture: Fixture
  isNext: boolean
  anchorRef?: React.RefObject<HTMLDivElement | null>
  highlight?: HighlightVideo | null
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

  const scoreLabel = isFinished && wycScore != null && oppScore != null
    ? `${fixture.home.name} ${fixture.home.score} - ${fixture.away.score} ${fixture.away.name}, result: ${result === 'W' ? 'Win' : result === 'L' ? 'Loss' : 'Draw'}`
    : `${fixture.home.name} vs ${fixture.away.name}, ${formatDate(fixture.date)}`

  return (
    <div
      ref={anchorRef}
      aria-label={scoreLabel}
      className={`rounded-xl border px-4 py-3 ${
        isNext
          ? 'border-[#009EE0]/50 bg-[#009EE0]/5 shadow-[0_0_15px_rgba(0,158,224,0.12)]'
          : isLive
            ? 'border-green-500/40 bg-green-500/5'
            : 'border-[#009EE0]/8 bg-[#060f1a]/60'
      }`}
    >
      <div className="flex items-center gap-2">
        {/* Date / status */}
        <div className="w-28 shrink-0 text-left">
          {isLive ? (
            <span className="text-green-400 font-bold text-xs animate-pulse" role="status" aria-label="Match is live">LIVE</span>
          ) : isPostponed ? (
            <span className="text-[#009EE0] text-xs">Postponed</span>
          ) : isNext ? (
            <div>
              <div className="text-xs text-[#009EE0] font-medium">Next match</div>
              <div className="text-xs text-[#cce4f5]">{formatDate(fixture.date)}</div>
              <div className="text-xs text-[#009EE0]/50">{formatTime(fixture.date)}</div>
            </div>
          ) : (
            <div>
              <div className="text-xs text-[#cce4f5]">{formatDate(fixture.date)}</div>
              {!isFinished && <div className="text-xs text-[#009EE0]/50">{formatTime(fixture.date)}</div>}
            </div>
          )}
        </div>

        {/* Teams + score */}
        <div className="flex-1 flex items-center gap-2 min-w-0">
          <div className={`flex items-center gap-1.5 flex-1 justify-end min-w-0 ${fixture.home.id === WYCOMBE_ESPN_ID ? 'font-bold text-[#009EE0]' : 'text-[#cce4f5]'}`}>
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
              <span className="text-[#009EE0]/50 text-sm font-medium">vs</span>
            )}
          </div>

          <div className={`flex items-center gap-1.5 flex-1 justify-start min-w-0 ${fixture.away.id === WYCOMBE_ESPN_ID ? 'font-bold text-[#009EE0]' : 'text-[#cce4f5]'}`}>
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

        {/* Highlights link */}
        <div className="w-7 shrink-0 flex items-center justify-end">
          {highlight && (
            <a
              href={`https://www.youtube.com/watch?v=${highlight.videoId}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Watch highlights: ${highlight.title}`}
              title={highlight.title}
              className="text-red-500 hover:text-red-400 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 rounded"
            >
              {/* YouTube play icon */}
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor" aria-hidden="true">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
            </a>
          )}
        </div>
      </div>

      {fixture.round && (
        <div className="text-xs text-[#009EE0]/50 mt-0.5 pl-28">{fixture.round}</div>
      )}
    </div>
  )
}

const DUFF_APPOINTED = new Date('2025-09-18T00:00:00Z')

export default function FixturesList({
  fixtures,
  highlights = {},
}: {
  fixtures: Fixture[]
  highlights?: Record<string, HighlightVideo | null>
}) {
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
    return <p className="text-[#009EE0]/50 text-sm">No fixture data available.</p>
  }

  return (
    <ol className="space-y-2 list-none" aria-label="Fixtures and results">
      {sorted.map((f, i) => (
        <li key={f.id}>
          {i === duffIdx && (
            <div className="flex items-center gap-3 py-2 mb-1" role="separator" aria-label="Mike Duff appointed manager">
              <div className="flex-1 h-px bg-[#009EE0]/30" aria-hidden="true" />
              <span className="text-xs font-semibold text-[#009EE0] whitespace-nowrap tracking-wide">
                Mike Duff appointed — 18 Sep 2025
              </span>
              <div className="flex-1 h-px bg-[#009EE0]/30" aria-hidden="true" />
            </div>
          )}
          <FixtureRow
            fixture={f}
            isNext={i === nextIdx}
            anchorRef={i === nextIdx ? nextRef : undefined}
            highlight={highlights[f.id]}
          />
        </li>
      ))}
    </ol>
  )
}

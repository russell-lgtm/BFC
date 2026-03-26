import type { Fixture } from '../lib/football'
import { TEAM_ESPN_ID } from '../lib/football'
import { teamColor } from '../lib/teamColors'

function formatMatchDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/London',
  })
}

export default function MatchHero({
  lastResult,
  heroImage,
}: {
  lastResult: Fixture | null
  heroImage: { url: string; caption: string } | null
}) {
  if (!lastResult) return null

  const isHome = lastResult.home.id === TEAM_ESPN_ID
  const opponent = isHome ? lastResult.away : lastResult.home
  const scored = isHome ? (lastResult.home.score ?? 0) : (lastResult.away.score ?? 0)
  const conceded = isHome ? (lastResult.away.score ?? 0) : (lastResult.home.score ?? 0)
  const result = scored > conceded ? 'W' : scored === conceded ? 'D' : 'L'

  const opp = teamColor(opponent.name)
  const resultLabel = result === 'W' ? 'WIN' : result === 'D' ? 'DRAW' : 'LOSS'
  const resultBg = result === 'W' ? '#22c55e' : result === 'D' ? '#f59e0b' : '#ef4444'

  return (
    <section className="relative overflow-hidden rounded-2xl shadow-xl min-h-[160px]">
      {/* Photo background */}
      {heroImage?.url && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={heroImage.url}
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover object-center scale-110"
          style={{ filter: 'blur(4px) brightness(0.35)' }}
        />
      )}
      {/* Navy gradient overlay (always shown, doubles as fallback bg) */}
      <div
        className="absolute inset-0"
        style={{
          background: heroImage?.url
            ? 'linear-gradient(135deg, rgba(0,33,71,0.55) 0%, rgba(0,33,71,0.8) 100%)'
            : 'linear-gradient(135deg, #002147 0%, #003a7a 100%)',
        }}
      />

      {/* Opposition color top stripe */}
      <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: opp.primary }} />

      {/* Content */}
      <div className="relative px-5 pt-5 pb-4 text-white">
        {/* Meta row */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-semibold text-[#e30613] uppercase tracking-widest">
            Last Result
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-blue-200">{formatMatchDate(lastResult.date)}</span>
            <span
              className="text-xs font-bold px-2.5 py-0.5 rounded-full"
              style={{ backgroundColor: resultBg }}
            >
              {resultLabel}
            </span>
          </div>
        </div>

        {/* Score row */}
        <div className="flex items-center justify-between gap-4">
          {/* Wycombe side */}
          <div className="flex flex-col items-center gap-1.5 w-24">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://a.espncdn.com/i/teamlogos/soccer/500/337.png"
              alt="Brentford FC"
              className="w-14 h-14 object-contain drop-shadow-lg"
            />
            <span className="text-xs font-semibold text-center text-blue-100 leading-tight">
              Wycombe{'\n'}Wanderers
            </span>
          </div>

          {/* Score */}
          <div className="flex flex-col items-center">
            <div className="text-5xl font-black tracking-tighter tabular-nums">
              {scored}
              <span className="text-[#e30613] mx-1">–</span>
              {conceded}
            </div>
            <span className="text-xs text-blue-300 mt-1 capitalize">
              {isHome ? 'Home' : 'Away'} · {lastResult.round || 'League One'}
            </span>
          </div>

          {/* Opponent side */}
          <div className="flex flex-col items-center gap-1.5 w-24">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={opponent.logo}
              alt={opponent.name}
              className="w-14 h-14 object-contain drop-shadow-lg"
            />
            <span className="text-xs font-semibold text-center leading-tight" style={{ color: opp.primary === '#FFFFFF' ? '#e5e7eb' : opp.primary }}>
              {opponent.name}
            </span>
          </div>
        </div>
      </div>

      {/* Opposition color bottom stripe */}
      <div className="h-1.5" style={{ backgroundColor: opp.primary }} />
    </section>
  )
}

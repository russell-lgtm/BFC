import type { RefereeStats } from '../lib/referee'

function RefereeAvatar() {
  return (
    <svg viewBox="0 0 80 80" width={72} height={72} aria-hidden="true">
      {/* Background circle */}
      <circle cx="40" cy="40" r="40" fill="#142843" />
      {/* Head */}
      <circle cx="40" cy="24" r="11" fill="#c9a87c" />
      {/* Neck */}
      <rect x="36" y="33" width="8" height="6" fill="#c9a87c" rx="2" />
      {/* Referee shirt — black with yellow collar band */}
      <path d="M20 40 Q20 36 28 35 L36 38 L44 38 L52 35 Q60 36 60 40 L63 72 L17 72 Z" fill="#1a1a1a" />
      {/* Yellow collar band */}
      <path d="M28 35 L36 38 L36 44 L40 46 L44 44 L44 38 L52 35 Q48 42 40 44 Q32 42 28 35 Z" fill="#f5c518" />
      {/* Whistle on lanyard */}
      <line x1="40" y1="46" x2="35" y2="55" stroke="#f5c518" strokeWidth="1.5" />
      <rect x="32" y="55" width="7" height="4" rx="2" fill="#aaa" />
    </svg>
  )
}

export default function RefereeWatch({ stats }: { stats: RefereeStats | null }) {
  if (!stats) {
    return (
      <section
        className="bg-[#0e1f35]/90 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden"
        aria-label="Referee Watch"
      >
        <div className="h-1 w-full bg-[#f5c518]" aria-hidden="true" />
        <div className="p-4">
          <h2 className="font-bold text-lg text-white mb-2">Referee Watch</h2>
          <p className="text-gray-400 text-sm">Referee not yet announced for next fixture.</p>
        </div>
        <div className="h-1 w-full bg-[#f5c518]" aria-hidden="true" />
      </section>
    )
  }

  const { name, gamesWithWycombe, wycombeRecord, yellowCards, redCards } = stats
  const totalWycGames = wycombeRecord.w + wycombeRecord.d + wycombeRecord.l

  return (
    <section
      className="bg-[#0e1f35]/90 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden"
      aria-label={`Referee Watch: ${name}`}
    >
      {/* Yellow top stripe — classic referee yellow */}
      <div className="h-1 w-full bg-[#f5c518]" aria-hidden="true" />

      <div className="p-4">
        <h2 className="font-bold text-lg text-white mb-4">Referee Watch</h2>

        <div className="flex items-start gap-5">
          {/* Avatar */}
          <div className="shrink-0">
            <RefereeAvatar />
            <p className="text-center text-xs text-gray-400 mt-1.5 max-w-[72px] leading-tight">
              {name}
            </p>
          </div>

          {/* Stats */}
          <div className="flex-1 min-w-0 space-y-4">
            {/* Wycombe record with this referee */}
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Wycombe Record This Season
                {gamesWithWycombe === 0 && (
                  <span className="ml-2 text-gray-500 normal-case tracking-normal font-normal">
                    (first Wycombe game)
                  </span>
                )}
              </h3>
              {totalWycGames > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'W', value: wycombeRecord.w, color: 'text-green-400', full: 'Wins' },
                    { label: 'D', value: wycombeRecord.d, color: 'text-amber-400', full: 'Draws' },
                    { label: 'L', value: wycombeRecord.l, color: 'text-red-400', full: 'Losses' },
                  ].map(({ label, value, color, full }) => (
                    <div
                      key={label}
                      className="bg-[#142843] rounded-lg py-2 flex flex-col items-center"
                      aria-label={`${full}: ${value}`}
                    >
                      <span className={`text-lg font-bold ${color}`} aria-hidden="true">{value}</span>
                      <span className="text-xs text-gray-400" aria-hidden="true">{label}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">No previous Wycombe games with this referee this season.</p>
              )}
            </div>

            {/* Cards in Wycombe games */}
            {totalWycGames > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Cards in Wycombe Games
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <div
                    className="bg-[#142843] rounded-lg py-2 flex items-center justify-center gap-2"
                    aria-label={`Yellow cards: ${yellowCards}`}
                  >
                    <span className="w-3 h-4 rounded-sm bg-[#f5c518] shrink-0" aria-hidden="true" />
                    <span className="text-lg font-bold text-[#f5c518]" aria-hidden="true">{yellowCards}</span>
                    <span className="text-xs text-gray-400">Yellow</span>
                  </div>
                  <div
                    className="bg-[#142843] rounded-lg py-2 flex items-center justify-center gap-2"
                    aria-label={`Red cards: ${redCards}`}
                  >
                    <span className="w-3 h-4 rounded-sm bg-red-500 shrink-0" aria-hidden="true" />
                    <span className="text-lg font-bold text-red-400" aria-hidden="true">{redCards}</span>
                    <span className="text-xs text-gray-400">Red</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1.5">
                  Across {gamesWithWycombe} Wycombe game{gamesWithWycombe !== 1 ? 's' : ''} this season
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="h-1 w-full bg-[#f5c518]" aria-hidden="true" />
    </section>
  )
}

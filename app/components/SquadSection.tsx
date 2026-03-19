'use client'

import type { Player } from '../lib/football'

function JerseyAvatar({ jersey }: { jersey: string }) {
  return (
    <div className="w-8 h-8 rounded-full bg-[#002147] border border-[#009EE0]/40 flex items-center justify-center shrink-0" aria-hidden="true">
      <span className="font-bold text-[#009EE0] text-xs leading-none">{jersey || '?'}</span>
    </div>
  )
}

function PlayerRow({ p, statValue, statLabel }: { p: Player; statValue: number; statLabel: string }) {
  return (
    <div className="flex items-center gap-2 p-2 bg-[#142843]/80 rounded-xl">
      <JerseyAvatar jersey={p.jersey} />
      <div className="flex-1 min-w-0">
        <div className="font-medium text-xs truncate text-gray-100">{p.name}</div>
        <div className="text-xs text-gray-400">{p.position}</div>
      </div>
      <div className="text-right shrink-0">
        <div className="text-base font-bold text-[#009EE0]">{statValue}</div>
        <div className="text-xs text-gray-400">{statLabel}</div>
      </div>
    </div>
  )
}

export default function SquadSection({ squad }: { squad: Player[] }) {
  const topApps = [...squad]
    .filter(p => p.appearances > 0)
    .sort((a, b) => b.appearances - a.appearances)
    .slice(0, 6)

  const topScorers = [...squad]
    .filter(p => p.goals > 0)
    .sort((a, b) => b.goals - a.goals)
    .slice(0, 6)

  const topAssists = [...squad]
    .filter(p => p.assists > 0)
    .sort((a, b) => b.assists - a.assists || b.appearances - a.appearances)
    .slice(0, 6)

  return (
    <section className="bg-[#0e1f35]/90 backdrop-blur-sm rounded-2xl shadow-xl p-4" aria-label="Squad stats">
      <div className="flex items-start justify-between mb-4 gap-4">
        <h2 className="font-bold text-lg text-white">Squad Stats</h2>
        <span className="text-xs text-gray-400 italic text-right">* Season totals — may include goals from previous clubs</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Appearances */}
        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Appearances
          </h3>
          {topApps.length === 0 ? (
            <p className="text-gray-400 text-sm">No data</p>
          ) : (
            <div className="space-y-1.5">
              {topApps.map(p => (
                <PlayerRow key={p.id} p={p} statValue={p.appearances} statLabel="apps" />
              ))}
            </div>
          )}
        </div>

        {/* Top Scorers */}
        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Top Scorers *
          </h3>
          {topScorers.length === 0 ? (
            <p className="text-gray-400 text-sm">No data</p>
          ) : (
            <div className="space-y-1.5">
              {topScorers.map(p => (
                <PlayerRow key={p.id} p={p} statValue={p.goals} statLabel="goals" />
              ))}
            </div>
          )}
        </div>

        {/* Top Assists */}
        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Top Assists
          </h3>
          {topAssists.length === 0 ? (
            <p className="text-gray-400 text-sm">No data</p>
          ) : (
            <div className="space-y-1.5">
              {topAssists.map(p => (
                <PlayerRow key={p.id} p={p} statValue={p.assists} statLabel="assists" />
              ))}
            </div>
          )}
        </div>
      </div>

      <p className="text-xs text-gray-400 mt-4">
        Player ratings are not available from free data sources for League One.
      </p>
    </section>
  )
}

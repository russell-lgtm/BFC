'use client'

import type { Player } from '../lib/football'

function JerseyAvatar({ jersey }: { jersey: string }) {
  return (
    <div className="w-8 h-8 rounded-full bg-[#030b14] border border-[#e30613]/30 flex items-center justify-center shrink-0" aria-hidden="true">
      <span className="font-bold text-[#e30613] text-xs leading-none">{jersey || '?'}</span>
    </div>
  )
}

function PlayerRow({ p, statValue, statLabel }: { p: Player; statValue: number; statLabel: string }) {
  return (
    <div className="flex items-center gap-2 p-2 bg-[#091627]/80 rounded-xl">
      <JerseyAvatar jersey={p.jersey} />
      <div className="flex-1 min-w-0">
        <div className="font-medium text-xs truncate text-[#cce4f5]">{p.name}</div>
        <div className="text-xs text-[#e30613]/50">{p.position}</div>
      </div>
      <div className="text-right shrink-0">
        <div className="text-base font-bold text-[#e30613]" style={{ textShadow: '0 0 8px rgba(227,6,19,0.5)' }}>{statValue}</div>
        <div className="text-xs text-[#e30613]/50">{statLabel}</div>
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
    <section className="bg-[#060f1a]/96 backdrop-blur-sm rounded-xl border border-[#e30613]/15 p-4" style={{ boxShadow: '0 0 25px rgba(227,6,19,0.05)' }} aria-label="Squad stats">
      <div className="flex items-start justify-between mb-4 gap-4">
        <h2 className="font-bold text-lg text-[#e30613] uppercase tracking-[0.08em]" style={{ textShadow: '0 0 12px rgba(227,6,19,0.4)' }}>Squad Stats</h2>
        <span className="text-xs text-[#e30613]/50 italic text-right">* Season totals — may include goals from previous clubs</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Appearances */}
        <div>
          <h3 className="text-xs font-semibold text-[#e30613]/55 uppercase tracking-[0.15em] mb-2">
            Appearances
          </h3>
          {topApps.length === 0 ? (
            <p className="text-[#e30613]/50 text-sm">No data</p>
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
          <h3 className="text-xs font-semibold text-[#e30613]/55 uppercase tracking-[0.15em] mb-2">
            Top Scorers *
          </h3>
          {topScorers.length === 0 ? (
            <p className="text-[#e30613]/50 text-sm">No data</p>
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
          <h3 className="text-xs font-semibold text-[#e30613]/55 uppercase tracking-[0.15em] mb-2">
            Top Assists
          </h3>
          {topAssists.length === 0 ? (
            <p className="text-[#e30613]/50 text-sm">No data</p>
          ) : (
            <div className="space-y-1.5">
              {topAssists.map(p => (
                <PlayerRow key={p.id} p={p} statValue={p.assists} statLabel="assists" />
              ))}
            </div>
          )}
        </div>
      </div>

      <p className="text-xs text-[#e30613]/50 mt-4">
        Player ratings are not available from free data sources for League One.
      </p>
    </section>
  )
}

'use client'

import { useState, useMemo } from 'react'
import type { StandingEntry, Fixture } from '../lib/football'
import { WYCOMBE_ESPN_ID } from '../lib/football'

type Period = 'season' | 'last10' | 'last5'
type View = 'all' | 'home' | 'away'

interface RowData extends StandingEntry {
  form: string
  seasonPPG: string | null // non-null only for season + home/away view
}

function computePeriodStats(
  teamId: string,
  results: Fixture[],
  view: View,
  limit: number,
): { played: number; won: number; drawn: number; lost: number; gf: number; ga: number; gd: number; points: number; form: string } {
  const games = results
    .filter(f => {
      if (f.status !== 'finished') return false
      const isHome = f.home.id === teamId
      const isAway = f.away.id === teamId
      if (!isHome && !isAway) return false
      if (view === 'home') return isHome
      if (view === 'away') return isAway
      return true
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, limit)

  let won = 0, drawn = 0, lost = 0, gf = 0, ga = 0
  const formChars: string[] = []
  for (const f of games) {
    const isHome = f.home.id === teamId
    const scored = isHome ? (f.home.score ?? 0) : (f.away.score ?? 0)
    const conceded = isHome ? (f.away.score ?? 0) : (f.home.score ?? 0)
    gf += scored; ga += conceded
    if (scored > conceded) { won++; formChars.push('W') }
    else if (scored === conceded) { drawn++; formChars.push('D') }
    else { lost++; formChars.push('L') }
  }
  return {
    played: games.length, won, drawn, lost, gf, ga,
    gd: gf - ga,
    points: won * 3 + drawn,
    form: formChars.join(''), // newest-first (will be reversed for display)
  }
}

// Season form: last 10 for form dots; full season for PPG (when home/away selected)
function seasonFormAndPPG(teamId: string, results: Fixture[], view: View): { form: string; ppg: string | null } {
  const games = results
    .filter(f => {
      if (f.status !== 'finished') return false
      const isHome = f.home.id === teamId
      const isAway = f.away.id === teamId
      if (!isHome && !isAway) return false
      if (view === 'home') return isHome
      if (view === 'away') return isAway
      return true
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const allResults = games.map(f => {
    const isHome = f.home.id === teamId
    const scored = isHome ? (f.home.score ?? 0) : (f.away.score ?? 0)
    const conceded = isHome ? (f.away.score ?? 0) : (f.home.score ?? 0)
    return scored > conceded ? 'W' : scored === conceded ? 'D' : 'L'
  })

  const form = allResults.slice(0, 10).join('') // last 10 for form dots
  const ppg = view !== 'all' && allResults.length > 0
    ? (() => {
        const pts = allResults.reduce((p, r) => p + (r === 'W' ? 3 : r === 'D' ? 1 : 0), 0)
        return (pts / allResults.length).toFixed(1)
      })()
    : null // null = use season points/played instead

  return { form, ppg }
}

function formPPG(form: string) {
  if (!form.length) return '–'
  const pts = form.split('').reduce((p, r) => p + (r === 'W' ? 3 : r === 'D' ? 1 : 0), 0)
  return (pts / form.length).toFixed(1)
}

// Render oldest→newest left-to-right (rightmost = most recent)
function FormDots({ form }: { form: string }) {
  if (!form) return <span className="text-[#009EE0]/50 text-xs">–</span>
  return (
    <div className="flex gap-0.5" aria-label={`Form: ${form.split('').reverse().map(r => r === 'W' ? 'Win' : r === 'D' ? 'Draw' : 'Loss').join(', ')}`}>
      {form.split('').reverse().map((r, i) => (
        <span
          key={i}
          aria-hidden="true"
          className={`w-5 h-5 rounded-full text-[9px] flex items-center justify-center font-bold border
            ${r === 'W' ? 'border-green-400 text-green-300' : r === 'D' ? 'border-amber-400 text-amber-300' : 'border-red-500 text-red-400'}`}
        >
          {r}
        </span>
      ))}
    </div>
  )
}

export default function LeagueTable({
  standings,
  recentResults,
}: {
  standings: StandingEntry[]
  recentResults: Fixture[]
}) {
  const [expanded, setExpanded] = useState(false)
  const [period, setPeriod] = useState<Period>('season')
  const [view, setView] = useState<View>('all')

  // Build the full ranked table for the selected period/view
  const tableData: RowData[] = useMemo(() => {
    if (!standings?.length) return []
    if (period === 'season') {
      return standings.map(s => {
        const { form, ppg } = seasonFormAndPPG(s.team.id, recentResults, view)
        return { ...s, form, seasonPPG: ppg }
      })
    }

    const limit = period === 'last5' ? 5 : 10
    return standings
      .map(s => {
        const ps = computePeriodStats(s.team.id, recentResults, view, limit)
        return { ...s, ...ps, seasonPPG: null }
      })
      .sort((a, b) =>
        b.points - a.points ||
        b.gd - a.gd ||
        b.gf - a.gf ||
        a.team.name.localeCompare(b.team.name)
      )
      .map((s, i) => ({ ...s, rank: i + 1 }))
  }, [period, view, standings, recentResults])

  if (!standings?.length) {
    return (
      <section className="bg-[#060f1a]/96 backdrop-blur-sm rounded-xl border border-[#009EE0]/15 p-4" style={{ boxShadow: '0 0 25px rgba(0,158,224,0.05)' }} aria-label="League table">
        <h2 className="font-bold text-lg text-[#009EE0] uppercase tracking-[0.08em] mb-2" style={{ textShadow: '0 0 12px rgba(0,158,224,0.4)' }}>League Table</h2>
        <p className="text-[#009EE0]/50 text-sm">No standings data available</p>
      </section>
    )
  }

  const wycIdx = tableData.findIndex(s => s.team.id === WYCOMBE_ESPN_ID)
  const rows = expanded
    ? tableData
    : tableData.slice(Math.max(0, wycIdx - 3), Math.min(tableData.length, wycIdx + 4))

  const periodLabel = period === 'season' ? 'Season' : period === 'last10' ? 'Last 10' : 'Last 5'

  return (
    <section className="bg-[#060f1a]/96 backdrop-blur-sm rounded-xl border border-[#009EE0]/15 p-4" style={{ boxShadow: '0 0 25px rgba(0,158,224,0.05)' }} aria-label="League table">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-lg text-[#009EE0] uppercase tracking-[0.08em]" style={{ textShadow: '0 0 12px rgba(0,158,224,0.4)' }}>League Table</h2>
        {period !== 'season' && (
          <span className="text-xs text-[#009EE0]/50 italic">{periodLabel} · all metrics recomputed</span>
        )}
      </div>

      {/* Toggles */}
      <div className="flex flex-col gap-2 mb-4">
        {/* Period */}
        <div className="flex gap-1" role="group" aria-label="Filter by time period">
          {(['season', 'last10', 'last5'] as Period[]).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              aria-pressed={period === p}
              className={`flex-1 text-xs py-1.5 px-3 rounded-lg font-medium transition-all whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-[#009EE0]/50
                ${period === p
                  ? 'border border-[#009EE0]/60 text-[#009EE0] bg-[#009EE0]/10'
                  : 'border border-[#009EE0]/10 text-[#cce4f5]/50 bg-[#030b14] hover:border-[#009EE0]/30 hover:text-[#cce4f5]/80'}`}
            >
              {p === 'season' ? 'Season' : p === 'last10' ? 'Last 10' : 'Last 5'}
            </button>
          ))}
        </div>
        {/* View */}
        <div className="flex gap-1" role="group" aria-label="Filter by home or away">
          {(['all', 'home', 'away'] as View[]).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              aria-pressed={view === v}
              className={`flex-1 text-xs py-1.5 px-3 rounded-lg font-medium capitalize transition-all focus:outline-none focus:ring-2 focus:ring-[#009EE0]/50
                ${view === v
                  ? 'border border-[#009EE0]/60 text-[#009EE0] bg-[#009EE0]/10'
                  : 'border border-[#009EE0]/10 text-[#cce4f5]/50 bg-[#030b14] hover:border-[#009EE0]/30 hover:text-[#cce4f5]/80'}`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm" aria-label="League standings">
          <thead>
            <tr className="text-[#009EE0]/50 text-xs border-b border-[#009EE0]/8">
              <th scope="col" className="text-left pb-2 pr-3 w-6">#</th>
              <th scope="col" className="text-left pb-2 pr-6">Team</th>
              <th scope="col" className="text-center pb-2 px-3">P</th>
              <th scope="col" className="text-center pb-2 px-3">W</th>
              <th scope="col" className="text-center pb-2 px-3">D</th>
              <th scope="col" className="text-center pb-2 px-3">L</th>
              <th scope="col" className="text-center pb-2 px-3">GD</th>
              <th scope="col" className="text-center pb-2 px-3 font-semibold">Pts</th>
              <th scope="col" className="text-center pb-2 px-3 hidden sm:table-cell">Form</th>
              <th scope="col" className="text-center pb-2 pl-3 hidden sm:table-cell">PPG</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(s => {
              const isWyc = s.team.id === WYCOMBE_ESPN_ID
              const gdColor = s.gd > 0 ? 'text-green-400' : s.gd < 0 ? 'text-red-400' : 'text-[#009EE0]/50'
              return (
                <tr key={s.team.id} className={`border-t border-[#009EE0]/8 ${isWyc ? 'bg-[#009EE0]/8 border-t border-[#009EE0]/15' : ''}`}>
                  <td className={`py-2.5 pr-3 text-xs ${isWyc ? 'font-bold text-[#009EE0]' : 'text-[#009EE0]/50'}`}>
                    {s.rank}
                  </td>
                  <td className="py-2.5 pr-6">
                    <div className="flex items-center gap-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={s.team.logo} alt="" aria-hidden="true" className="w-5 h-5 object-contain shrink-0" />
                      <span className={`truncate max-w-[140px] ${isWyc ? 'font-bold text-[#009EE0]' : 'text-[#cce4f5]'}`}>
                        {s.team.name}
                      </span>
                    </div>
                  </td>
                  <td className="text-center py-2.5 px-3 text-[#cce4f5]/70 text-xs">{s.played}</td>
                  <td className="text-center py-2.5 px-3 text-[#cce4f5]/70 text-xs">{s.won}</td>
                  <td className="text-center py-2.5 px-3 text-[#cce4f5]/70 text-xs">{s.drawn}</td>
                  <td className="text-center py-2.5 px-3 text-[#cce4f5]/70 text-xs">{s.lost}</td>
                  <td className={`text-center py-2.5 px-3 text-xs ${gdColor}`}>
                    {s.gd > 0 ? '+' : ''}{s.gd}
                  </td>
                  <td className={`text-center py-2.5 px-3 font-bold ${isWyc ? 'text-[#009EE0]' : 'text-[#cce4f5]'}`}
                    style={isWyc ? { textShadow: '0 0 8px rgba(0,158,224,0.5)' } : undefined}>
                    {s.points}
                  </td>
                  <td className="text-center py-2.5 px-3 hidden sm:table-cell">
                    <FormDots form={s.form} />
                  </td>
                  <td className="text-center py-2.5 pl-3 text-xs text-[#cce4f5]/70 hidden sm:table-cell">
                    {period === 'season'
                      ? (s.seasonPPG ?? (s.played > 0 ? (s.points / s.played).toFixed(1) : '–'))
                      : formPPG(s.form)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <button
        onClick={() => setExpanded(e => !e)}
        aria-expanded={expanded}
        aria-controls="league-table-body"
        className="mt-4 w-full text-center text-sm py-2 rounded-lg border border-[#009EE0]/45 text-[#009EE0] font-semibold uppercase tracking-wider hover:bg-[#009EE0]/8 hover:border-[#009EE0] transition-all focus:outline-none focus:ring-2 focus:ring-[#009EE0]/50"
        style={{ textShadow: '0 0 8px rgba(0,158,224,0.4)' }}
      >
        {expanded ? 'Show less' : `Show full table (${standings.length} teams)`}
      </button>
    </section>
  )
}

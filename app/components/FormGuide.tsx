'use client'

import { useState } from 'react'
import type { Fixture, StandingEntry } from '../lib/football'
import { TEAM_ESPN_ID } from '../lib/football'

type View = 'all' | 'home' | 'away'
type Period = 'season' | 'last10' | 'last5'

function ordinal(n: number) {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

function computeForm(fixtures: Fixture[], view: View, period: Period) {
  const finished = fixtures
    .filter(f => {
      if (f.status !== 'finished') return false
      if (view === 'home') return f.home.id === TEAM_ESPN_ID
      if (view === 'away') return f.away.id === TEAM_ESPN_ID
      return f.home.id === TEAM_ESPN_ID || f.away.id === TEAM_ESPN_ID
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const subset =
    period === 'last5' ? finished.slice(0, 5) :
    period === 'last10' ? finished.slice(0, 10) :
    finished

  return subset.map(f => {
    const home = f.home.id === TEAM_ESPN_ID
    const wycG = home ? (f.home.score ?? 0) : (f.away.score ?? 0)
    const oppG = home ? (f.away.score ?? 0) : (f.home.score ?? 0)
    const opp = home ? f.away : f.home
    return {
      result: (wycG > oppG ? 'W' : wycG === oppG ? 'D' : 'L') as 'W' | 'D' | 'L',
      opponent: opp.name,
      score: `${wycG}–${oppG}`,
      date: f.date,
    }
  })
}

function calcRank(
  form: { result: string }[],
  recentResults: Fixture[],
  standings: StandingEntry[],
  period: Period,
  view: View
): number | null {
  if (!standings.length || view !== 'all') return null

  if (period === 'season') {
    const pos = standings.findIndex(s => s.team.id === TEAM_ESPN_ID)
    return pos >= 0 ? pos + 1 : null
  }

  if (period === 'last5' || period === 'last10') {
    const n = period === 'last5' ? 5 : 10
    const wycPts = form.reduce((p, r) => p + (r.result === 'W' ? 3 : r.result === 'D' ? 1 : 0), 0)

    const teamPts = standings.map(s => {
      const games = recentResults
        .filter(f => f.status === 'finished' && (f.home.id === s.team.id || f.away.id === s.team.id))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, n)
      const pts = games.reduce((p, f) => {
        const home = f.home.id === s.team.id
        const scored = home ? (f.home.score ?? 0) : (f.away.score ?? 0)
        const conceded = home ? (f.away.score ?? 0) : (f.home.score ?? 0)
        return p + (scored > conceded ? 3 : scored === conceded ? 1 : 0)
      }, 0)
      return { id: s.team.id, pts }
    }).sort((a, b) => b.pts - a.pts)

    return teamPts.filter(t => t.pts > wycPts).length + 1
  }

  return null
}

export default function FormGuide({
  fixtures,
  standings,
  recentResults,
}: {
  fixtures: Fixture[]
  standings: StandingEntry[]
  recentResults: Fixture[]
}) {
  const [view, setView] = useState<View>('all')
  const [period, setPeriod] = useState<Period>('last10')

  const form = computeForm(fixtures ?? [], view, period)
  const rank = calcRank(form, recentResults ?? [], standings ?? [], period, view)

  const W = form.filter(r => r.result === 'W').length
  const D = form.filter(r => r.result === 'D').length
  const L = form.filter(r => r.result === 'L').length
  const pts = W * 3 + D
  const ppg = form.length > 0 ? (pts / form.length).toFixed(2) : '0.00'

  return (
    <section className="bg-white rounded-2xl shadow p-4">
      <h2 className="font-bold text-lg text-[#002147] mb-3">Form Guide</h2>

      <div className="flex gap-1 mb-2">
        {(['last5', 'last10', 'season'] as Period[]).map(p => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`flex-1 text-xs py-1.5 rounded-lg font-medium transition-colors
              ${period === p ? 'bg-[#002147] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {p === 'last5' ? 'Last 5' : p === 'last10' ? 'Last 10' : 'Season'}
          </button>
        ))}
      </div>

      <div className="flex gap-1 mb-4">
        {(['all', 'home', 'away'] as View[]).map(v => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`flex-1 text-xs py-1.5 rounded-lg font-medium capitalize transition-colors
              ${view === v ? 'bg-[#e30613] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {v}
          </button>
        ))}
      </div>

      <div className="flex gap-1 mb-4 flex-wrap">
        {[...form].reverse().map((r, i) => (
          <span
            key={i}
            title={`${r.opponent} ${r.score}`}
            className={`w-7 h-7 rounded-full text-white text-xs flex items-center justify-center font-bold cursor-default
              ${r.result === 'W' ? 'bg-green-500' : r.result === 'D' ? 'bg-amber-400' : 'bg-red-500'}`}
          >
            {r.result}
          </span>
        ))}
        {form.length === 0 && <span className="text-gray-400 text-sm">No data</span>}
      </div>

      <div className="grid grid-cols-4 gap-2 mb-3">
        {[
          { label: 'W', value: W, color: 'text-green-600' },
          { label: 'D', value: D, color: 'text-amber-500' },
          { label: 'L', value: L, color: 'text-red-500' },
          { label: 'PPG', value: ppg, color: 'text-[#002147]' },
        ].map(stat => (
          <div key={stat.label} className="text-center bg-gray-50 rounded-lg py-2">
            <div className={`text-lg font-bold ${stat.color}`}>{stat.value}</div>
            <div className="text-xs text-gray-400">{stat.label}</div>
          </div>
        ))}
      </div>

      {rank ? (
        <div className="text-center text-sm text-gray-500 bg-gray-50 rounded-lg py-2">
          {period === 'season' ? 'League position' : `Last ${period === 'last5' ? '5' : '10'} form rank`}:{' '}
          <span className="font-bold text-[#002147]">{ordinal(rank)} in League One</span>
        </div>
      ) : view !== 'all' ? (
        <div className="text-center text-xs text-gray-400">Ranking shown for all-games view only</div>
      ) : null}
    </section>
  )
}

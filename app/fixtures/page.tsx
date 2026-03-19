import Link from 'next/link'
import { getFixtures, getStandings, getStadiumImage, WYCOMBE_ESPN_ID } from '../lib/football'
import FixturesList from './FixturesList'
import TextSizeToggle from '../components/TextSizeToggle'

export const revalidate = 900

export default async function FixturesPage() {
  const [fixturesResult, standingsResult, stadiumResult] = await Promise.allSettled([
    getFixtures(),
    getStandings(),
    getStadiumImage(),
  ])

  const fixtures = fixturesResult.status === 'fulfilled' ? fixturesResult.value : []
  const standings = standingsResult.status === 'fulfilled' ? standingsResult.value : []
  const bgImage = stadiumResult.status === 'fulfilled' ? stadiumResult.value : null

  const wycPos = standings.find(s => s.team.id === WYCOMBE_ESPN_ID)

  return (
    <>
      <div
        className="fixed inset-0 -z-20 bg-cover bg-center bg-no-repeat"
        style={bgImage ? { backgroundImage: `url(${bgImage})` } : { background: '#09111e' }}
      />
      <div className="fixed inset-0 -z-10 bg-[#09111e]/78" />

      <main className="min-h-screen">
        <header className="bg-[#002147]/95 backdrop-blur-sm text-white px-4 py-4 shadow-lg border-b border-white/5 sticky top-0 z-50">
          <div className="max-w-5xl mx-auto flex items-center gap-4">
            <Link href="/" className="flex items-center gap-3 min-w-0 hover:opacity-90 transition-opacity">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://a.espncdn.com/i/teamlogos/soccer/500/344.png"
                alt="Wycombe Wanderers crest"
                className="w-12 h-12 object-contain shrink-0 drop-shadow-lg"
              />
              <div className="min-w-0">
                <h1 className="text-xl font-bold leading-tight">Wycombe Wanderers</h1>
                {wycPos && (
                  <p className="text-sm font-medium mt-0.5 flex items-center gap-2 flex-wrap">
                    <span className="text-gray-400 text-xs">League One</span>
                    <span className="text-blue-300 mx-0.5">·</span>
                    <span className="text-white font-bold">{wycPos.rank}{['th','st','nd','rd'][(wycPos.rank % 100 - 20) % 10] || ['th','st','nd','rd'][wycPos.rank % 100] || 'th'}</span>
                    <span className="text-gray-400 text-xs">P</span><span className="text-gray-200 font-semibold">{wycPos.played}</span>
                    <span className="text-gray-400 text-xs">Pts</span><span className="text-[#009EE0] font-bold">{wycPos.points}</span>
                    <span className="text-gray-400 text-xs">GD</span><span className={`font-semibold ${wycPos.gd > 0 ? 'text-green-400' : wycPos.gd < 0 ? 'text-red-400' : 'text-gray-400'}`}>{wycPos.gd > 0 ? '+' : ''}{wycPos.gd}</span>
                  </p>
                )}
              </div>
            </Link>

            <div className="ml-auto flex items-center gap-3">
              <TextSizeToggle />
              <Link
                href="/"
                className="text-sm bg-gradient-to-b from-[#40c4f5] to-[#0077b5] text-white px-3 py-1.5 rounded-lg font-semibold shadow-[0_2px_6px_rgba(0,90,160,0.45),inset_0_1px_0_rgba(255,255,255,0.25)] hover:from-[#55ccff] hover:to-[#0088cc] active:from-[#0077b5] active:to-[#005590] transition-all focus:outline-none focus:ring-2 focus:ring-[#009EE0]"
              >
                ← Dashboard
              </Link>
            </div>
          </div>
        </header>

        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="bg-[#0e1f35]/90 backdrop-blur-sm rounded-2xl shadow-xl p-4">
            <div className="mb-5">
              <h2 className="font-bold text-lg text-white">Fixtures &amp; Results</h2>
            </div>
            <FixturesList fixtures={fixtures} />
          </div>
        </div>
      </main>
    </>
  )
}

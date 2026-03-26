import Link from 'next/link'
import { getFixtures, getStandings, getStadiumImage, TEAM_ESPN_ID } from '../lib/football'
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

  const wycPos = standings.find(s => s.team.id === TEAM_ESPN_ID)

  return (
    <>
      <div
        className="fixed inset-0 -z-20 bg-cover bg-center bg-no-repeat"
        style={bgImage ? { backgroundImage: `url(${bgImage})` } : { background: '#010810' }}
      />
      <div className="fixed inset-0 -z-10 bg-[#010810]/90 tron-grid" />

      <main className="min-h-screen">
        <header
          className="bg-[#020b16]/98 backdrop-blur-md text-white px-4 py-3 sticky top-0 z-50 border-b border-[#e30613]/15"
          style={{ boxShadow: '0 1px 0 rgba(227,6,19,0.08), 0 4px 24px rgba(0,0,0,0.8)' }}
        >
          <div className="max-w-5xl mx-auto flex items-center gap-4">
            <Link href="/" className="flex items-center gap-3 min-w-0 hover:opacity-90 transition-opacity">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://a.espncdn.com/i/teamlogos/soccer/500/337.png"
                alt="Brentford FC crest"
                className="w-12 h-12 object-contain shrink-0"
                style={{ filter: 'drop-shadow(0 0 8px rgba(227,6,19,0.45))' }}
              />
              <div className="min-w-0">
                <h1
                  className="text-xl font-bold leading-tight tracking-wide text-white uppercase"
                  style={{ textShadow: '0 0 14px rgba(227,6,19,0.35)' }}
                >
                  Brentford FC
                </h1>
                {wycPos && (
                  <p className="text-xs font-medium mt-0.5 flex items-center gap-2 flex-wrap">
                    <span className="text-[#e30613] uppercase tracking-wider">League One</span>
                    <span className="text-[#e30613]">·</span>
                    <span className="text-[#cce4f5] font-bold">{wycPos.rank}{['th','st','nd','rd'][(wycPos.rank % 100 - 20) % 10] || ['th','st','nd','rd'][wycPos.rank % 100] || 'th'}</span>
                    <span className="text-[#e30613]">P</span><span className="text-[#cce4f5]">{wycPos.played}</span>
                    <span className="text-[#e30613]">Pts</span>
                    <span className="text-[#e30613] font-bold" style={{ textShadow: '0 0 8px rgba(227,6,19,0.6)' }}>{wycPos.points}</span>
                    <span className="text-[#e30613]">GD</span>
                    <span className={`font-semibold ${wycPos.gd > 0 ? 'text-green-400' : wycPos.gd < 0 ? 'text-red-400' : 'text-[#e30613]'}`}>{wycPos.gd > 0 ? '+' : ''}{wycPos.gd}</span>
                  </p>
                )}
              </div>
            </Link>

            <div className="ml-auto flex items-center gap-3">
              <TextSizeToggle />
              <Link
                href="/"
                className="text-xs border border-[#e30613]/50 text-[#e30613] px-3 py-1.5 rounded font-semibold uppercase tracking-wider hover:bg-[#e30613]/8 hover:border-[#e30613] transition-all focus:outline-none focus:ring-2 focus:ring-[#e30613]/50"
                style={{ textShadow: '0 0 8px rgba(227,6,19,0.4)' }}
              >
                ← Dashboard
              </Link>
            </div>
          </div>
        </header>

        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="bg-[#060f1a]/96 backdrop-blur-sm rounded-xl border border-[#e30613]/15 p-4" style={{ boxShadow: '0 0 25px rgba(227,6,19,0.05)' }}>
            <div className="mb-5">
              <h2 className="font-bold text-lg text-[#e30613] uppercase tracking-[0.08em]" style={{ textShadow: '0 0 12px rgba(227,6,19,0.4)' }}>Fixtures &amp; Results</h2>
            </div>
            <FixturesList fixtures={fixtures} />
          </div>
        </div>
      </main>
    </>
  )
}

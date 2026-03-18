import { getFixtures, getStandings, getSquad, getRecentResults, getOppositionData, getStadiumImage, WYCOMBE_ESPN_ID } from './lib/football'
import { getNews, getNewsForTeam } from './lib/rss'
import FixturesSection from './components/FixturesSection'
import LeagueTable from './components/LeagueTable'
import SquadSection from './components/SquadSection'
import NewsSection from './components/NewsSection'
import OppositionWatch from './components/OppositionWatch'

export const revalidate = 900

export default async function Home() {
  const [fixtures, standings, squad, recentResults, news, stadiumImage] = await Promise.allSettled([
    getFixtures(),
    getStandings(),
    getSquad(),
    getRecentResults(),
    getNews(),
    getStadiumImage(),
  ])

  const fixturesData = fixtures.status === 'fulfilled' ? fixtures.value : []
  const standingsData = standings.status === 'fulfilled' ? standings.value : []
  const squadData = squad.status === 'fulfilled' ? squad.value : []
  const recentData = recentResults.status === 'fulfilled' ? recentResults.value : []
  const newsData = news.status === 'fulfilled' ? news.value : []
  const bgImage = stadiumImage.status === 'fulfilled' ? stadiumImage.value : null

  const nextMatch = fixturesData
    .filter(f => f.status === 'upcoming')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0]

  const nextOpponentId = nextMatch
    ? (nextMatch.home.id === WYCOMBE_ESPN_ID ? nextMatch.away.id : nextMatch.home.id)
    : null
  const nextOpponentName = nextMatch
    ? (nextMatch.home.id === WYCOMBE_ESPN_ID ? nextMatch.away.name : nextMatch.home.name)
    : null

  const [oppData, oppNews] = nextOpponentId
    ? await Promise.all([
        getOppositionData(nextOpponentId),
        getNewsForTeam(nextOpponentName!),
      ])
    : [null, []]

  const oppStanding = nextOpponentId
    ? standingsData.find(s => s.team.id === nextOpponentId)
    : undefined

  const wycPos = standingsData.find(s => s.team.id === '344')

  return (
    <>
      {/* Fixed stadium background — stays still as cards scroll over it */}
      <div
        className="fixed inset-0 -z-20 bg-cover bg-center bg-no-repeat"
        style={bgImage ? { backgroundImage: `url(${bgImage})` } : { background: '#09111e' }}
      />
      {/* Dark overlay for readability */}
      <div className="fixed inset-0 -z-10 bg-[#09111e]/78" />

      <main className="min-h-screen">
        <header className="bg-[#002147]/95 backdrop-blur-sm text-white px-4 py-4 shadow-lg border-b border-white/5 sticky top-0 z-50">
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://a.espncdn.com/i/teamlogos/soccer/500/344.png"
                alt="Wycombe Wanderers crest"
                className="w-14 h-14 object-contain shrink-0 drop-shadow-lg"
              />
              <div className="min-w-0">
                <h1 className="text-xl font-bold leading-tight">Wycombe Wanderers</h1>
                {wycPos && (
                  <p className="text-sm font-medium mt-0.5 flex items-center gap-2 flex-wrap">
                    <span className="text-gray-400 text-xs">League One</span>
                    <span className="text-blue-300 mx-0.5">·</span>
                    <span className="text-white font-bold">{wycPos.rank}{['th','st','nd','rd'][(wycPos.rank % 100 - 20) % 10] || ['th','st','nd','rd'][wycPos.rank % 100] || 'th'}</span>
                    <span className="text-gray-500 text-xs">P</span><span className="text-gray-200 font-semibold">{wycPos.played}</span>
                    <span className="text-gray-500 text-xs">Pts</span><span className="text-[#009EE0] font-bold">{wycPos.points}</span>
                    <span className="text-gray-500 text-xs">GD</span><span className={`font-semibold ${wycPos.gd > 0 ? 'text-green-400' : wycPos.gd < 0 ? 'text-red-400' : 'text-gray-400'}`}>{wycPos.gd > 0 ? '+' : ''}{wycPos.gd}</span>
                  </p>
                )}
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">
          <FixturesSection fixtures={fixturesData} standings={standingsData} />
          {nextMatch && (
            <OppositionWatch
              nextFixture={nextMatch}
              oppData={oppData}
              standing={oppStanding}
              news={oppNews}
            />
          )}
          <LeagueTable standings={standingsData} recentResults={recentData} />
          <SquadSection squad={squadData} />
          <NewsSection news={newsData} />
        </div>

        <footer className="max-w-5xl mx-auto px-4 py-6 text-center text-xs text-gray-600">
          &copy; {new Date().getFullYear()} Russ Green. Unofficial fan site. Not affiliated with Wycombe Wanderers FC.
        </footer>
      </main>
    </>
  )
}

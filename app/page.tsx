import { getFixtures, getStandings, getSquad, getRecentResults, getOppositionData, getStadiumImage, TEAM_ESPN_ID } from './lib/football'
import { getNews, getNewsForTeam } from './lib/rss'
import { getRefereeStats } from './lib/referee'
import FixturesSection from './components/FixturesSection'
import LeagueTable from './components/LeagueTable'
import SquadSection from './components/SquadSection'
import NewsSection from './components/NewsSection'
import OppositionWatch from './components/OppositionWatch'
import RefereeWatch from './components/RefereeWatch'
import VenueFormSection from './components/VenueFormSection'
import TextSizeToggle from './components/TextSizeToggle'

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
    ? (nextMatch.home.id === TEAM_ESPN_ID ? nextMatch.away.id : nextMatch.home.id)
    : null
  const nextOpponentName = nextMatch
    ? (nextMatch.home.id === TEAM_ESPN_ID ? nextMatch.away.name : nextMatch.home.name)
    : null

  const [oppData, oppNews, refereeStats] = nextOpponentId
    ? await Promise.all([
        getOppositionData(nextOpponentId),
        getNewsForTeam(nextOpponentName!),
        getRefereeStats(),
      ])
    : [null, [], null]

  const oppStanding = nextOpponentId
    ? standingsData.find(s => s.team.id === nextOpponentId)
    : undefined

  const wycPos = standingsData.find(s => s.team.id === TEAM_ESPN_ID)

  // Venue form: our last 5 home/away games vs opponent's last 5 away/home games
  const wycIsHome = nextMatch ? nextMatch.home.id === TEAM_ESPN_ID : null
  let wycVenueForm: string[] = []
  let oppVenueForm: string[] = []
  if (nextMatch && wycIsHome !== null) {
    const wycGames = recentData
      .filter(f => f.status === 'finished' && (wycIsHome ? f.home.id === TEAM_ESPN_ID : f.away.id === TEAM_ESPN_ID))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5)
    wycVenueForm = wycGames.map(f => {
      const scored = f.home.id === TEAM_ESPN_ID ? (f.home.score ?? 0) : (f.away.score ?? 0)
      const conceded = f.home.id === TEAM_ESPN_ID ? (f.away.score ?? 0) : (f.home.score ?? 0)
      return scored > conceded ? 'W' : scored === conceded ? 'D' : 'L'
    })
    const oppGames = (oppData?.recentResults ?? [])
      .filter(f => wycIsHome ? f.away.id === nextOpponentId : f.home.id === nextOpponentId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5)
    oppVenueForm = oppGames.map(f => {
      const scored = f.home.id === nextOpponentId ? (f.home.score ?? 0) : (f.away.score ?? 0)
      const conceded = f.home.id === nextOpponentId ? (f.away.score ?? 0) : (f.home.score ?? 0)
      return scored > conceded ? 'W' : scored === conceded ? 'D' : 'L'
    })
  }

  return (
    <>
      {/* Fixed stadium background — stays still as cards scroll over it */}
      <div
        className="fixed inset-0 -z-20 bg-cover bg-center bg-no-repeat"
        style={bgImage ? { backgroundImage: `url(${bgImage})` } : { background: '#010810' }}
      />
      {/* Dark overlay */}
      <div className="fixed inset-0 -z-10 bg-[#010810]/90 tron-grid" />

      <main className="min-h-screen">
        <header
          className="bg-[#020b16]/98 backdrop-blur-md text-white px-4 py-3 sticky top-0 z-50 border-b border-[#e30613]/15"
          style={{ boxShadow: '0 1px 0 rgba(227,6,19,0.08), 0 4px 24px rgba(0,0,0,0.8)' }}
        >
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://a.espncdn.com/i/teamlogos/soccer/500/337.png"
                alt="Brentford FC crest"
                className="w-12 h-12 object-contain shrink-0"
                style={{ filter: 'drop-shadow(0 0 8px rgba(227,6,19,0.45))' }}
              />
              <div className="min-w-0 flex-1">
                <h1
                  className="text-xl font-bold leading-tight tracking-wide text-white uppercase"
                  style={{ textShadow: '0 0 14px rgba(227,6,19,0.35)' }}
                >
                  Brentford FC
                </h1>
                {wycPos && (
                  <p className="text-xs font-medium mt-0.5 flex items-center gap-2 flex-wrap">
                    <span className="text-[#e30613] uppercase tracking-wider">Premier League</span>
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
            </div>
            <TextSizeToggle />
          </div>
        </header>

        <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">
          <FixturesSection fixtures={fixturesData} standings={standingsData} />
          {nextMatch && wycIsHome !== null && (
            <VenueFormSection
              ourTeam={{
                name: 'Brentford FC',
                logo: `https://a.espncdn.com/i/teamlogos/soccer/500/337.png`,
                venue: wycIsHome ? 'home' : 'away',
                form: wycVenueForm,
              }}
              oppTeam={{
                name: nextOpponentName!,
                logo: wycIsHome ? nextMatch.away.logo : nextMatch.home.logo,
                venue: wycIsHome ? 'away' : 'home',
                form: oppVenueForm,
              }}
              accentColor="#e30613"
              accentRgb="227,6,19"
            />
          )}
          {nextMatch && (
            <OppositionWatch
              nextFixture={nextMatch}
              oppData={oppData}
              standing={oppStanding}
              news={oppNews}
            />
          )}
          {nextMatch && <RefereeWatch stats={refereeStats} />}
          <LeagueTable standings={standingsData} recentResults={recentData} />
          <SquadSection squad={squadData} />
          <NewsSection news={newsData} />
        </div>

        <footer className="max-w-5xl mx-auto px-4 py-6 text-center text-xs text-[#e30613]">
          &copy; {new Date().getFullYear()} Russ Green. Unofficial fan site. Not affiliated with Brentford FC FC.
        </footer>
      </main>
    </>
  )
}

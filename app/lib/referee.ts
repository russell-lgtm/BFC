export interface RefereeStats {
  name: string
  /** Number of Brentford Premier League games this referee has taken this season */
  gamesWithTeam: number
  teamRecord: { w: number; d: number; l: number }
  /** Yellow cards issued across Brentford games this season */
  yellowCards: number
  /** Red cards (inc. second yellows) issued across Brentford games this season */
  redCards: number
}

const TEAM_ID = 55
const LEAGUE_ID = 39
const SEASON = 2024

interface ApiFixture {
  fixture: {
    id: number
    date: string
    referee: string | null
    status: { short: string }
  }
  teams: {
    home: { id: number; winner: boolean | null }
    away: { id: number; winner: boolean | null }
  }
  goals: { home: number | null; away: number | null }
}

async function fetchTeamFixtures(): Promise<ApiFixture[]> {
  const key = process.env.API_FOOTBALL_KEY
  if (!key) return []
  try {
    const res = await fetch(
      `https://v3.football.api-sports.io/fixtures?team=${TEAM_ID}&league=${LEAGUE_ID}&season=${SEASON}`,
      { headers: { 'x-apisports-key': key }, next: { revalidate: 3600 } },
    )
    if (!res.ok) return []
    const data = await res.json()
    return data.response ?? []
  } catch {
    return []
  }
}

async function fetchCardCounts(fixtureId: number): Promise<{ yellow: number; red: number }> {
  const key = process.env.API_FOOTBALL_KEY
  if (!key) return { yellow: 0, red: 0 }
  try {
    const res = await fetch(
      `https://v3.football.api-sports.io/fixtures/events?fixture=${fixtureId}&type=card`,
      { headers: { 'x-apisports-key': key }, next: { revalidate: 86400 } },
    )
    if (!res.ok) return { yellow: 0, red: 0 }
    const data = await res.json()
    let yellow = 0
    let red = 0
    for (const event of data.response ?? []) {
      if (event.detail === 'Yellow Card') yellow++
      else if (event.detail === 'Red Card' || event.detail === 'Yellow Red Card') red++
    }
    return { yellow, red }
  } catch {
    return { yellow: 0, red: 0 }
  }
}

export async function getRefereeStats(): Promise<RefereeStats | null> {
  const fixtures = await fetchTeamFixtures()
  if (!fixtures.length) return null

  const now = new Date()

  // Find the next upcoming fixture that has a referee assigned
  const nextWithRef = fixtures
    .filter(f => new Date(f.fixture.date) > now && f.fixture.referee)
    .sort((a, b) => new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime())[0]

  if (!nextWithRef?.fixture.referee) return null

  const refName = nextWithRef.fixture.referee

  // Find all finished Wycombe fixtures this season with this referee
  const pastWithRef = fixtures.filter(
    f => f.fixture.referee === refName && f.fixture.status.short === 'FT',
  )

  // Calculate W/D/L
  let w = 0, d = 0, l = 0
  for (const f of pastWithRef) {
    const wycHome = f.teams.home.id === TEAM_ID
    const wycGoals = wycHome ? f.goals.home : f.goals.away
    const oppGoals = wycHome ? f.goals.away : f.goals.home
    if (wycGoals == null || oppGoals == null) continue
    if (wycGoals > oppGoals) w++
    else if (wycGoals === oppGoals) d++
    else l++
  }

  // Fetch card events for each past fixture with this referee (cached 24h each)
  const cardResults = await Promise.all(
    pastWithRef.map(f => fetchCardCounts(f.fixture.id)),
  )
  const yellowCards = cardResults.reduce((sum, c) => sum + c.yellow, 0)
  const redCards = cardResults.reduce((sum, c) => sum + c.red, 0)

  return {
    name: refName,
    gamesWithTeam: pastWithRef.length,
    teamRecord: { w, d, l },
    yellowCards,
    redCards,
  }
}

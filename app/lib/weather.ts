// Adams Park, High Wycombe
const LAT = 51.6309
const LON = -0.7987

export interface WeatherData {
  current: {
    temperature_2m: number
    precipitation: number
    weathercode: number
    windspeed_10m: number
  }
  hourly: {
    time: string[]
    temperature_2m: number[]
    precipitation_probability: number[]
    weathercode: number[]
    windspeed_10m: number[]
  }
}

export async function getWeather(): Promise<WeatherData | null> {
  try {
    const url =
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${LAT}&longitude=${LON}` +
      `&current=temperature_2m,precipitation,weathercode,windspeed_10m` +
      `&hourly=temperature_2m,precipitation_probability,weathercode,windspeed_10m` +
      `&timezone=Europe%2FLondon&forecast_days=7`
    const res = await fetch(url, { next: { revalidate: 3600 } })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

// Convert a UTC date string to the Open-Meteo hourly key format (Europe/London local time)
// e.g. "2026-03-21T15:00:00Z" → "2026-03-21T15:00" (GMT) or "2026-07-05T16:00" (BST)
export function matchHourIndex(matchDateUTC: string, hourlyTimes: string[]): number {
  const date = new Date(matchDateUTC)
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/London',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)
  const get = (t: string) => parts.find(p => p.type === t)?.value ?? '00'
  const target = `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:00`
  return hourlyTimes.indexOf(target)
}

export function weatherDescription(code: number): string {
  if (code === 0) return 'Clear sky'
  if (code <= 3) return 'Partly cloudy'
  if (code <= 48) return 'Foggy'
  if (code <= 55) return 'Drizzle'
  if (code <= 67) return 'Rain'
  if (code <= 77) return 'Snow'
  if (code <= 82) return 'Showers'
  if (code <= 86) return 'Snow showers'
  return 'Thunderstorm'
}

export function weatherEmoji(code: number): string {
  if (code === 0) return '☀️'
  if (code <= 3) return '⛅'
  if (code <= 48) return '🌫️'
  if (code <= 55) return '🌦️'
  if (code <= 67) return '🌧️'
  if (code <= 77) return '❄️'
  if (code <= 82) return '🌦️'
  return '⛈️'
}

import { getWeather, matchHourIndex, weatherDescription, weatherEmoji } from '../lib/weather'

export default async function WeatherWidget({ nextMatchDate }: { nextMatchDate?: string }) {
  const weather = await getWeather()
  if (!weather) return <div className="text-gray-400 text-sm">Weather unavailable</div>

  let code: number
  let temp: number
  let rainPct: number
  let wind: number
  let label: string

  if (nextMatchDate) {
    const idx = matchHourIndex(nextMatchDate, weather.hourly.time)
    if (idx !== -1) {
      // Show forecast at exact kick-off hour
      code = weather.hourly.weathercode[idx]
      temp = Math.round(weather.hourly.temperature_2m[idx])
      rainPct = weather.hourly.precipitation_probability[idx]
      wind = Math.round(weather.hourly.windspeed_10m[idx])
      const matchDate = new Date(nextMatchDate)
      const dateStr = matchDate.toLocaleDateString('en-GB', {
        weekday: 'short', day: 'numeric', month: 'short',
        timeZone: 'Europe/London',
      })
      const timeStr = matchDate.toLocaleTimeString('en-GB', {
        hour: '2-digit', minute: '2-digit',
        timeZone: 'Europe/London',
      })
      label = `Kick-off ${dateStr} ${timeStr}`
    } else {
      // Match beyond 7-day forecast window — fall back to current
      code = weather.current.weathercode
      temp = Math.round(weather.current.temperature_2m)
      rainPct = Math.min(100, Math.round(weather.current.precipitation * 20))
      wind = Math.round(weather.current.windspeed_10m)
      label = 'Adams Park now'
    }
  } else {
    code = weather.current.weathercode
    temp = Math.round(weather.current.temperature_2m)
    rainPct = Math.min(100, Math.round(weather.current.precipitation * 20))
    wind = Math.round(weather.current.windspeed_10m)
    label = 'Adams Park now'
  }

  return (
    <div className="text-right shrink-0">
      <div className="flex items-center gap-1.5 justify-end">
        <span className="text-xl">{weatherEmoji(code)}</span>
        <span className="text-xl font-bold">{temp}°C</span>
      </div>
      <div className="text-xs text-blue-200 mt-0.5">
        {weatherDescription(code)} · 🌧️ {rainPct}% · 💨 {wind}km/h
      </div>
      <div className="text-xs text-blue-300">{label}</div>
    </div>
  )
}

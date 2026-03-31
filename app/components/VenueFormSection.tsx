interface TeamRow {
  name: string
  logo: string
  venue: 'home' | 'away'
  form: string[] // W/D/L newest-first
}

function FormDot({ result }: { result: string }) {
  const cls =
    result === 'W' ? 'border-green-400 text-green-300' :
    result === 'D' ? 'border-amber-400 text-amber-300' :
    'border-red-500 text-red-400'
  return (
    <span aria-hidden="true" className={`w-5 h-5 rounded-full text-[9px] flex items-center justify-center font-bold border ${cls}`}>
      {result}
    </span>
  )
}

function TeamFormRow({ team, accentColor, highlight }: { team: TeamRow; accentColor: string; highlight?: boolean }) {
  // Display oldest→newest (left→right), same convention as league table
  const dots = [...team.form].reverse()
  return (
    <div className="flex items-center gap-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={team.logo} alt="" aria-hidden="true" className="w-6 h-6 object-contain shrink-0" />
      <span
        className={`text-sm truncate w-36 shrink-0 ${highlight ? 'font-bold' : ''}`}
        style={{ color: highlight ? accentColor : '#cce4f5' }}
      >
        {team.name}
      </span>
      <span
        className="text-xs font-semibold px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0"
        style={{ color: accentColor, border: `1px solid ${accentColor}40`, backgroundColor: `${accentColor}10` }}
      >
        {team.venue}
      </span>
      <div className="flex gap-0.5 ml-1" aria-label={`Last ${dots.length} ${team.venue} results: ${dots.join(', ')}`}>
        {dots.length > 0
          ? dots.map((r, i) => <FormDot key={i} result={r} />)
          : <span className="text-xs" style={{ color: `${accentColor}50` }}>No data</span>
        }
      </div>
    </div>
  )
}

export default function VenueFormSection({
  ourTeam,
  oppTeam,
  accentColor,
  accentRgb,
}: {
  ourTeam: TeamRow
  oppTeam: TeamRow
  accentColor: string
  accentRgb: string
}) {
  return (
    <section
      className="bg-[#060f1a]/96 backdrop-blur-sm rounded-xl border p-4"
      style={{ borderColor: `${accentColor}26`, boxShadow: `0 0 25px rgba(${accentRgb},0.05)` }}
      aria-label="Venue form comparison"
    >
      <div className="mb-4">
        <h2
          className="font-bold text-lg uppercase tracking-[0.08em]"
          style={{ color: accentColor, textShadow: `0 0 12px rgba(${accentRgb},0.4)` }}
        >
          Home / Away Form
        </h2>
        <p className="text-xs mt-0.5" style={{ color: `${accentColor}70` }}>
          Last 5 — {ourTeam.name} {ourTeam.venue} vs {oppTeam.name} {oppTeam.venue}
        </p>
      </div>
      <div className="space-y-3">
        <TeamFormRow team={ourTeam} accentColor={accentColor} highlight />
        <TeamFormRow team={oppTeam} accentColor={accentColor} />
      </div>
    </section>
  )
}

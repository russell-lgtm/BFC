// Primary and secondary kit colors for EFL League One 2025/26 teams
export interface TeamColor {
  primary: string
  secondary: string
}

export const TEAM_COLORS: Record<string, TeamColor> = {
  'Barnsley':           { primary: '#D71921', secondary: '#FFFFFF' },
  'Blackpool':          { primary: '#F68712', secondary: '#FFFFFF' },
  'Bolton Wanderers':   { primary: '#1C2D5A', secondary: '#FFFFFF' },
  'Bradford City':      { primary: '#8C1B2F', secondary: '#FFD700' },
  'Burton Albion':      { primary: '#F9A01B', secondary: '#1A1A1A' },
  'Cardiff City':       { primary: '#0070B5', secondary: '#D4003B' },
  'Doncaster Rovers':   { primary: '#CC0000', secondary: '#FFFFFF' },
  'Exeter City':        { primary: '#CB2229', secondary: '#FFFFFF' },
  'Huddersfield Town':  { primary: '#0E63AD', secondary: '#FFFFFF' },
  'Leyton Orient':      { primary: '#CC0000', secondary: '#FFFFFF' },
  'Lincoln City':       { primary: '#CC0000', secondary: '#FFFFFF' },
  'Luton Town':         { primary: '#F78F1E', secondary: '#002060' },
  'Northampton Town':   { primary: '#8C0020', secondary: '#FFFFFF' },
  'Peterborough United':{ primary: '#003E96', secondary: '#FFFFFF' },
  'Port Vale':          { primary: '#1C1C1B', secondary: '#FFD700' },
  'Reading':            { primary: '#004494', secondary: '#FFFFFF' },
  'Rotherham United':   { primary: '#ED1C24', secondary: '#FFFFFF' },
  'Shrewsbury Town':    { primary: '#005DC1', secondary: '#F7C800' },
  'Stevenage':          { primary: '#CC0000', secondary: '#FFFFFF' },
  'Stockport County':   { primary: '#003090', secondary: '#FFFFFF' },
  'Wigan Athletic':     { primary: '#003E96', secondary: '#FFFFFF' },
  'Wrexham':            { primary: '#D00027', secondary: '#FFFFFF' },
  'Brentford FC':  { primary: '#002147', secondary: '#e30613' },
}

export function teamColor(name: string): TeamColor {
  return TEAM_COLORS[name] ?? { primary: '#6B7280', secondary: '#FFFFFF' }
}

/** Returns true if the hex color has enough luminance to read on a dark background */
export function isReadableOnDark(hex: string): boolean {
  if (!hex || hex.length < 7) return true
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  return (0.299 * r + 0.587 * g + 0.114 * b) > 0.22
}

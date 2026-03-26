'use client'

import { useEffect, useState } from 'react'

export default function TextSizeToggle() {
  const [isLarge, setIsLarge] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('large-text') === 'true'
    document.documentElement.classList.toggle('large-text', stored)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLarge(stored)
  }, [])

  function toggle() {
    const next = !isLarge
    setIsLarge(next)
    localStorage.setItem('large-text', String(next))
    document.documentElement.classList.toggle('large-text', next)
  }

  return (
    <button
      onClick={toggle}
      aria-label={isLarge ? 'Switch to normal text size' : 'Switch to larger text size'}
      title={isLarge ? 'Normal text size' : 'Larger text size'}
      className="shrink-0 text-sm font-bold px-2.5 py-1.5 rounded-lg border border-[#e30613]/30 text-[#e30613]/70 hover:text-[#e30613] hover:border-[#e30613]/60 hover:shadow-[0_0_8px_rgba(227,6,19,0.25)] transition-all focus:outline-none focus:ring-2 focus:ring-[#e30613]/50"
    >
      {isLarge ? 'A−' : 'A+'}
    </button>
  )
}

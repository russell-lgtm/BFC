'use client'

import { useEffect, useState } from 'react'

export default function TextSizeToggle() {
  const [isLarge, setIsLarge] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('large-text') === 'true'
    setIsLarge(stored)
    document.documentElement.classList.toggle('large-text', stored)
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
      className="shrink-0 text-sm font-bold px-2.5 py-1.5 rounded-lg border border-white/20 text-gray-300 hover:text-white hover:border-white/40 transition-all focus:outline-none focus:ring-2 focus:ring-[#009EE0]"
    >
      {isLarge ? 'A−' : 'A+'}
    </button>
  )
}

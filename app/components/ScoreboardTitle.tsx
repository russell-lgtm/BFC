export default function ScoreboardTitle({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-[3px] flex-wrap" aria-hidden="true">
      {text.split('').map((char, i) =>
        char === ' ' ? (
          <div key={i} className="w-2" />
        ) : (
          <div
            key={i}
            className="flex items-center justify-center w-7 h-8 rounded-sm text-[#009EE0] font-bold text-sm uppercase select-none"
            style={{
              background: '#020d18',
              border: '1px solid rgba(0,158,224,0.5)',
              boxShadow: '0 0 8px rgba(0,158,224,0.2), inset 0 0 4px rgba(0,158,224,0.06)',
              textShadow: '0 0 12px rgba(0,158,224,1)',
            }}
          >
            {char}
          </div>
        )
      )}
    </div>
  )
}

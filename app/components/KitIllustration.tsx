// Wycombe Wanderers 2024-25 kit component URLs from Wikimedia Commons
export const WWFC_KITS = {
  home: {
    body:     'https://upload.wikimedia.org/wikipedia/commons/e/eb/Kit_body_wycombe2324h.png',
    leftArm:  'https://upload.wikimedia.org/wikipedia/commons/2/2b/Kit_left_arm_wycombe2324h.png',
    rightArm: 'https://upload.wikimedia.org/wikipedia/commons/c/ca/Kit_right_arm_wycombe2324h.png',
  },
  away: {
    body:     'https://upload.wikimedia.org/wikipedia/commons/5/58/Kit_body_wycombe2324a.png',
    leftArm:  'https://upload.wikimedia.org/wikipedia/commons/8/86/Kit_left_arm_wycombe2324a.png',
    rightArm: 'https://upload.wikimedia.org/wikipedia/commons/d/d6/Kit_right_arm_wycombe2324a.png',
  },
}

interface WikimediaKitProps {
  type: 'wikimedia'
  body: string
  leftArm: string
  rightArm: string
  label?: string
  size?: number
}

interface ColorKitProps {
  type: 'color'
  primary: string
  secondary: string
  label?: string
  size?: number
}

type KitIllustrationProps = WikimediaKitProps | ColorKitProps

// Aspect ratio of Wikipedia's kit component PNGs (38 × 57px)
const KIT_ASPECT = 57 / 38

export default function KitIllustration(props: KitIllustrationProps) {
  const size = props.size ?? 44
  const h = Math.round(size * KIT_ASPECT)

  return (
    <div className="flex flex-col items-center gap-0.5">
      <div style={{ width: size, height: h, position: 'relative' }} aria-hidden="true">
        {props.type === 'wikimedia' ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={props.body}     alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'fill' }} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={props.leftArm}  alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'fill' }} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={props.rightArm} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'fill' }} />
          </>
        ) : (
          // SVG shirt generated from team primary/secondary colours
          <svg viewBox="0 0 38 56" width={size} height={h} aria-hidden="true">
            {/* Main shirt body + sleeves */}
            <path
              fill={props.primary}
              stroke="rgba(255,255,255,0.15)"
              strokeWidth="0.5"
              d="M12 3 L3 0 L0 7 L0 18 L7 18 L6 54 L32 54 L31 18 L38 18 L38 7 L35 0 L26 3 L19 13 Z"
            />
            {/* V-neck collar */}
            <path fill={props.secondary} opacity="0.9" d="M12 3 L19 13 L26 3 Z" />
            {/* Sleeve cuffs */}
            <path fill={props.secondary} opacity="0.8" d="M0 14 L0 18 L7 18 L7 14 Z" />
            <path fill={props.secondary} opacity="0.8" d="M31 14 L31 18 L38 18 L38 14 Z" />
          </svg>
        )}
      </div>
      {props.label && (
        <span className="text-xs text-gray-400 font-medium leading-none">{props.label}</span>
      )}
    </div>
  )
}

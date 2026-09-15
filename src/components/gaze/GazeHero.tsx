import { useEffect, useRef, type CSSProperties } from 'react'
import { cn } from '@/lib/utils'

const SETTLE = 0.08

export type GazeState = 'idle' | 'attention' | 'thinking' | 'success'

export function GazeHero({
  size = 320,
  className,
  interactive = true,
  state = 'idle',
}: {
  size?: number
  className?: string
  interactive?: boolean
  state?: GazeState
}) {
  const ballRef = useRef<HTMLDivElement>(null)
  const faceRef = useRef<HTMLDivElement>(null)
  const lookRef = useRef({ x: 0, y: 0 })
  const targetRef = useRef({ x: 0, y: 0 })
  const centerRef = useRef({ x: 0, y: 0, radius: 1 })
  const rafRef = useRef<number | null>(null)
  const wanderTimer = useRef<number | null>(null)
  const maxLook = size * 0.14
  const eyeWidth = Math.max(3, size * 0.12)
  const eyeHeight = Math.max(6, size * 0.26)
  const eyeGap = Math.max(3, size * 0.14)
  const showGlow = size >= 64
  const thinking = state === 'thinking'
  const success = state === 'success'
  const trackPointer = interactive && !thinking

  useEffect(() => {
    const ball = ballRef.current
    const face = faceRef.current
    if (!ball || !face) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    function refreshCenter() {
      const rect = ball!.getBoundingClientRect()
      centerRef.current = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
        radius: Math.max(rect.width / 2, 1),
      }
    }

    function applyFace() {
      const { x, y } = lookRef.current
      face!.style.transform = `translate(calc(-50% + ${x}px), ${y}px)`
    }

    function stopLoop() {
      if (rafRef.current == null) return
      window.cancelAnimationFrame(rafRef.current)
      rafRef.current = null
      face!.style.willChange = 'auto'
    }

    function tick() {
      const look = lookRef.current
      const target = targetRef.current
      const ease = thinking ? 0.16 : 0.28
      look.x += (target.x - look.x) * ease
      look.y += (target.y - look.y) * ease
      applyFace()

      if (
        !thinking &&
        Math.abs(target.x - look.x) < SETTLE &&
        Math.abs(target.y - look.y) < SETTLE
      ) {
        look.x = target.x
        look.y = target.y
        applyFace()
        stopLoop()
        return
      }

      rafRef.current = window.requestAnimationFrame(tick)
    }

    function startLoop() {
      if (rafRef.current != null) return
      face!.style.willChange = 'transform'
      rafRef.current = window.requestAnimationFrame(tick)
    }

    function aimAt(clientX: number, clientY: number) {
      const { x: cx, y: cy, radius } = centerRef.current
      const dx = clientX - cx
      const dy = clientY - cy
      const distance = Math.hypot(dx, dy) || 1
      const strength = Math.min(distance / (radius * 1.4), 1)
      targetRef.current = {
        x: (dx / distance) * maxLook * strength,
        y: (dy / distance) * maxLook * strength,
      }
      startLoop()
    }

    function wander() {
      const angle = Math.random() * Math.PI * 2
      const strength = 0.35 + Math.random() * 0.55
      targetRef.current = {
        x: Math.cos(angle) * maxLook * strength,
        y: Math.sin(angle) * maxLook * strength * 0.7,
      }
      startLoop()
      wanderTimer.current = window.setTimeout(wander, 420 + Math.random() * 780)
    }

    function onPointerMove(event: PointerEvent) {
      aimAt(event.clientX, event.clientY)
    }

    refreshCenter()
    const resizeObserver = new ResizeObserver(refreshCenter)
    resizeObserver.observe(ball)

    if (thinking) {
      wander()
    } else if (trackPointer) {
      window.addEventListener('pointermove', onPointerMove, { passive: true })
      window.addEventListener('scroll', refreshCenter, {
        passive: true,
        capture: true,
      })
    } else {
      targetRef.current = { x: 0, y: 0 }
      startLoop()
    }

    return () => {
      stopLoop()
      if (wanderTimer.current != null) {
        window.clearTimeout(wanderTimer.current)
        wanderTimer.current = null
      }
      resizeObserver.disconnect()
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('scroll', refreshCenter, true)
    }
  }, [maxLook, thinking, trackPointer])

  return (
    <div
      aria-hidden
      data-state={state}
      className={cn('gaze-hero relative z-20 shrink-0 overflow-visible', className)}
      style={
        {
          width: size,
          height: size,
          '--gaze-size': `${size}px`,
        } as CSSProperties
      }
    >
      {showGlow ? (
        <div
          className={cn(
            'pointer-events-none absolute inset-[-18%] z-0 rounded-full blur-xl transition-opacity duration-300',
            thinking && 'gaze-glow-pulse',
          )}
          style={{
            background:
              'radial-gradient(circle, color-mix(in oklch, white 28%, transparent) 0%, color-mix(in oklch, white 8%, transparent) 40%, transparent 68%)',
          }}
        />
      ) : null}

      <div
        ref={ballRef}
        className={cn(
          'relative z-10 size-full overflow-hidden rounded-full',
          state === 'attention' && 'gaze-hero-attention',
          success && 'gaze-hero-success',
        )}
        style={{
          background:
            'radial-gradient(120% 120% at 72% 28%, #f5f5f5 0%, #d4d4d4 28%, #737373 62%, #171717 100%)',
          boxShadow: showGlow
            ? 'inset -18px -22px 36px color-mix(in oklch, black 42%, transparent), inset 14px 16px 28px color-mix(in oklch, white 18%, transparent), 0 0 28px color-mix(in oklch, white 12%, transparent)'
            : 'inset -4px -5px 10px color-mix(in oklch, black 40%, transparent), inset 3px 4px 8px color-mix(in oklch, white 18%, transparent), 0 0 8px color-mix(in oklch, white 10%, transparent)',
        }}
      >
        <div
          ref={faceRef}
          className="absolute top-[34%] left-1/2 flex"
          style={{ gap: eyeGap, transform: 'translate(-50%, 0)' }}
        >
          <span
            className={cn('gaze-eye block shrink-0 rounded-full', thinking && 'gaze-eye-thinking')}
            style={{
              width: eyeWidth,
              height: eyeHeight,
              background: 'var(--gaze-eye, #0a0a0a)',
            }}
          />
          <span
            className={cn('gaze-eye block shrink-0 rounded-full', thinking && 'gaze-eye-thinking')}
            style={{
              width: eyeWidth,
              height: eyeHeight,
              background: 'var(--gaze-eye, #0a0a0a)',
            }}
          />
        </div>
      </div>

      {thinking ? (
        <div className="gaze-fx pointer-events-none absolute inset-0 z-30 overflow-visible">
          <span className="gaze-orbit absolute inset-[-28%] rounded-full" />
          <span className="gaze-spark gaze-spark-a absolute size-1.5 rounded-full bg-white" />
          <span className="gaze-spark gaze-spark-b absolute size-1 rounded-full bg-white/80" />
          <span className="gaze-spark gaze-spark-c absolute size-1 rounded-full bg-white/70" />
        </div>
      ) : null}
    </div>
  )
}

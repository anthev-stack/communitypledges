"use client"

import { useEffect, useRef } from "react"

const COLORS = [
  "#fbbf24",
  "#f472b6",
  "#a78bfa",
  "#5865f2",
  "#34d399",
  "#60a5fa",
  "#fb923c",
  "#facc15",
]

type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  color: string
  size: number
}

type Rocket = {
  x: number
  y: number
  vy: number
  targetY: number
  color: string
  trail: { x: number; y: number; alpha: number }[]
}

function randomColor() {
  return COLORS[Math.floor(Math.random() * COLORS.length)]
}

function spawnRocket(width: number, height: number): Rocket {
  return {
    x: Math.random() * width * 0.8 + width * 0.1,
    y: height + 10,
    vy: -(6 + Math.random() * 4),
    targetY: height * (0.2 + Math.random() * 0.45),
    color: randomColor(),
    trail: [],
  }
}

function explode(x: number, y: number, color: string, count: number): Particle[] {
  const particles: Particle[] = []
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4
    const speed = 2 + Math.random() * 5
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      maxLife: 0.6 + Math.random() * 0.5,
      color: Math.random() > 0.35 ? color : randomColor(),
      size: 1.5 + Math.random() * 2,
    })
  }
  return particles
}

type Props = {
  /** More rockets and bursts while submitting pledge */
  boost?: boolean
  /** Extra bursts on success */
  celebrate?: boolean
}

export default function PledgeModalFireworks({ boost = false, celebrate = false }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef({
    rockets: [] as Rocket[],
    particles: [] as Particle[],
    spawnTimer: 0,
    raf: 0,
  })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      canvas.style.width = `${window.innerWidth}px`
      canvas.style.height = `${window.innerHeight}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    resize()
    window.addEventListener("resize", resize)

    const state = stateRef.current
    let last = performance.now()

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      const w = window.innerWidth
      const h = window.innerHeight

      const spawnInterval = celebrate ? 0.25 : boost ? 0.45 : 1.1
      const burstCount = celebrate ? 90 : boost ? 65 : 48

      state.spawnTimer += dt
      if (state.spawnTimer >= spawnInterval) {
        state.spawnTimer = 0
        const batch = celebrate ? 2 : boost ? 1 : 1
        for (let i = 0; i < batch; i++) {
          state.rockets.push(spawnRocket(w, h))
        }
      }

      if (celebrate && Math.random() < 0.08) {
        state.particles.push(
          ...explode(
            Math.random() * w,
            Math.random() * h * 0.6,
            randomColor(),
            40 + Math.floor(Math.random() * 30)
          )
        )
      }

      ctx.clearRect(0, 0, w, h)

      // Update rockets
      const nextRockets: Rocket[] = []
      for (const r of state.rockets) {
        r.trail.push({ x: r.x, y: r.y, alpha: 1 })
        if (r.trail.length > 12) r.trail.shift()
        r.trail.forEach((t) => {
          t.alpha *= 0.88
        })

        r.y += r.vy
        r.vy *= 0.98

        for (const t of r.trail) {
          ctx.beginPath()
          ctx.arc(t.x, t.y, 2, 0, Math.PI * 2)
          ctx.fillStyle = r.color
          ctx.globalAlpha = t.alpha * 0.7
          ctx.fill()
          ctx.globalAlpha = 1
        }

        if (r.y <= r.targetY || r.vy > -1) {
          state.particles.push(...explode(r.x, r.y, r.color, burstCount))
        } else {
          nextRockets.push(r)
        }
      }
      state.rockets = nextRockets

      // Update particles
      const nextParticles: Particle[] = []
      for (const p of state.particles) {
        p.life -= dt / p.maxLife
        if (p.life <= 0) continue
        p.vx *= 0.98
        p.vy += 0.12
        p.x += p.vx
        p.y += p.vy
        const alpha = p.life
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2)
        ctx.fillStyle = p.color
        ctx.globalAlpha = alpha * 0.9
        ctx.fill()
        ctx.globalAlpha = 1
        nextParticles.push(p)
      }
      state.particles = nextParticles.slice(-600)

      state.raf = requestAnimationFrame(tick)
    }

    state.raf = requestAnimationFrame(tick)

    return () => {
      window.removeEventListener("resize", resize)
      cancelAnimationFrame(state.raf)
      state.rockets = []
      state.particles = []
      state.spawnTimer = 0
    }
  }, [boost, celebrate])

  return <canvas ref={canvasRef} className="pledge-modal-fireworks" aria-hidden />
}

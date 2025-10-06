'use client'

import { useEffect, useRef } from 'react'

interface BatOptions {
  image: string
  zIndex: number
  amount: number
  width: number
  height: number
  frames: number
  speed: number
  flickering: number
}

interface Bat {
  element: HTMLDivElement
  x: number
  y: number
  tx: number
  ty: number
  dx: number
  dy: number
  frame: number
  moveInterval: NodeJS.Timeout
  animateInterval: NodeJS.Timeout
}

export default function FlyingBats({ enabled = true }: { enabled?: boolean }) {
  const batsRef = useRef<Bat[]>([])
  const containerRef = useRef<HTMLDivElement>(null)

  const defaultOptions: BatOptions = {
    image: 'https://raw.githubusercontent.com/Artimon/jquery-halloween-bats/master/bats.png',
    zIndex: 1, // Behind content but in front of background
    amount: 6,
    width: 35,
    height: 20,
    frames: 4,
    speed: 15,
    flickering: 20
  }

  const randomPosition = (direction: 'horizontal' | 'vertical', containerWidth: number, containerHeight: number) => {
    if (direction === 'horizontal') {
      return Math.random() * (containerWidth - defaultOptions.width)
    } else {
      return Math.random() * (containerHeight - defaultOptions.height)
    }
  }

  const createBat = (containerWidth: number, containerHeight: number): Bat => {
    const batElement = document.createElement('div')
    batElement.className = 'halloween-bat'
    batElement.style.position = 'absolute'
    batElement.style.width = defaultOptions.width + 'px'
    batElement.style.height = defaultOptions.height + 'px'
    batElement.style.backgroundImage = `url(${defaultOptions.image})`
    batElement.style.backgroundRepeat = 'no-repeat'
    batElement.style.zIndex = defaultOptions.zIndex.toString()
    batElement.style.pointerEvents = 'none'
    
    if (containerRef.current) {
      containerRef.current.appendChild(batElement)
    }

    const bat: Bat = {
      element: batElement,
      x: randomPosition('horizontal', containerWidth, containerHeight),
      y: randomPosition('vertical', containerWidth, containerHeight),
      tx: randomPosition('horizontal', containerWidth, containerHeight),
      ty: randomPosition('vertical', containerWidth, containerHeight),
      dx: -5 + Math.random() * 10,
      dy: -5 + Math.random() * 10,
      frame: Math.round(Math.random() * defaultOptions.frames),
      moveInterval: null as any,
      animateInterval: null as any
    }

    // Apply initial position
    batElement.style.left = bat.x + 'px'
    batElement.style.top = bat.y + 'px'

    // Move function
    const move = () => {
      const left = bat.tx - bat.x
      const top = bat.ty - bat.y
      let length = Math.sqrt(left * left + top * top)
      length = Math.max(1, length)

      const dLeft = defaultOptions.speed * (left / length)
      const dTop = defaultOptions.speed * (top / length)

      const ddLeft = (dLeft - bat.dx) / defaultOptions.flickering
      const ddTop = (dTop - bat.dy) / defaultOptions.flickering

      bat.dx += ddLeft
      bat.dy += ddTop

      bat.x += bat.dx
      bat.y += bat.dy

      // Keep bats within bounds
      bat.x = Math.max(0, Math.min(bat.x, containerWidth - defaultOptions.width))
      bat.y = Math.max(0, Math.min(bat.y, containerHeight - defaultOptions.height))

      batElement.style.left = bat.x + 'px'
      batElement.style.top = bat.y + 'px'

      // Random direction change
      if (Math.random() > 0.95) {
        bat.tx = randomPosition('horizontal', containerWidth, containerHeight)
        bat.ty = randomPosition('vertical', containerWidth, containerHeight)
      }
    }

    // Animate function
    const animate = () => {
      bat.frame += 1
      if (bat.frame >= defaultOptions.frames) {
        bat.frame -= defaultOptions.frames
      }
      batElement.style.backgroundPosition = `0 ${bat.frame * -defaultOptions.height}px`
    }

    // Start intervals
    bat.moveInterval = setInterval(move, 40)
    bat.animateInterval = setInterval(animate, 200)

    return bat
  }

  const startBats = () => {
    if (!containerRef.current) return

    const containerWidth = window.innerWidth
    const containerHeight = window.innerHeight

    // Clear existing bats
    batsRef.current.forEach(bat => {
      clearInterval(bat.moveInterval)
      clearInterval(bat.animateInterval)
      if (bat.element.parentNode) {
        bat.element.parentNode.removeChild(bat.element)
      }
    })
    batsRef.current = []

    // Create new bats
    for (let i = 0; i < defaultOptions.amount; i++) {
      const bat = createBat(containerWidth, containerHeight)
      batsRef.current.push(bat)
    }
  }

  const stopBats = () => {
    batsRef.current.forEach(bat => {
      clearInterval(bat.moveInterval)
      clearInterval(bat.animateInterval)
      if (bat.element.parentNode) {
        bat.element.parentNode.removeChild(bat.element)
      }
    })
    batsRef.current = []
  }

  useEffect(() => {
    if (enabled) {
      startBats()

      const handleResize = () => {
        if (enabled) {
          startBats()
        }
      }

      window.addEventListener('resize', handleResize)
      return () => {
        window.removeEventListener('resize', handleResize)
        stopBats()
      }
    } else {
      stopBats()
    }
  }, [enabled])

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: defaultOptions.zIndex }}
    />
  )
}

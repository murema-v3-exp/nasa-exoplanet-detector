import React, { useEffect, useRef, useState } from 'react'

interface DynamicBackgroundProps {
  className?: string
}

const DynamicBackground: React.FC<DynamicBackgroundProps> = ({ className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [shouldRender, setShouldRender] = useState(true)

  // Check device performance capabilities
  useEffect(() => {
    const checkPerformance = () => {
      // Disable on mobile devices or reduced motion preference
      const isMobile = window.innerWidth <= 768
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      const isLowMemory = (navigator as any).deviceMemory && (navigator as any).deviceMemory < 4
      
      if (isMobile || prefersReducedMotion || isLowMemory) {
        setShouldRender(false)
        return
      }
    }
    
    checkPerformance()
  }, [])

  useEffect(() => {
    if (!shouldRender) return
    
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    // 3 Specific geometric shapes: Sphere, Ring, and Cube
    class GeometricShape {
      x: number
      y: number
      vx: number
      vy: number
      size: number
      maxSize: number
      pulseFactor: number
      color: string
      glowColor: string
      angle: number
      shape: 'sphere' | 'ring' | 'cube'

      constructor(canvasWidth: number, canvasHeight: number, index: number) {
        // Position shapes strategically across screen
        const configurations = [
          { x: canvasWidth * 0.15, y: canvasHeight * 0.25, shape: 'sphere' as const },
          { x: canvasWidth * 0.75, y: canvasHeight * 0.65, shape: 'ring' as const },
          { x: canvasWidth * 0.45, y: canvasHeight * 0.85, shape: 'cube' as const }
        ]
        
        const config = configurations[index]
        this.x = config.x
        this.y = config.y
        this.shape = config.shape
        this.vx = (Math.random() - 0.5) * 0.08 // Slow floating movement
        this.vy = (Math.random() - 0.5) * 0.08
        this.maxSize = 50 + Math.random() * 30 // Large size (50-80px)
        this.size = this.maxSize
        this.pulseFactor = 0
        this.angle = Math.random() * Math.PI * 2
        
        const colorPairs = [
          { color: '#00d4ff', glow: 'rgba(0, 212, 255, 0.4)' }, // Sphere - cyan
          { color: '#ff0080', glow: 'rgba(255, 0, 128, 0.4)' }, // Ring - magenta  
          { color: '#7c3aed', glow: 'rgba(124, 58, 237, 0.4)' } // Cube - purple
        ]
        
        const colorPair = colorPairs[index]
        this.color = colorPair.color
        this.glowColor = colorPair.glow
      }

      update(canvasWidth: number, canvasHeight: number) {
        // Slow floating movement
        this.x += this.vx
        this.y += this.vy
        
        // Shape-specific rotation speeds
        if (this.shape === 'cube') {
          this.angle += 0.015 // Faster rotation for cube
        } else {
          this.angle += 0.005
        }
        
        this.pulseFactor += 0.02

        // Gentle bouncing off walls
        if (this.x < this.maxSize || this.x > canvasWidth - this.maxSize) {
          this.vx *= -1
        }
        if (this.y < this.maxSize || this.y > canvasHeight - this.maxSize) {
          this.vy *= -1
        }

        // Keep within bounds
        this.x = Math.max(this.maxSize, Math.min(canvasWidth - this.maxSize, this.x))
        this.y = Math.max(this.maxSize, Math.min(canvasHeight - this.maxSize, this.y))

        // Shape-specific size effects
        if (this.shape === 'sphere') {
          this.size = this.maxSize + Math.sin(this.pulseFactor) * 8 // Gentle pulsing
        } else if (this.shape === 'ring') {
          this.size = this.maxSize + Math.sin(this.pulseFactor * 0.5) * 12 // Slower, larger pulse
        } else {
          this.size = this.maxSize // Cube stays constant size
        }
      }

      draw(ctx: CanvasRenderingContext2D) {
        ctx.save()
        
        // Common glow effect
        const glowGradient = ctx.createRadialGradient(
          this.x, this.y, 0,
          this.x, this.y, this.size * 2.5
        )
        glowGradient.addColorStop(0, this.color)
        glowGradient.addColorStop(0.4, this.glowColor)
        glowGradient.addColorStop(1, 'transparent')
        
        // Draw outer glow
        ctx.globalAlpha = 0.5
        ctx.fillStyle = glowGradient
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size * 2.5, 0, Math.PI * 2)
        ctx.fill()
        
        // Draw shape based on type
        ctx.globalAlpha = 0.9
        
        if (this.shape === 'sphere') {
          this.drawSphere(ctx)
        } else if (this.shape === 'ring') {
          this.drawRing(ctx)
        } else if (this.shape === 'cube') {
          this.drawCube(ctx)
        }
        
        ctx.restore()
      }
      
      drawSphere(ctx: CanvasRenderingContext2D) {
        const gradient = ctx.createRadialGradient(
          this.x - this.size * 0.3, this.y - this.size * 0.3, 0,
          this.x, this.y, this.size
        )
        gradient.addColorStop(0, this.color)
        gradient.addColorStop(0.7, this.glowColor)
        gradient.addColorStop(1, 'transparent')
        
        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
        ctx.fill()
      }
      
      drawRing(ctx: CanvasRenderingContext2D) {
        ctx.strokeStyle = this.color
        ctx.lineWidth = 8
        ctx.shadowColor = this.color
        ctx.shadowBlur = 15
        
        // Outer ring
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
        ctx.stroke()
        
        // Inner ring for depth
        ctx.lineWidth = 4
        ctx.shadowBlur = 10
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size * 0.7, 0, Math.PI * 2)
        ctx.stroke()
      }
      
      drawCube(ctx: CanvasRenderingContext2D) {
        const cubeSize = this.size * 0.8
        
        // Apply rotation
        ctx.translate(this.x, this.y)
        ctx.rotate(this.angle)
        
        // Draw cube with perspective
        const offset = cubeSize * 0.3
        
        // Back face
        ctx.fillStyle = this.glowColor
        ctx.fillRect(-cubeSize/2 + offset, -cubeSize/2 + offset, cubeSize, cubeSize)
        
        // Front face
        ctx.fillStyle = this.color
        ctx.fillRect(-cubeSize/2, -cubeSize/2, cubeSize, cubeSize)
        
        // Add glow effect
        ctx.shadowColor = this.color
        ctx.shadowBlur = 20
        ctx.strokeStyle = this.color
        ctx.lineWidth = 2
        ctx.strokeRect(-cubeSize/2, -cubeSize/2, cubeSize, cubeSize)
        
        // Reset transformation
        ctx.setTransform(1, 0, 0, 1, 0, 0)
      }
    }



    // Initialize 3 geometric shapes: sphere, ring, cube
    const shapes: GeometricShape[] = []
    
    for (let i = 0; i < 3; i++) {
      shapes.push(new GeometricShape(canvas.width, canvas.height, i))
    }

    // Animation loop - only 3 shapes
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Update and draw geometric shapes
      shapes.forEach(shape => {
        shape.update(canvas.width, canvas.height)
        shape.draw(ctx)
      })

      requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener('resize', resizeCanvas)
    }
  }, [shouldRender])

  // Don't render canvas on low-performance devices
  if (!shouldRender) {
    return null
  }

  return (
    <canvas
      ref={canvasRef}
      className={`dynamic-background ${className}`}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 2,
        opacity: 0.4
      }}
    />
  )
}

export default DynamicBackground
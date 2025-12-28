'use client'

import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { GripVertical } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface ImageComparisonProps {
  beforeImage: string
  afterImage: string
  beforeLabel?: string
  afterLabel?: string
  className?: string
}

export function ImageComparison({
  beforeImage,
  afterImage,
  beforeLabel = 'Avant',
  afterLabel = 'Après',
  className
}: ImageComparisonProps) {
  const [sliderPosition, setSliderPosition] = useState(50)
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = clientX - rect.left
    const percentage = (x / rect.width) * 100
    setSliderPosition(Math.max(0, Math.min(100, percentage)))
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) handleMove(e.clientX)
    }
    const handleTouchMove = (e: TouchEvent) => {
      if (isDragging && e.touches[0]) {
        e.preventDefault() // Empêche scroll pendant drag
        handleMove(e.touches[0].clientX)
      }
    }
    const handleEnd = () => setIsDragging(false)

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('touchmove', handleTouchMove, { passive: false })
      document.addEventListener('mouseup', handleEnd)
      document.addEventListener('touchend', handleEnd)

      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('touchmove', handleTouchMove)
        document.removeEventListener('mouseup', handleEnd)
        document.removeEventListener('touchend', handleEnd)
      }
    }
  }, [isDragging])

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{
        duration: 0.6,
        ease: [0.25, 0.4, 0.25, 1],
      }}
      className={cn("relative w-full max-w-4xl mx-auto", className)}
    >
      {/* Labels avec stagger animation */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="absolute top-4 left-4 z-10"
      >
        <Badge variant="secondary" className="bg-white/5 border-white/10 text-white">
          {beforeLabel}
        </Badge>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.3, duration: 0.4 }}
        className="absolute top-4 right-4 z-10"
      >
        <Badge variant="secondary" className="bg-white/5 border-white/10 text-white">
          {afterLabel}
        </Badge>
      </motion.div>

      {/* Image Container */}
      <div
        ref={containerRef}
        className="relative w-full aspect-[3/2] sm:aspect-video overflow-hidden rounded-2xl border border-white/10 select-none"
      >
        {/* After Image (full, base layer) */}
        <Image
          src={afterImage}
          alt={afterLabel}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
          quality={85}
          className="object-cover"
          priority
        />

        {/* Before Image (clipped overlay) */}
        <div
          className="absolute inset-0"
          style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
        >
          <Image
            src={beforeImage}
            alt={beforeLabel}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
            quality={85}
            className="object-cover"
            priority
          />
        </div>

        {/* Slider Handle */}
        <div
          className={cn(
            "absolute top-0 bottom-0 bg-white cursor-ew-resize transition-all",
            isDragging ? "w-1.5" : "w-1"
          )}
          style={{ left: `${sliderPosition}%` }}
          onMouseDown={() => setIsDragging(true)}
          onTouchStart={() => setIsDragging(true)}
        >
          <div
            className={cn(
              "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full flex items-center justify-center shadow-lg transition-all",
              isDragging ? "w-12 h-12 bg-white" : "w-10 h-10 bg-white hover:scale-110"
            )}
          >
            <GripVertical className="w-5 h-5 text-black" />
          </div>
        </div>
      </div>

      {/* Accessibility: Respect prefers-reduced-motion */}
      <style jsx>{`
        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </motion.div>
  )
}

'use client'

import { useState } from 'react'

interface MediaItem {
  url: string
  media_type: 'image' | 'video' | 'audio' | 'gif'
}

interface MediaCarouselProps {
  media: MediaItem[]
}

export default function MediaCarousel({ media }: MediaCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  if (!media || media.length === 0) return null

  const current = media[currentIndex]
  const showNav = media.length > 1

  const goNext = () => setCurrentIndex((i) => (i + 1) % media.length)
  const goPrev = () => setCurrentIndex((i) => (i - 1 + media.length) % media.length)

  const renderMedia = (item: MediaItem) => {
    if (item.media_type === 'video') {
      return (
        <video
          src={`${item.url}#t=0.001`}
          controls
          playsInline
          preload="metadata"
          style={{ width: '100%', display: 'block', maxHeight: '500px' }}
        />
      )
    }
    if (item.media_type === 'audio') {
      return (
        <div style={{ padding: '20px', background: '#f3f4f6' }}>
          <audio controls src={item.url} preload="metadata" style={{ width: '100%' }} />
        </div>
      )
    }
    // image or gif — both render as <img>
    return (
      <img
        src={item.url}
        alt="Post media"
        loading="lazy"
        style={{ width: '100%', display: 'block', objectFit: 'contain', maxHeight: '500px' }}
      />
    )
  }

  return (
    <div
      style={{
        marginTop: '15px',
        borderRadius: '12px',
        overflow: 'hidden',
        backgroundColor: '#000',
        maxWidth: '100%',
        position: 'relative',
      }}
    >
      {renderMedia(current)}

      {showNav && (
        <>
          {/* Previous arrow */}
          <button
            onClick={goPrev}
            aria-label="Previous media"
            style={{
              position: 'absolute',
              top: '50%',
              left: '8px',
              transform: 'translateY(-50%)',
              background: 'rgba(0,0,0,0.6)',
              color: 'white',
              border: 'none',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              fontSize: '20px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ‹
          </button>
          {/* Next arrow */}
          <button
            onClick={goNext}
            aria-label="Next media"
            style={{
              position: 'absolute',
              top: '50%',
              right: '8px',
              transform: 'translateY(-50%)',
              background: 'rgba(0,0,0,0.6)',
              color: 'white',
              border: 'none',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              fontSize: '20px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ›
          </button>
          {/* Dots indicator */}
          <div
            style={{
              position: 'absolute',
              bottom: '12px',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              gap: '6px',
              background: 'rgba(0,0,0,0.4)',
              padding: '4px 10px',
              borderRadius: '12px',
            }}
          >
            {media.map((_, i) => (
              <div
                key={i}
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: i === currentIndex ? 'white' : 'rgba(255,255,255,0.4)',
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
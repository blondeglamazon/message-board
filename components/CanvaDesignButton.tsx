'use client'

import { useEffect, useState } from 'react'

export default function CanvaDesignButton({ onSave }: { onSave: (url: string) => void }) {
  const [canva, setCanva] = useState<any>(null)

  useEffect(() => {
    // Check if the Canva API is loaded
    const checkCanva = setInterval(() => {
      if ((window as any).Canva && (window as any).Canva.DesignButton) {
        setCanva((window as any).Canva.DesignButton)
        clearInterval(checkCanva)
      }
    }, 500) // Check every 500ms

    return () => clearInterval(checkCanva)
  }, [])

  const handleDesign = () => {
    if (!canva) {
      alert("Canva is loading... please try again in a second.")
      return
    }

    canva.initialize({
      apiKey: 'YOUR_API_KEY_HERE', // 🔴 REPLACE THIS with your real Canva API Key
      type: 'Poster', // or 'Presentation', 'SocialMedia', etc.
      onDesignPublish: (design: any) => {
        // This returns the URL of the design the user made
        onSave(design.exportUrl) 
      }
    })
  }

  return (
    <button
      type="button"
      onClick={handleDesign}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
        width: '100%', padding: '12px', 
        border: '2px dashed #d1d5db', borderRadius: '12px',
        color: '#6b7280', backgroundColor: 'white',
        cursor: 'pointer', fontWeight: '500', fontSize: '16px',
        marginTop: '10px'
      }}
    >
      <span style={{ fontSize: '20px' }}>🎨</span> Design with Canva
    </button>
  )
}
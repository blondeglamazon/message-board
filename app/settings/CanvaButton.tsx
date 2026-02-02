'use client'

import { useEffect, useState } from 'react'

export default function CanvaButton({ onSave }: { onSave: (url: string) => void }) {
  const [canva, setCanva] = useState<any>(null)

  useEffect(() => {
    if ((window as any).Canva && (window as any).Canva.DesignButton) {
      setCanva((window as any).Canva.DesignButton);
    }
  }, [])

  const handleDesign = () => {
    if (!canva) return;

    // Inside app/settings/CanvaButton.tsx
canva.initialize({
  apiKey: 'AAHAAAsgl1s', // Use your App ID here
  type: 'Poster', 
  onDesignPublish: (design: any) => {
    onSave(design.exportUrl);
  }
});
  }

  return (
    <button
      type="button"
      onClick={handleDesign}
      className="flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-blue-500 hover:text-blue-500 transition-all font-medium"
    >
      <span className="text-xl">🎨</span> Design Backdrop with Canva
    </button>
  )
}
'use client'

export default function CanvaButton({ designId }: { designId: string | null }) {
  if (!designId) return null

  const handleClick = () => {
    // Opens the Canva design in a new tab for viewing
    window.open(`https://www.canva.com/design/${designId}/view`, '_blank')
  }

  return (
    <button 
      onClick={handleClick}
      style={{
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        gap: '8px',
        padding: '0 20px', 
        minHeight: '44px', // Apple Compliance
        backgroundColor: 'white', 
        border: '1px solid #E5E7EB',
        borderRadius: '22px',
        color: '#7D2AE8', 
        fontWeight: '600',
        fontSize: '14px',
        cursor: 'pointer',
        marginTop: '10px',
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
      }}
    >
      <span style={{ fontSize: '16px' }}>🎨</span> 
      <span>View Portfolio</span>
    </button>
  )
}
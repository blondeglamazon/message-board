'use client'

import { useState } from 'react'

interface BuyButtonProps {
  sellerId: string;
  priceInCents: number; 
  title: string;
}

export default function BuyButton({ sellerId, priceInCents, title }: BuyButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleBuy = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Send the exact item details to your backend
        body: JSON.stringify({ sellerId, priceInCents, title })
      })

      const data = await res.json()

      if (data.url) {
        // Redirect to the magical Stripe Checkout page!
        window.location.href = data.url
      } else {
        alert(data.error || 'Checkout failed')
      }
    } catch (error) {
      console.error(error)
      alert('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  // A simple calculation to turn 500 cents into "$5.00" for the button label
  const formattedPrice = (priceInCents / 100).toFixed(2);

  return (
    <button
      onClick={handleBuy}
      disabled={loading}
      style={{
        backgroundColor: '#10B981', // A nice "Buy Now" green
        color: 'white',
        padding: '12px 20px',
        borderRadius: '8px',
        border: 'none',
        fontWeight: 'bold',
        fontSize: '15px',
        cursor: loading ? 'not-allowed' : 'pointer',
        opacity: loading ? 0.7 : 1,
        marginTop: '16px',
        width: '100%'
      }}
    >
      {loading ? 'Loading secure checkout...' : `Buy "${title}" for $${formattedPrice}`}
    </button>
  )
}
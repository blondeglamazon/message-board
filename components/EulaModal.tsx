'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function EulaModal() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    // Check if the user has already agreed on this device
    const hasAgreed = localStorage.getItem('vimciety_eula_accepted')
    if (!hasAgreed) {
      setShow(true)
    }
  }, [])

  const handleAgree = () => {
    // Save their agreement so they are never bothered again
    localStorage.setItem('vimciety_eula_accepted', 'true')
    setShow(false)
  }

  // If they already agreed, render nothing!
  if (!show) return null

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 99999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px', backdropFilter: 'blur(5px)'
    }}>
      <div style={{
        backgroundColor: '#1f2937', color: 'white', borderRadius: '20px',
        padding: '30px', maxWidth: '400px', width: '100%',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
      }}>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 15px 0' }}>
          Terms of Use
        </h2>
        
        <p style={{ fontSize: '14px', color: '#d1d5db', lineHeight: '1.6', marginBottom: '15px' }}>
          Welcome to VIMciety! Before you join our community, you must agree to our Terms of Use and Community Guidelines.
        </p>
        
        {/* 🚨 This next paragraph is the exact magic phrase Apple is looking for */}
        <div style={{ backgroundColor: '#374151', padding: '15px', borderRadius: '10px', marginBottom: '20px' }}>
          <p style={{ fontSize: '14px', margin: 0, fontWeight: 'bold', color: '#fbbf24' }}>
            Zero Tolerance Policy:
          </p>
          <p style={{ fontSize: '13px', margin: '5px 0 0 0', color: '#e5e7eb', lineHeight: '1.5' }}>
            VIMciety has absolutely no tolerance for objectionable content or abusive users. Any users found violating this policy, posting inappropriate content, or harassing others will be immediately permanently banned without warning.
          </p>
        </div>

        <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '25px', textAlign: 'center' }}>
          Read the full <Link href="/terms" style={{ color: '#6366f1', textDecoration: 'underline' }}>Terms of Use (EULA)</Link>.
        </div>

        <button 
          onClick={handleAgree}
          style={{
            backgroundColor: '#6366f1', color: 'white', fontWeight: 'bold', 
            border: 'none', padding: '14px', borderRadius: '10px', 
            cursor: 'pointer', width: '100%', fontSize: '16px'
          }}
        >
          I Agree
        </button>
      </div>
    </div>
  )
}
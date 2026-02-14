'use client'

import { useState } from 'react'
import { createClient } from '@/app/lib/supabase/client'

export default function ReportButton({ postId }: { postId: string }) {
  const [reporting, setReporting] = useState(false)
  const supabase = createClient()

  const handleReport = async () => {
    const reason = prompt("Why are you reporting this content? (e.g., spam, harassment, inappropriate)")
    if (!reason) return

    setReporting(true)
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      alert("You must be logged in to report content.")
      setReporting(false)
      return
    }

    const { error } = await supabase
      .from('reports')
      .insert({
        reporter_id: user.id,
        post_id: postId,
        reason: reason
      })

    if (error) {
      alert("Error reporting post: " + error.message)
    } else {
      alert("Thank you. We have received your report and will review it within 24 hours.")
    }
    setReporting(false)
  }

  return (
    <button 
      onClick={handleReport} 
      disabled={reporting}
      style={{
        background: 'none',
        border: 'none',
        color: '#9ca3af',
        fontSize: '12px',
        cursor: 'pointer',
        textDecoration: 'underline'
      }}
    >
      {reporting ? 'Reporting...' : 'Report'}
    </button>
  )
}
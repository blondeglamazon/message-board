// app/api/referral/stats/route.ts
// Returns the current user's referral statistics for the dashboard

import { createClient } from '@/app/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { data, error } = await supabase.rpc('get_referral_stats', {
      p_user_id: user.id,
    })

    if (error) {
      console.error('Referral stats error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch referral stats' },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error('Referral stats API error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
import { createClient } from '@/app/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // 1. Security Check: Are they logged in?
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // 2. Grab the data from the frontend form
    const body = await req.json()
    const { title, price_in_cents, description } = body

    if (!title || !price_in_cents) {
      return NextResponse.json({ error: 'Title and Price are required' }, { status: 400 })
    }

    // 3. Insert the new product into the database!
    // Notice we securely force the seller_id to be the logged-in user's ID
    const { data, error } = await supabase
      .from('products')
      .insert([
        { 
          seller_id: user.id, 
          title: title, 
          price_in_cents: price_in_cents,
          description: description || null
        }
      ])
      .select()
      .single()

    if (error) throw error

    // 4. Send the successful product back to the UI
    return NextResponse.json({ product: data })

  } catch (err: any) {
    console.error('Create Product API error:', err)
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
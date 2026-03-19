import { createClient } from '@/app/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await req.json()
    const { title, price_in_cents, description } = body

    if (!title || !price_in_cents) {
      return NextResponse.json({ error: 'Title and Price are required' }, { status: 400 })
    }

    // 1. Insert the new product into the database
    const { data: product, error: productError } = await supabase
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

    if (productError) throw productError

    // 2. THE MAGIC: Auto-generate a post for the feed!
    // Format the price back to dollars for the post text
    const displayPrice = (price_in_cents / 100).toFixed(2)
    const postContent = `🛒 I just launched a new product: **${title}** for $${displayPrice}! \n\n${description || 'Check out my storefront to get it now!'}`

    // Insert into your posts table (Note: change 'user_id' to 'author_id' if that's what your table uses!)
    const { error: postError } = await supabase
      .from('posts')
      .insert([
        {
          user_id: user.id, // <-- Make sure this matches your posts table column name!
          content: postContent,
          // If your posts table has a 'type' or 'product_id' column, you can link it here!
        }
      ])

    if (postError) {
      console.error("Product created, but failed to auto-post:", postError)
      // We don't throw an error here so the product still successfully creates even if the post fails
    }

    // 3. Send the successful product back to the UI
    return NextResponse.json({ product })

  } catch (err: any) {
    console.error('Create Product API error:', err)
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
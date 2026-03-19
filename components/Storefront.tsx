import { createClient } from '@/app/lib/supabase/server'
import BuyButton from './BuyButton'

export default async function Storefront({ userId }: { userId: string }) {
  const supabase = await createClient()

  // 1. Fetch all products created by this specific user
  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .eq('seller_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching products:', error)
    return <div style={{ color: '#F87171' }}>Error loading storefront.</div>
  }

  // 2. If they haven't created anything yet, show a nice empty state
  if (!products || products.length === 0) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: '#9CA3AF', backgroundColor: '#1F2937', borderRadius: '12px', border: '1px dashed #4B5563', marginTop: '24px' }}>
        You haven't created any products yet. Use the form above to add your first item!
      </div>
    )
  }

  // 3. Loop through their products and display a card for each one!
  return (
    <div style={{ marginTop: '32px' }}>
      
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
        {products.map((product) => (
          <div key={product.id} style={{ backgroundColor: '#1F2937', padding: '20px', borderRadius: '12px', border: '1px solid #374151', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ color: 'white', fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
                {product.title}
              </h4>
              {product.description && (
                <p style={{ color: '#9CA3AF', fontSize: '14px', marginBottom: '12px', lineHeight: '1.4' }}>
                  {product.description}
                </p>
              )}
              <div style={{ color: '#34D399', fontSize: '24px', fontWeight: 'bold' }}>
                ${(product.price_in_cents / 100).toFixed(2)}
              </div>
            </div>
            
            {/* Reusing your awesome Stripe BuyButton! */}
            <BuyButton 
              sellerId={product.seller_id}
              priceInCents={product.price_in_cents}
              title={product.title}
            />
            
          </div>
        ))}
      </div>
    </div>
  )
}
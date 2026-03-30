'use client'; 

import { useState, useEffect } from 'react'; 
import { createClient } from '@/app/lib/supabase/client'
import BuyButton from './BuyButton'

export default function Storefront({ userId }: { userId: string }) {
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  
  // ✅ FIX: useState ensures supabase is created ONCE and stays stable across renders.
  // Previously, createClient() was called on every render, producing a new reference
  // that triggered the useEffect dependency check → re-fetch → re-render → infinite loop.
  const [supabase] = useState(() => createClient());

  useEffect(() => {
    const fetchProducts = async () => {
      if (!userId) return;
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('seller_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching products:', error);
        setHasError(true);
      } else {
        setProducts(data || []);
      }
      setIsLoading(false);
    };

    fetchProducts();
  }, [userId, supabase]);

  if (isLoading) {
    return <div style={{ color: '#9CA3AF', textAlign: 'center', marginTop: '32px' }}>Loading storefront...</div>;
  }

  if (hasError) {
    return <div style={{ color: '#F87171', textAlign: 'center', marginTop: '32px' }}>Error loading storefront.</div>;
  }

  if (products.length === 0) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: '#9CA3AF', backgroundColor: '#1F2937', borderRadius: '12px', border: '1px dashed #4B5563', marginTop: '24px' }}>
        You haven't created any products yet. Use the form above to add your first item!
      </div>
    )
  }

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
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/app/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// 1. ADD CORS HEADERS HELPER
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Allows Capacitor mobile apps to connect
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// 2. HANDLE PREFLIGHT CORS REQUESTS
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(req: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-02-25.clover',
  });

  try {
    let user = null;

    // Try cookie-based auth first (works on web)
    const supabase = await createClient();
    const { data: { user: cookieUser } } = await supabase.auth.getUser();
    
    if (cookieUser) {
      user = cookieUser;
    } else {
      // Fallback: read Bearer token from Authorization header (works on mobile)
      const authHeader = req.headers.get('Authorization');
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.replace('Bearer ', '');
        const supabaseAnon = createSupabaseClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        const { data: { user: tokenUser } } = await supabaseAnon.auth.getUser(token);
        user = tokenUser;
      }
    }

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    // 3. FIX RLS ISSUE FOR MOBILE
    // Use the Service Role Key to bypass RLS since the standard createClient() lacks mobile cookies.
    // Make sure SUPABASE_SERVICE_ROLE_KEY is in your environment variables!
    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY! 
    );

    // Check if they already have a Stripe account ID in your database
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('stripe_account_id')
      .eq('id', user.id)
      .maybeSingle();

    let accountId = profile?.stripe_account_id;

    // If they don't have one, create a new Stripe Standard account
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'standard',
      });
      accountId = account.id;

      // Save this new ID to their Supabase profile securely
      await supabaseAdmin
        .from('profiles')
        .update({ stripe_account_id: accountId })
        .eq('id', user.id);
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${baseUrl}/settings?stripe=refresh`,
      return_url: `${baseUrl}/settings?stripe=success`,
      type: 'account_onboarding',
    });

    // 4. RETURN WITH CORS HEADERS
    return NextResponse.json({ url: accountLink.url }, { headers: corsHeaders });

  } catch (error: any) {
    console.error('Stripe Onboarding Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}
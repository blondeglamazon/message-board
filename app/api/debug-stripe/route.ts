import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    keyMode: process.env.STRIPE_SECRET_KEY?.startsWith('sk_live')
      ? 'LIVE'
      : process.env.STRIPE_SECRET_KEY?.startsWith('sk_test')
        ? 'TEST'
        : 'MISSING',
    keyLastFour: process.env.STRIPE_SECRET_KEY?.slice(-4) || 'MISSING',
    vimPlusPriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_VIM_PLUS || 'MISSING',
    verifiedPriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_VERIFIED || 'MISSING',
  });
}
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }
    const token = authHeader.replace('Bearer ', '');

    // Verify the caller
    const supabaseAnon = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data: { user }, error: authError } = await supabaseAnon.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid or expired session' }, { status: 401 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Delete user-owned files from Storage
    // Adjust the bucket names and path prefixes to match your actual Storage layout
    const STORAGE_BUCKETS = ['avatars', 'backgrounds', 'post-media'];
    for (const bucket of STORAGE_BUCKETS) {
      try {
        const { data: files } = await supabaseAdmin.storage
          .from(bucket)
          .list(user.id, { limit: 1000 });
        if (files && files.length > 0) {
          const paths = files.map((f) => `${user.id}/${f.name}`);
          await supabaseAdmin.storage.from(bucket).remove(paths);
        }
      } catch (e) {
        console.error(`[delete-account] storage cleanup failed for ${bucket}:`, e);
        // Don't block deletion on storage failures
      }
    }

    // 2. Run the atomic DB cleanup via RPC
    const { error: rpcError } = await supabaseAdmin.rpc('delete_user_account', {
      p_user_id: user.id,
    });
    if (rpcError) {
      console.error('[delete-account] RPC failed:', rpcError);
      return NextResponse.json({ error: rpcError.message }, { status: 500 });
    }

    // 3. Delete the auth user
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
    if (deleteError) {
      console.error('[delete-account] auth delete failed:', deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('[delete-account] fatal:', error);
    return NextResponse.json({ error: error?.message ?? 'Failed to delete account' }, { status: 500 });
  }
}
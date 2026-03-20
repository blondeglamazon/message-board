'use server'

import { createClient } from '@supabase/supabase-js'

// 1. Initialize the Admin Client (Bypasses RLS, can delete Auth users)
// We disable persistSession to ensure mobile app / serverless compliance and prevent memory leaks
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Helper function for logging admin actions securely
async function logAction(adminEmail: string, type: string, targetId: string, details: any) {
  await supabaseAdmin.from('audit_logs').insert({
    admin_email: adminEmail,
    action_type: type,
    target_id: targetId,
    details: details
  })
}

// Security Check: Verify the person requesting the action is actually an Admin
async function verifyAdmin(userId: string) {
  if (!userId) throw new Error('Not authenticated')

  const { data: adminProfile, error } = await supabaseAdmin
    .from('profiles')
    .select('role, email')
    .eq('id', userId)
    .single()

  if (error || adminProfile?.role !== 'admin') {
    throw new Error('Unauthorized: Admin privileges required')
  }
  
  return adminProfile
}

export async function updateUserRole(adminUserId: string, targetUserId: string, newRole: string) {
  try {
    // 1. Verify the person making the request is an admin
    const adminProfile = await verifyAdmin(adminUserId)

    // 2. Update the target user's role
    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ role: newRole })
      .eq('id', targetUserId)

    if (error) throw error

    // 3. Log the action
    await logAction(adminProfile.email!, 'ROLE_UPDATE', targetUserId, { new_role: newRole })
    
    return true // Return success status so the UI knows to update
  } catch (error: any) {
    console.error('Error updating role:', error.message)
    throw new Error(error.message || 'Failed to update user role')
  }
}

export async function deleteUser(adminUserId: string, targetUserId: string) {
  try {
    // 1. Verify the person making the request is an admin
    const adminProfile = await verifyAdmin(adminUserId)

    // 2. 🚨 DELETE THE ACTUAL AUTH ACCOUNT
    // (This automatically deletes their profile if ON DELETE CASCADE is set up in Supabase)
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(targetUserId)

    if (authError) throw authError

    // 3. Manually delete the profile just in case CASCADE isn't fully configured
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', targetUserId)

    if (profileError) {
      console.warn("Profile deletion warning (User auth was still deleted):", profileError.message)
    }

    // 4. Log the action
    await logAction(adminProfile.email!, 'USER_DELETE', targetUserId, {})
    
    return true // Return success status
  } catch (error: any) {
    console.error('Error deleting user:', error.message)
    throw new Error(error.message || 'Failed to delete user')
  }
  
}
// --- ADD THESE TO THE BOTTOM OF app/admin/actions.ts ---

export async function dismissReport(adminUserId: string, reportId: string) {
  try {
    const adminProfile = await verifyAdmin(adminUserId)

    const { error } = await supabaseAdmin
      .from('reports')
      .update({ status: 'reviewed' })
      .eq('id', reportId)

    if (error) throw error

    await logAction(adminProfile.email!, 'DISMISS_REPORT', reportId, {})
    return true
  } catch (error: any) {
    console.error('Error dismissing report:', error.message)
    throw new Error(error.message || 'Failed to dismiss report')
  }
}

export async function deleteReportedPost(adminUserId: string, reportId: string, postId: string) {
  try {
    const adminProfile = await verifyAdmin(adminUserId)

    // 1. Delete the offending post
    const { error: postError } = await supabaseAdmin
      .from('posts')
      .delete()
      .eq('id', postId)

    if (postError) throw postError

    // 2. Mark the report as resolved/reviewed
    const { error: reportError } = await supabaseAdmin
      .from('reports')
      .update({ status: 'reviewed' })
      .eq('id', reportId)

    if (reportError) throw reportError

    // 3. Log the action
    await logAction(adminProfile.email!, 'DELETE_REPORTED_POST', postId, { report_id: reportId })
    return true
  } catch (error: any) {
    console.error('Error deleting reported post:', error.message)
    throw new Error(error.message || 'Failed to delete reported post')
  }
}

// --- ADD THIS TO THE BOTTOM OF app/admin/actions.ts ---

export async function deletePost(adminUserId: string, postId: string) {
  try {
    const adminProfile = await verifyAdmin(adminUserId)

    const { error } = await supabaseAdmin
      .from('posts')
      .delete()
      .eq('id', postId)

    if (error) throw error

    // Log the action
    await logAction(adminProfile.email!, 'DELETE_POST_MANUAL', postId, {})
    return true
  } catch (error: any) {
    console.error('Error deleting post:', error.message)
    throw new Error(error.message || 'Failed to delete post')
  }
}
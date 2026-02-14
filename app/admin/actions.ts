import { createClient } from '@/app/lib/supabase/client' // <--- Use Client Import

// Helper function for logging admin actions (Now runs on client)
async function logAction(adminEmail: string, type: string, targetId: string, details: any) {
  const supabase = createClient()
  await supabase.from('audit_logs').insert({
    admin_email: adminEmail,
    action_type: type,
    target_id: targetId,
    details: details
  })
}

export async function updateUserRole(userId: string, newRole: string) {
  const supabase = createClient()
  
  // 1. Security Check
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('Not authenticated')

  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (adminProfile?.role !== 'admin') {
    throw new Error('Unauthorized')
  }

  // 2. Update the role
  const { error } = await supabase
    .from('profiles')
    .update({ role: newRole })
    .eq('id', userId)

  if (!error) {
    // 3. Log (No revalidatePath needed)
    await logAction(user.email!, 'ROLE_UPDATE', userId, { new_role: newRole })
    return true // Return success status so the UI knows to update
  } else {
    throw error
  }
}

export async function deleteUser(userId: string) {
  const supabase = createClient()

  // 1. Security Check
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('Not authenticated')

  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (adminProfile?.role !== 'admin') {
    throw new Error('Unauthorized')
  }

  // 2. Delete the user profile
  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('id', userId)

  if (!error) {
    // 3. Log
    await logAction(user.email!, 'USER_DELETE', userId, {})
    return true // Return success status
  } else {
    throw error
  }
}
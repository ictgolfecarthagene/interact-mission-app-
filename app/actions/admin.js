'use server';

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

// Initialize with SERVICE ROLE KEY to bypass Row Level Security
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function approveMember(userId) {
  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({ is_verified: true })
      .eq('id', userId)
      .select();

    if (error) {
      console.error('Supabase Error:', error.message);
      return { success: false, error: error.message };
    }

    // Refresh the dashboard cache to show the updated status immediately
    revalidatePath('/admin'); 

    return { success: true, data };
  } catch (err) {
    console.error('Server Action Error:', err);
    return { success: false, error: 'Failed to approve member' };
  }
}
'use server';

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

// 1. Initialize Supabase Admin Client
// You MUST use the SUPABASE_SERVICE_ROLE_KEY here, not the ANON key.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY 
);

export async function approveMember(userId) {
  try {
    // 2. Force the update bypassing RLS
    const { data, error } = await supabaseAdmin
      .from('profiles') // Verify this is your exact table name
      .update({ is_verified: true }) // Verify this is your exact column name
      .eq('id', userId);

    if (error) {
      console.error("Supabase Write Error:", error.message);
      return { success: false, error: error.message };
    }

    // 3. Tell Next.js to refresh the data on the page
    // Change '/' to the exact URL of your admin page (e.g., '/dashboard')
    revalidatePath('/'); 

    return { success: true };
  } catch (error) {
    console.error("Server Action Crash:", error.message);
    return { success: false, error: error.message };
  }
}
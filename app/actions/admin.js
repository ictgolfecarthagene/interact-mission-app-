'use server';

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY 
);

export async function approveMember(userId) {
  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({ is_verified: true })
      .eq('id', userId)
      .select(); // <-- CRITICAL: Forces Supabase to return the updated row

    // 1. Catch actual database errors
    if (error) {
      console.error("Supabase Write Error:", error.message);
      return { success: false, error: error.message };
    }

    // 2. Catch "Silent Failures" (0 rows updated due to RLS or wrong key)
    if (!data || data.length === 0) {
      return { 
        success: false, 
        error: "Update blocked. Check if SUPABASE_SERVICE_ROLE_KEY is correct in .env.local!" 
      };
    }

    // 3. Purge the Next.js cache for the ENTIRE dashboard layout so the refresh works
    revalidatePath('/', 'layout'); 

    return { success: true };
  } catch (error) {
    console.error("Server Action Crash:", error.message);
    return { success: false, error: error.message };
  }
}
'use server';

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

export async function approveMember(userId) {
  console.log("=== APPROVAL PROCESS STARTED ===");
  console.log("1. Target User ID received:", userId);

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    console.log("2. Environment Variables Loaded:");
    console.log(" - URL exists:", !!supabaseUrl);
    console.log(" - Service Key exists:", !!serviceKey);
    console.log(" - Is it the Service Key? (should start with eyJ):", serviceKey?.substring(0, 3) === 'eyJ');

    const supabaseAdmin = createClient(supabaseUrl, serviceKey);

    console.log("3. Sending UPDATE to Supabase...");
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({ is_verified: true })
      .eq('id', userId)
      .select();

    console.log("4. Supabase Response:");
    console.log(" - Error:", error ? error.message : "None");
    console.log(" - Data updated:", data);

    if (error) {
      return { success: false, error: `DB Error: ${error.message}` };
    }

    if (!data || data.length === 0) {
      return { 
        success: false, 
        error: "ZERO ROWS UPDATED. The User ID is wrong, or Vercel used the Anon key instead of the Service Role key." 
      };
    }

    console.log("5. Purging Vercel Cache...");
    revalidatePath('/', 'layout'); 
    
    console.log("=== APPROVAL PROCESS SUCCESS ===");
    return { success: true };

  } catch (error) {
    console.error("SERVER CRASH:", error.message);
    return { success: false, error: error.message };
  }
}
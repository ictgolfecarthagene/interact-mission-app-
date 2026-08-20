'use server';

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = createClient(supabaseUrl, serviceKey);

// 1. Single User Verification
export async function approveMember(userId) {
  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({ is_verified: true })
      .eq('id', userId)
      .select();

    if (error) return { success: false, error: error.message };
    if (!data || data.length === 0) return { success: false, error: "ZERO ROWS UPDATED." };

    revalidatePath('/', 'layout'); 
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// 2. NEW: Bulk User Verification
export async function bulkApproveMembers(userIds) {
  try {
    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ is_verified: true })
      .in('id', userIds); // Selects multiple IDs at once!

    if (error) throw error;

    revalidatePath('/', 'layout'); 
    return { success: true };
  } catch (error) {
    console.error("Bulk Approve Error:", error.message);
    return { success: false, error: error.message };
  }
}

// 3. Function to Archive / Unarchive Actions
export async function toggleArchiveAction(actionId, isArchived) {
  try {
    const { error } = await supabaseAdmin
      .from('submitted_actions')
      .update({ archived: isArchived })
      .eq('id', actionId);

    if (error) throw error;

    revalidatePath('/', 'layout'); 
    return { success: true };
  } catch (error) {
    console.error("Archive Error:", error.message);
    return { success: false, error: error.message };
  }
}

// 4. Function to Save Feedback / Remarques
export async function saveActionFeedback(actionId, text) {
  try {
    const { error } = await supabaseAdmin
      .from('submitted_actions')
      .update({ remarque: text })
      .eq('id', actionId);

    if (error) throw error;

    revalidatePath('/', 'layout');
    return { success: true };
  } catch (error) {
    console.error("Feedback Error:", error.message);
    return { success: false, error: error.message };
  }
}
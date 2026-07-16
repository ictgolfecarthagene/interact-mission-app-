import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { id } = await req.json();

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // 1. Force delete the profile data
    await supabaseAdmin.from('profiles').delete().eq('id', id);

    // 2. Force delete the actual login credentials from the hidden Auth vault
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);
    if (authError) throw authError;

    return NextResponse.json({ message: "Utilisateur supprimé avec succès" }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
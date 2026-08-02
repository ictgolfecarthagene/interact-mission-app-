import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { email, password, fullName, club } = await req.json();

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Creates the user in the secure Auth vault (auto-confirmed)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    if (authError) throw authError;

    // Creates their public profile, automatically defaulting them to 'chef_club'
    const { error: profileError } = await supabaseAdmin.from('profiles').insert([{
      id: authData.user.id,
      email,
      full_name: fullName,
      role: 'chef_club',
      poste: 'Chef des actions internationales',
      club: club
    }]);

    if (profileError) throw profileError;

    return NextResponse.json({ message: "Compte créé avec succès" }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
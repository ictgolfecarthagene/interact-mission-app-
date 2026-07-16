import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { email, password, fullName, role, poste, club } = await req.json();

    // Initialize Admin client with SERVICE_ROLE_KEY to bypass security rules for account creation
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // 1. Create the Authentication Account (Email & Password)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    if (authError) throw authError;

    // 2. Insert the user's details into your public 'profiles' table
    const { error: profileError } = await supabaseAdmin.from('profiles').insert([{
      id: authData.user.id,
      email,
      full_name: fullName,
      role,
      poste,
      club: role === 'chef_club' ? club : null
    }]);

    if (profileError) throw profileError;

    return NextResponse.json({ message: "Utilisateur créé avec succès" }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
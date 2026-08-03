import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { fullName, email, password, club, type } = await req.json();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // 1. Create the user in Supabase Authentication
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    // 2. Save the user profile data to your 'users' table
    const { error: dbError } = await supabase
      .from('profiles')
      .insert([
        {
          id: authData.user?.id, 
          full_name: fullName,
          email: email,
          club: club,
          type: type || 'club', // Saves 'club' or 'national'
          is_verified: false,   // Locks the account until an admin approves it
          role: 'chef_club'
        }
      ]);

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 400 });
    }

    return NextResponse.json({ message: "Compte créé avec succès." }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ error: "Erreur interne du serveur." }, { status: 500 });
  }
}
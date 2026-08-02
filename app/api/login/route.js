import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { email, password } = await req.json();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // 1. Check credentials
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      return NextResponse.json({ error: "Email ou mot de passe incorrect." }, { status: 401 });
    }

    // 2. Fetch the user's profile to check their verification status
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: "Profil utilisateur introuvable." }, { status: 404 });
    }

    // 3. Block login if the account is not verified by an admin
    if (userData.is_verified === false) {
      await supabase.auth.signOut(); // Force sign out
      return NextResponse.json({ 
        error: "Votre compte est en attente de validation par la coordination nationale." 
      }, { status: 403 });
    }

    // 4. Success! Let them in.
    return NextResponse.json({ message: "Connexion réussie", user: userData }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ error: "Erreur interne du serveur." }, { status: 500 });
  }
}
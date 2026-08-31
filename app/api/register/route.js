import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { fullName, email, password, club, type, poste } = await req.json();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    // Determine correct role based on the selected tab
    let assignedRole = 'chef_club';
    if (type === 'national') assignedRole = 'comite_national';
    if (type === 'mission') assignedRole = 'chef_mission_inter';

    const { error: dbError } = await supabase
      .from('profiles')
      .insert([
        {
          id: authData.user?.id, 
          full_name: fullName,
          email: email,
          club: club,
          poste: poste,
          type: type || 'club', 
          is_verified: false,
          role: assignedRole
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
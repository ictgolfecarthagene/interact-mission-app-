import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { id, email, password, fullName, role, poste, club } = await req.json();

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const authUpdates = {};
    if (email) authUpdates.email = email;
    if (password) authUpdates.password = password; 
    
    if (Object.keys(authUpdates).length > 0) {
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(id, authUpdates);
      if (authError) throw authError;
    }

    const { error: profileError } = await supabaseAdmin.from('profiles').update({
      email,
      full_name: fullName,
      role,
      poste,
      club: role === 'chef_club' ? club : null
    }).eq('id', id);

    if (profileError) throw profileError;

    return NextResponse.json({ message: "Utilisateur mis à jour avec succès" }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
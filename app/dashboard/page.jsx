'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function DashboardHome() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/');
        return;
      }

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      setProfile(data);
      setLoading(false);
    }
    
    loadProfile();
  }, [router]);

  // Helper function for the avatar initials
  const getInitials = (name) => {
    if (!name) return 'U';
    const splitName = name.trim().split(' ');
    if (splitName.length === 1) return splitName[0][0].toUpperCase();
    return (splitName[0][0] + splitName[splitName.length - 1][0]).toUpperCase();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse text-xl font-bold text-gray-400">Chargement du portail...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Top Header with Profile Info */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">Tableau de Bord Central</h1>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden md:block text-right">
              <p className="font-bold text-gray-900 text-lg">{profile?.full_name || 'Utilisateur'}</p>
              <p className="text-sm font-medium text-gray-500">
                {profile?.poste} 
                {profile?.role === 'chef_club' && profile?.club && (
                  <span className="text-blue-600 font-bold"> • {profile.club}</span>
                )}
              </p>
            </div>
            
            <div className="h-14 w-14 rounded-full bg-blue-600 text-white shadow-md flex items-center justify-center font-extrabold text-xl border-2 border-blue-200 shrink-0">
              {getInitials(profile?.full_name)}
            </div>

            <div className="h-10 w-px bg-gray-200 hidden md:block"></div>

            <button 
              onClick={async () => { await supabase.auth.signOut(); router.push('/'); }} 
              className="px-5 py-2 text-sm bg-red-50 text-red-600 font-bold rounded-lg hover:bg-red-100 transition"
            >
              Déconnexion
            </button>
          </div>
        </div>

        {/* Dynamic Navigation Grid based on Role */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* VISIBLE TO EVERYONE (Calendar) */}
          <Link href="/dashboard/calendar" className="block p-8 bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md hover:border-blue-300 transition group cursor-pointer">
            <div className="h-12 w-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-4 text-2xl group-hover:scale-110 transition-transform">📅</div>
            <h2 className="text-2xl font-bold text-gray-900">Calendrier des Actions</h2>
            <p className="text-gray-500 mt-2">
              {profile?.role === 'chef_club' ? 'Accédez au calendrier pour déclarer votre travail.' : 'Visualisez les actions soumises par les clubs par date.'}
            </p>
          </Link>

          {/* VISIBLE ONLY TO CLUB CHEFS */}
          {profile?.role === 'chef_club' && (
            <Link href="/dashboard/ahkili" className="block p-8 bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md hover:border-indigo-300 transition group cursor-pointer">
              <div className="h-12 w-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mb-4 text-2xl group-hover:scale-110 transition-transform">💬</div>
              <h2 className="text-2xl font-bold text-gray-900 font-arabic">أحكيلي</h2>
              <p className="text-gray-500 mt-2">Ouvrez une discussion directe et confidentielle avec la mission.</p>
            </Link>
          )}

          {/* VISIBLE ONLY TO CHEF MISSION */}
          {profile?.role === 'chef_mission_inter' && (
            <Link href="/dashboard/inbox" className="block p-8 bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md hover:border-green-300 transition group cursor-pointer">
              <div className="h-12 w-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center mb-4 text-2xl group-hover:scale-110 transition-transform">📥</div>
              <h2 className="text-2xl font-bold text-gray-900">Boîte de Réception</h2>
              <p className="text-gray-500 mt-2">Gérez les actions soumises et le chat أحكيلي.</p>
            </Link>
          )}

          {/* VISIBLE ONLY TO COMITE NATIONAL */}
          {profile?.role === 'comite_national' && (
            <Link href="/dashboard/inbox" className="block p-8 bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md hover:border-teal-300 transition group cursor-pointer">
              <div className="h-12 w-12 bg-teal-100 text-teal-600 rounded-xl flex items-center justify-center mb-4 text-2xl group-hover:scale-110 transition-transform">📊</div>
              <h2 className="text-2xl font-bold text-gray-900">Travaux des Clubs</h2>
              <p className="text-gray-500 mt-2">Consultez le registre des actions soumises par les clubs.</p>
            </Link>
          )}

          {/* VISIBLE TO BOTH ADMINS */}
          {(profile?.role === 'chef_mission_inter' || profile?.role === 'comite_national') && (
            <Link href="/dashboard/users" className="block p-8 bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md hover:border-purple-300 transition group cursor-pointer">
              <div className="h-12 w-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mb-4 text-2xl group-hover:scale-110 transition-transform">👥</div>
              <h2 className="text-2xl font-bold text-gray-900">Gestion Utilisateurs</h2>
              <p className="text-gray-500 mt-2">Ajouter, modifier ou supprimer des membres du portail.</p>
            </Link>
          )}

        </div>
      </div>
    </div>
  );
}
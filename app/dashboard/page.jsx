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
      if (!user) return router.push('/');
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setProfile(data);
      setLoading(false);
    }
    loadProfile();
  }, [router]);

  const getInitials = (name) => {
    if (!name) return 'U';
    const splitName = name.trim().split(' ');
    if (splitName.length === 1) return splitName[0][0].toUpperCase();
    return (splitName[0][0] + splitName[splitName.length - 1][0]).toUpperCase();
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="animate-pulse text-xl font-bold text-indigo-400">Chargement...</div></div>;

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8 relative font-sans overflow-hidden flex flex-col">
      
      {/* Liquid Glass Background Elements */}
      <div className="fixed top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob z-0 pointer-events-none"></div>
      <div className="fixed top-[-10%] right-[-10%] w-[500px] h-[500px] bg-teal-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000 z-0 pointer-events-none"></div>

      <div className="max-w-6xl mx-auto w-full space-y-8 relative z-10 flex flex-col flex-1">
        
        {/* Header */}
        <div className="bg-white/70 backdrop-blur-2xl p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50 flex flex-col md:flex-row justify-between items-center gap-4">
          <div><h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Tableau de Bord Central</h1></div>
          <div className="flex items-center gap-6">
            <div className="hidden md:block text-right">
              <p className="font-bold text-slate-900 text-lg">{profile?.full_name}</p>
              <p className="text-sm font-medium text-slate-500">{profile?.poste} {profile?.role === 'chef_club' && profile?.club && <span className="text-indigo-600 font-bold"> • {profile.club}</span>}</p>
            </div>
            <div className="h-14 w-14 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-md flex items-center justify-center font-extrabold text-xl shrink-0 ring-2 ring-indigo-100">{getInitials(profile?.full_name)}</div>
            <div className="h-10 w-px bg-slate-200 hidden md:block"></div>
            <button onClick={async () => { await supabase.auth.signOut(); router.push('/'); }} className="px-5 py-2.5 text-sm bg-red-50/80 text-red-600 font-bold rounded-xl hover:bg-red-100 transition-colors backdrop-blur-sm shadow-sm">Déconnexion</button>
          </div>
        </div>

        {/* Dynamic Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-8">
          <Link href="/dashboard/calendar" className="block p-8 bg-white/60 backdrop-blur-xl border border-white/50 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-lg hover:-translate-y-1 transition-all group">
            <div className="h-14 w-14 bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-600 rounded-2xl flex items-center justify-center mb-5 text-2xl shadow-inner group-hover:scale-110 transition-transform">📅</div>
            <h2 className="text-2xl font-bold text-slate-900">Calendrier des Actions</h2>
            <p className="text-slate-500 mt-2 font-medium">{profile?.role === 'chef_club' ? 'Accédez au calendrier pour déclarer votre travail.' : 'Visualisez les actions soumises par les clubs.'}</p>
          </Link>

          {/* CARTE INTERACTIVE */}
          <Link href="/dashboard/foreign-clubs/map" className="block p-8 bg-white/60 backdrop-blur-xl border border-white/50 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-lg hover:-translate-y-1 transition-all group">
            <div className="h-14 w-14 bg-gradient-to-br from-sky-100 to-blue-200 text-sky-600 rounded-2xl flex items-center justify-center mb-5 text-2xl shadow-inner group-hover:scale-110 transition-transform">🌍</div>
            <h2 className="text-2xl font-bold text-slate-900">Carte Internationale</h2>
            <p className="text-slate-500 mt-2 font-medium">Explorez la base de données interactive des clubs étrangers partenaires.</p>
          </Link>

          {/* SOUMETTRE UN CLUB */}
          <Link href="/dashboard/foreign-clubs/new" className="block p-8 bg-white/60 backdrop-blur-xl border border-white/50 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-lg hover:-translate-y-1 transition-all group">
            <div className="h-14 w-14 bg-gradient-to-br from-amber-100 to-orange-100 text-amber-600 rounded-2xl flex items-center justify-center mb-5 text-2xl shadow-inner group-hover:scale-110 transition-transform">🤝</div>
            <h2 className="text-2xl font-bold text-slate-900">Référencer un Club</h2>
            <p className="text-slate-500 mt-2 font-medium">Ajoutez les coordonnées d'un club étranger à la base de données mondiale.</p>
          </Link>

          {profile?.role === 'chef_club' && (
            <Link href="/dashboard/mes-actions" className="block p-8 bg-white/60 backdrop-blur-xl border border-white/50 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-lg hover:-translate-y-1 transition-all group">
              <div className="h-14 w-14 bg-gradient-to-br from-emerald-100 to-teal-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-5 text-2xl shadow-inner group-hover:scale-110 transition-transform">📋</div>
              <h2 className="text-2xl font-bold text-slate-900">Mes Actions Soumises</h2>
              <p className="text-slate-500 mt-2 font-medium">Consultez l'historique de vos actions et lisez les retours.</p>
            </Link>
          )}

          {profile?.role === 'chef_club' && (
            <Link href="/dashboard/ahkili" className="block p-8 bg-white/60 backdrop-blur-xl border border-white/50 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-lg hover:-translate-y-1 transition-all group">
              <div className="h-14 w-14 bg-gradient-to-br from-indigo-100 to-purple-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-5 text-2xl shadow-inner group-hover:scale-110 transition-transform">💬</div>
              <h2 className="text-2xl font-bold text-slate-900 font-arabic">أحكيلي</h2>
              <p className="text-slate-500 mt-2 font-medium">Ouvrez une discussion directe et confidentielle avec la mission.</p>
            </Link>
          )}

          {profile?.role === 'chef_mission_inter' && (
            <Link href="/dashboard/inbox" className="block p-8 bg-white/60 backdrop-blur-xl border border-white/50 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-lg hover:-translate-y-1 transition-all group">
              <div className="h-14 w-14 bg-gradient-to-br from-emerald-100 to-teal-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-5 text-2xl shadow-inner group-hover:scale-110 transition-transform">📥</div>
              <h2 className="text-2xl font-bold text-slate-900">Boîte de Réception</h2>
              <p className="text-slate-500 mt-2 font-medium">Gérez les actions soumises et le chat أحكيلي.</p>
            </Link>
          )}

          {profile?.role === 'comite_national' && (
            <Link href="/dashboard/inbox" className="block p-8 bg-white/60 backdrop-blur-xl border border-white/50 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-lg hover:-translate-y-1 transition-all group">
              <div className="h-14 w-14 bg-gradient-to-br from-teal-100 to-emerald-100 text-teal-600 rounded-2xl flex items-center justify-center mb-5 text-2xl shadow-inner group-hover:scale-110 transition-transform">📊</div>
              <h2 className="text-2xl font-bold text-slate-900">Travaux des Clubs</h2>
              <p className="text-slate-500 mt-2 font-medium">Consultez le registre des actions soumises par les clubs.</p>
            </Link>
          )}

          {(profile?.role === 'chef_mission_inter' || profile?.role === 'comite_national') && (
            <Link href="/dashboard/users" className="block p-8 bg-white/60 backdrop-blur-xl border border-white/50 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-lg hover:-translate-y-1 transition-all group">
              <div className="h-14 w-14 bg-gradient-to-br from-purple-100 to-pink-100 text-purple-600 rounded-2xl flex items-center justify-center mb-5 text-2xl shadow-inner group-hover:scale-110 transition-transform">👥</div>
              <h2 className="text-2xl font-bold text-slate-900">Gestion Utilisateurs</h2>
              <p className="text-slate-500 mt-2 font-medium">Ajouter, modifier ou supprimer des membres du portail.</p>
            </Link>
          )}

          <Link href="/dashboard/settings" className="block p-8 bg-white/60 backdrop-blur-xl border border-white/50 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-lg hover:-translate-y-1 transition-all group">
            <div className="h-14 w-14 bg-gradient-to-br from-slate-200 to-gray-300 text-slate-700 rounded-2xl flex items-center justify-center mb-5 text-2xl shadow-inner group-hover:scale-110 transition-transform">⚙️</div>
            <h2 className="text-2xl font-bold text-slate-900">Paramètres</h2>
            <p className="text-slate-500 mt-2 font-medium">Modifiez votre mot de passe et gérez la sécurité.</p>
          </Link>
        </div>

        {/* FOOTER */}
        <div className="mt-auto text-center pb-2">
          <p className="text-sm font-medium text-slate-500">
            Made with ❤️ by{' '}
            <a 
              href="https://instagram.com/_yessine_ben_fraj_" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="font-extrabold text-indigo-600 hover:text-indigo-800 hover:underline transition-colors"
            >
              Yessine
            </a>
          </p>
        </div>

      </div>
    </div>
  );
}
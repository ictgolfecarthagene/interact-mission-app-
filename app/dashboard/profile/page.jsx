'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push('/');
      const { data: userProfile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setProfile(userProfile);
    }
    loadData();
  }, [router]);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) return setStatusMsg('Le mot de passe doit faire au moins 6 caractères.');
    
    setIsSubmitting(true);
    setStatusMsg('');

    // This is Supabase's secure, built-in way for a user to change their own password
    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      setStatusMsg(`Erreur: ${error.message}`);
    } else {
      setStatusMsg('Mot de passe mis à jour avec succès !');
      setNewPassword('');
    }
    setIsSubmitting(false);
  };

  if (!profile) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><div className="animate-pulse font-bold text-xl text-indigo-400">Chargement...</div></div>;

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8 relative font-sans overflow-hidden">
      <div className="fixed top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob z-0"></div>
      <div className="max-w-3xl mx-auto space-y-8 relative z-10">
        
        <div className="bg-white/70 backdrop-blur-2xl p-6 rounded-3xl shadow-sm border border-white/50">
          <Link href="/dashboard" className="text-sm font-bold text-indigo-600 hover:text-indigo-800 transition mb-4 inline-block">← Retour au hub</Link>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-6">Mon Profil</h1>
          
          <div className="grid grid-cols-2 gap-4 bg-slate-50/50 p-6 rounded-2xl border border-slate-100 mb-8">
             <div><p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Nom</p><p className="font-bold text-slate-900">{profile.full_name}</p></div>
             <div><p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Email</p><p className="font-bold text-slate-900">{profile.email}</p></div>
             <div><p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Rôle</p><p className="font-bold text-slate-900">{profile.poste}</p></div>
             {profile.club && <div><p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Club</p><p className="font-bold text-indigo-600">{profile.club}</p></div>}
          </div>

          <h2 className="text-xl font-extrabold text-slate-900 border-t border-slate-200 pt-6 mb-4">Changer mon mot de passe</h2>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-2">Nouveau Mot de passe</label>
              <input type="password" required minLength="6" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full p-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold tracking-widest shadow-sm" placeholder="••••••••" />
            </div>
            <button type="submit" disabled={isSubmitting} className="px-8 py-4 bg-slate-900 text-white font-extrabold rounded-2xl hover:bg-slate-800 transition-all shadow-md disabled:opacity-50">
              {isSubmitting ? 'Mise à jour...' : 'Sauvegarder le mot de passe'}
            </button>
          </form>

          {statusMsg && (
            <div className={`mt-4 p-4 rounded-xl font-bold text-sm shadow-sm border ${statusMsg.includes('succès') ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
              {statusMsg}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
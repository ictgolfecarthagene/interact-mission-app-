'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function MesActionsPage() {
  const [profile, setProfile] = useState(null);
  const [myActions, setMyActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push('/');

      const { data: userProfile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      
      // Only allow club chefs to see this page
      if (userProfile?.role !== 'chef_club') return router.push('/dashboard');
      setProfile(userProfile);

      // Fetch only actions submitted by this specific club
      const { data: actionsData } = await supabase
        .from('submitted_actions')
        .select('*')
        .eq('club', userProfile.club)
        .order('created_at', { ascending: false });
        
      setMyActions(actionsData || []);
      setLoading(false);
    }
    loadData();
  }, [router]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="animate-pulse text-xl font-bold text-indigo-400">Chargement...</div></div>;

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8 relative font-sans overflow-hidden">
      <div className="fixed top-[-10%] left-[-10%] w-[500px] h-[500px] bg-emerald-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob z-0 pointer-events-none"></div>
      <div className="fixed top-[-10%] right-[-10%] w-[500px] h-[500px] bg-teal-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000 z-0 pointer-events-none"></div>
      
      <div className="max-w-4xl mx-auto space-y-8 relative z-10">
        <div className="bg-white/70 backdrop-blur-2xl p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50 flex justify-between items-center">
          <div>
            <Link href="/dashboard" className="text-sm font-bold text-emerald-600 hover:text-emerald-800 transition mb-1 inline-block">← Retour au hub</Link>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Historique de mes Actions</h1>
            <p className="text-sm text-slate-500 font-medium mt-1">Gérez vos soumissions et consultez les retours de la mission pour le {profile?.club}.</p>
          </div>
        </div>

        <div className="space-y-6">
          {myActions.length === 0 ? (
            <div className="bg-white/60 backdrop-blur-xl p-12 rounded-3xl text-center border border-white/50 shadow-sm">
              <p className="text-slate-500 font-medium italic">Vous n'avez pas encore soumis d'actions.</p>
            </div>
          ) : (
            myActions.map((action) => (
              <div key={action.id} className="bg-white/80 backdrop-blur-xl p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50 transition-all hover:shadow-md">
                <div className="flex justify-between items-start mb-4">
                  <span className="text-[10px] font-extrabold px-3 py-1.5 rounded-lg uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-100 shadow-sm">
                    {action.journee_name}
                  </span>
                  <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1.5 rounded-lg">
                    {new Date(action.created_at).toLocaleDateString('fr-FR')}
                  </span>
                </div>
                
                <h3 className="text-xl font-extrabold text-slate-900 mb-3">{action.nom_action}</h3>
                <p className="text-sm text-slate-600 mb-4 bg-slate-50 p-4 rounded-xl border border-slate-100 leading-relaxed">{action.description}</p>
                
                <div className="flex gap-3 mb-4">
                  <a href={action.social_link} target="_blank" rel="noreferrer" className="text-xs bg-slate-900 text-white px-4 py-2 rounded-xl font-bold hover:bg-slate-800 shadow-sm transition-colors">Voir la publication ↗</a>
                </div>

                {/* THE HIGHLIGHTED FEEDBACK SECTION */}
                {action.remarque && (
                  <div className="mt-4 bg-gradient-to-r from-emerald-50 to-teal-50 border-l-4 border-emerald-500 p-4 rounded-r-xl shadow-sm">
                    <p className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-widest mb-1">Mot de la Coordination</p>
                    <p className="text-sm font-bold text-emerald-900">{action.remarque}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
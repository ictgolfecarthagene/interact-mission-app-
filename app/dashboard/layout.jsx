'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function DashboardLayout({ children }) {
  const [isVerified, setIsVerified] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function checkVerification() {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_verified')
        .eq('id', user.id)
        .single();
      
      if (profile) {
        setIsVerified(profile.is_verified);
      }
      setLoading(false);
    }
    
    checkVerification();
  }, [router]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="animate-pulse text-xl font-bold text-indigo-400">Vérification de sécurité...</div></div>;

  // THE SHIELD: If they are not verified, show this screen and block the children pages.
  if (isVerified === false) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
        <div className="fixed top-[-10%] left-[-10%] w-[500px] h-[500px] bg-amber-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob z-0"></div>
        <div className="fixed top-[-10%] right-[-10%] w-[500px] h-[500px] bg-orange-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob animation-delay-2000 z-0"></div>
        
        <div className="bg-white/80 backdrop-blur-2xl p-10 rounded-[2.5rem] shadow-[0_20px_60px_rgb(0,0,0,0.05)] border border-white/60 max-w-md w-full text-center relative z-10">
          <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl shadow-inner border border-amber-100">
            ⏳
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 mb-4 tracking-tight">Compte en attente</h1>
          <p className="text-slate-500 font-medium leading-relaxed mb-8">
            Votre compte a été créé avec succès. Cependant, pour des raisons de sécurité, il doit d'abord être vérifié et approuvé par la Coordination Nationale avant de pouvoir accéder au portail.
          </p>
          <button onClick={async () => { await supabase.auth.signOut(); router.push('/'); }} className="w-full py-4 bg-slate-900 text-white font-extrabold rounded-2xl hover:bg-slate-800 transition-all shadow-md hover:-translate-y-0.5">
            Se déconnecter
          </button>
        </div>
      </div>
    );
  }

  // If they are verified, let them into the dashboard!
  return <>{children}</>;
}
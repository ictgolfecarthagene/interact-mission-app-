'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SettingsPage() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setStatusMsg('');

    if (newPassword !== confirmPassword) {
      return setStatusMsg("Les mots de passe ne correspondent pas.");
    }
    if (newPassword.length < 6) {
      return setStatusMsg("Le mot de passe doit contenir au moins 6 caractères.");
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      setStatusMsg("✓ Mot de passe mis à jour avec succès !");
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setStatusMsg(`Erreur: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8 relative font-sans overflow-hidden flex flex-col items-center justify-center">
      <div className="fixed top-[-10%] left-[-10%] w-[500px] h-[500px] bg-slate-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob z-0 pointer-events-none"></div>
      <div className="fixed top-[-10%] right-[-10%] w-[500px] h-[500px] bg-slate-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000 z-0 pointer-events-none"></div>

      <div className="w-full max-w-lg bg-white/70 backdrop-blur-2xl p-8 sm:p-10 rounded-[2rem] shadow-[0_20px_60px_rgb(0,0,0,0.05)] border border-white/60 relative z-10">
        <Link href="/dashboard" className="text-sm font-bold text-slate-500 hover:text-slate-800 transition mb-6 inline-block">← Retour au hub</Link>
        
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Paramètres du Compte</h1>
        <p className="text-sm font-medium text-slate-500 mb-8">Mettez à jour vos informations de sécurité.</p>

        <form onSubmit={handleUpdatePassword} className="space-y-5">
          <div>
            <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-2">Nouveau mot de passe</label>
            <input 
              type="password" 
              required 
              value={newPassword} 
              onChange={e => setNewPassword(e.target.value)} 
              className="w-full p-4 bg-white/50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-slate-500 font-bold tracking-widest shadow-sm transition-all" 
              placeholder="••••••••" 
            />
          </div>
          <div>
            <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-2">Confirmer le mot de passe</label>
            <input 
              type="password" 
              required 
              value={confirmPassword} 
              onChange={e => setConfirmPassword(e.target.value)} 
              className="w-full p-4 bg-white/50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-slate-500 font-bold tracking-widest shadow-sm transition-all" 
              placeholder="••••••••" 
            />
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting} 
            className="w-full py-4 mt-2 bg-slate-900 text-white font-extrabold rounded-2xl hover:shadow-lg hover:-translate-y-0.5 transition-all shadow-md disabled:opacity-50"
          >
            {isSubmitting ? 'Mise à jour...' : 'Sauvegarder le mot de passe'}
          </button>
        </form>

        {statusMsg && (
          <div className={`mt-6 p-4 rounded-xl font-bold text-center text-sm shadow-sm ${statusMsg.includes('succès') ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
            {statusMsg}
          </div>
        )}
      </div>
    </div>
  );
}
'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export default function AhkiliPage() {
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('');
  const [profile, setProfile] = useState(null);
  const router = useRouter();

  // Load the current user profile on page load
  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push('/');

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      setProfile(data);
    }
    loadProfile();
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('Envoi en cours...');

    const { error } = await supabase.from('ahkili_messages').insert([{
      user_id: profile.id,
      club: profile.club,
      message: message
    }]);

    if (error) {
      setStatus('Erreur lors de l\'envoi.');
      console.error(error);
    } else {
      setStatus('Message envoyé avec succès à la mission !');
      setMessage('');
      setTimeout(() => setStatus(''), 5000); // Clear success message after 5s
    }
  };

  if (!profile) return <div className="min-h-screen flex items-center justify-center"><div className="animate-pulse text-xl font-bold">Chargement...</div></div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto space-y-8">
        
        <Link href="/dashboard" className="inline-block px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm font-bold hover:bg-gray-50 transition">
          ← Retour au tableau de bord
        </Link>

        {/* Logo Placement */}
        <div className="flex justify-center mb-8">
          <Image 
            src="/logo.png" 
            alt="Logo" 
            width={200} 
            height={80} 
            className="object-contain"
          />
        </div>

        <h1 className="text-7xl font-bold text-center mb-12 text-indigo-600 font-arabic tracking-tight">
          أحكيلي
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Votre Nom</label>
              <input type="text" value={profile.full_name} disabled className="w-full p-3 bg-gray-100 text-gray-700 font-medium rounded-lg border-0" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Votre Club</label>
              <input type="text" value={profile.club} disabled className="w-full p-3 bg-gray-100 text-gray-700 font-medium rounded-lg border-0" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">Réclamations, demandes, questions...</label>
            <textarea 
              rows="6"
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition resize-none"
              placeholder="Écrivez votre message à la mission ici en toute confidentialité..."
            />
          </div>

          <button type="submit" className="w-full bg-indigo-600 text-white p-4 rounded-xl font-bold text-lg hover:bg-indigo-700 transition shadow-md">
            Envoyer à la mission
          </button>
          
          {status && (
            <div className={`p-4 rounded-lg font-bold text-center ${status.includes('succès') ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'}`}>
              {status}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push('/');

      const { data: userProfile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      
      // Kick out unauthorized roles
      if (userProfile?.role !== 'comite_national' && userProfile?.role !== 'chef_mission_inter') {
        return router.push('/dashboard');
      }
      setProfile(userProfile);

      // Load all users
      const { data: allUsers } = await supabase.from('profiles').select('*').order('role', { ascending: true });
      setUsers(allUsers || []);
      setLoading(false);
    }
    loadData();
  }, [router]);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer le profil de ${name} ?`)) return;
    
    // Deletes the public profile entry so they lose dashboard access
    const { error } = await supabase.from('profiles').delete().eq('id', id);
    if (!error) {
      setUsers(users.filter(u => u.id !== id));
      alert('Utilisateur supprimé avec succès.');
    } else {
      alert('Erreur de suppression: ' + error.message);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-pulse font-bold text-xl">Chargement de la base de données...</div></div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <Link href="/dashboard" className="text-sm font-bold text-indigo-600 hover:underline mb-1 inline-block">← Retour au tableau de bord</Link>
            <h1 className="text-3xl font-extrabold text-gray-900">Gestion des Utilisateurs</h1>
            <p className="text-gray-500 font-medium">Ajouter, modifier ou supprimer des membres du portail.</p>
          </div>
          
          <button onClick={() => alert('Connectez cette UI à votre API /api/admin/create-user')} className="px-6 py-3 bg-gray-900 text-white font-bold rounded-xl shadow-md hover:bg-gray-800 transition">
            + Ajouter un membre
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100 text-gray-600 text-sm uppercase tracking-wider border-b border-gray-200">
                <th className="p-4 font-bold">Nom complet</th>
                <th className="p-4 font-bold">Email</th>
                <th className="p-4 font-bold">Rôle & Poste</th>
                <th className="p-4 font-bold">Club</th>
                <th className="p-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50 transition">
                  <td className="p-4 font-bold text-gray-900">{u.full_name}</td>
                  <td className="p-4 text-gray-600 font-medium">{u.email}</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${u.role === 'chef_club' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                      {u.role}
                    </span>
                    <p className="text-xs text-gray-500 mt-1 font-medium">{u.poste}</p>
                  </td>
                  <td className="p-4 font-bold text-gray-700">{u.club || '—'}</td>
                  <td className="p-4 text-right">
                    <button className="text-blue-600 font-bold hover:underline mr-4 text-sm">Modifier</button>
                    <button 
                      onClick={() => handleDelete(u.id, u.full_name)} 
                      className="text-red-600 font-bold hover:underline text-sm"
                      disabled={u.id === profile.id} // Prevents admin from deleting themselves
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
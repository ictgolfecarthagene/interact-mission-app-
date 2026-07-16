'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Pre-defined lists to prevent typos
const CLUBS = [
  "IC Tunis Medina", "IC Mirabel Tunis", "IC North Africa", "IC Pilote Ariana", "IC Bloom City", "IC Big South Tunis", "IC Tunis Cosmopolitan", "IC Tunis Doyen", "IC Tunis Inner City", "IC Tunis El Bey", "IC Anastasia", "IC Ennaser", "IC Tunis Golden Eagles", "IC Rey De Carthago", "IC Tinast Glory", "IC Didon Amilcar", "IC Tunis Golfe", "IC Opportunity", "IC Aquatic North", "IC Tunis Moon City", "IC Tunis Les Berges Du Lac", "IC Tunis Hannibal", "IC Amilcar Sidibousaid", "IC Sidibousaid", "IC Tunis César", "IC Carthage La Renaissance", "IC Tunis Belvédère", "IC Ariana Tines", "IC Ariana La Rose", "IC Saint Germain", "IC Maxula Prates", "IC Tunis Golfe Carthagène", "IC Megrine", "IC Tunis Amilcar", "IC Hammam Lif", "IC Boumhel El Bassatine", "IC Hammamet", "IC Nabeul Neapolis", "IC Graces El Mourouj", "IC Pragma Sousse", "IC Sousse", "IC Kairouan", "IC Ruspina Monastir", "IC Monastir Zone Sud", "IC Sfax Doyen", "IC Sfax Métropole", "IC Sfax Flambeau", "IC Sfax Sindbad", "IC Sfax Tamaris", "IC Gabes Oasis", "IC Djerba Flamingo"
];

const POSTS_NATIONAUX = [
  "Coordinateur", "Vice coordinateur", "Secretaire nationale", "Secretaire adj", "Chef du protocole nationale", "Chef du protocole adj", "Tresorier nationale", "Tresorier adj", "Chef mission des actions internationales"
];

export default function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [formData, setFormData] = useState({
    email: '', password: '', fullName: '', role: 'chef_club', poste: 'Chef des actions internationales', club: CLUBS[0]
  });

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push('/');

      const { data: userProfile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      
      if (userProfile?.role !== 'comite_national' && userProfile?.role !== 'chef_mission_inter') {
        return router.push('/dashboard');
      }
      setProfile(userProfile);

      const { data: allUsers } = await supabase.from('profiles').select('*').order('role', { ascending: true });
      setUsers(allUsers || []);
      setLoading(false);
    }
    loadData();
  }, [router]);

  // Submit the form to the API route
  const handleAddUser = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatusMsg('');

    try {
      const response = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (!response.ok) throw new Error(result.error);

      setStatusMsg('Utilisateur créé avec succès !');
      
      // Refresh the table silently
      const { data: allUsers } = await supabase.from('profiles').select('*').order('role', { ascending: true });
      setUsers(allUsers || []);

      // Close modal and reset form after 2 seconds
      setTimeout(() => {
        setIsModalOpen(false);
        setStatusMsg('');
        setFormData({ email: '', password: '', fullName: '', role: 'chef_club', poste: 'Chef des actions internationales', club: CLUBS[0] });
      }, 2000);

    } catch (err) {
      setStatusMsg(`Erreur: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer le profil de ${name} ?`)) return;
    const { error } = await supabase.from('profiles').delete().eq('id', id);
    if (!error) {
      setUsers(users.filter(u => u.id !== id));
    } else {
      alert('Erreur de suppression: ' + error.message);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-pulse font-bold text-xl">Chargement...</div></div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8 relative">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <Link href="/dashboard" className="text-sm font-bold text-indigo-600 hover:underline mb-1 inline-block">← Retour au tableau de bord</Link>
            <h1 className="text-3xl font-extrabold text-gray-900">Gestion des Utilisateurs</h1>
            <p className="text-gray-500 font-medium">Ajouter, modifier ou supprimer des membres du portail.</p>
          </div>
          
          <button 
            onClick={() => setIsModalOpen(true)} 
            className="px-6 py-3 bg-gray-900 text-white font-bold rounded-xl shadow-md hover:bg-gray-800 transition"
          >
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
                    <button 
                      onClick={() => handleDelete(u.id, u.full_name)} 
                      className="text-red-600 font-bold hover:underline text-sm"
                      disabled={u.id === profile.id}
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

      {/* MODAL AJOUTER UN MEMBRE */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 rounded-2xl max-w-lg w-full shadow-2xl relative">
             <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 font-bold text-xl">✕</button>
             
             <h2 className="text-2xl font-bold mb-6 text-gray-900">Créer un profil</h2>
             
             <form onSubmit={handleAddUser} className="space-y-4">
               
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-sm font-bold text-gray-700 mb-1">Nom complet</label>
                   <input type="text" required value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 outline-none" placeholder="Ex: Foulen Ben Foulen" />
                 </div>
                 <div>
                   <label className="block text-sm font-bold text-gray-700 mb-1">Type d'accès</label>
                   <select 
                     value={formData.role} 
                     onChange={(e) => {
                       const role = e.target.value;
                       setFormData({
                         ...formData, 
                         role, 
                         poste: role === 'chef_club' ? 'Chef des actions internationales' : POSTS_NATIONAUX[0]
                       });
                     }}
                     className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 outline-none font-bold"
                   >
                     <option value="chef_club">Club Local</option>
                     <option value="comite_national">Comité National</option>
                     <option value="chef_mission_inter">Mission Inter</option>
                   </select>
                 </div>
               </div>

               {formData.role === 'chef_club' ? (
                 <div>
                   <label className="block text-sm font-bold text-gray-700 mb-1">Assigner un Club</label>
                   <select value={formData.club} onChange={(e) => setFormData({...formData, club: e.target.value})} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 outline-none">
                     {CLUBS.map(club => <option key={club} value={club}>{club}</option>)}
                   </select>
                 </div>
               ) : (
                 <div>
                   <label className="block text-sm font-bold text-gray-700 mb-1">Poste National</label>
                   <select value={formData.poste} onChange={(e) => setFormData({...formData, poste: e.target.value})} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 outline-none">
                     {POSTS_NATIONAUX.map(poste => <option key={poste} value={poste}>{poste}</option>)}
                   </select>
                 </div>
               )}

               <div>
                 <label className="block text-sm font-bold text-gray-700 mb-1">Adresse Email</label>
                 <input type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 outline-none" placeholder="contact@club.com" />
               </div>

               <div>
                 <label className="block text-sm font-bold text-gray-700 mb-1">Mot de passe provisoire</label>
                 <input type="password" required value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 outline-none" placeholder="••••••••" minLength="6" />
               </div>

               <button type="submit" disabled={isSubmitting} className="w-full py-4 mt-2 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition disabled:opacity-50">
                 {isSubmitting ? 'Création en cours...' : 'Créer l\'utilisateur'}
               </button>

               {statusMsg && (
                 <div className={`p-3 rounded-lg font-bold text-center text-sm ${statusMsg.includes('succès') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                   {statusMsg}
                 </div>
               )}
             </form>
          </div>
        </div>
      )}
    </div>
  );
}
'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Pre-defined lists
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
  
  // Smart Search State
  const [clubSearch, setClubSearch] = useState('');
  const [showClubDropdown, setShowClubDropdown] = useState(false);

  const [formData, setFormData] = useState({
    email: '', password: '', fullName: '', role: 'chef_club', poste: 'Chef des actions internationales', club: ''
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

  // Submit the form
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
      
      // OPTIMISTIC UI UPDATE: Force the new user into the table instantly
      const instantNewUser = {
        id: Math.random().toString(), // Temp ID until full reload
        full_name: formData.fullName,
        email: formData.email,
        role: formData.role,
        poste: formData.poste,
        club: formData.role === 'chef_club' ? formData.club : null
      };
      setUsers(prev => [instantNewUser, ...prev]);

      // Close modal and reset form gracefully
      setTimeout(() => {
        setIsModalOpen(false);
        setStatusMsg('');
        setFormData({ email: '', password: '', fullName: '', role: 'chef_club', poste: 'Chef des actions internationales', club: '' });
        setClubSearch('');
      }, 1500);

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

  const filteredClubs = CLUBS.filter(c => c.toLowerCase().includes(clubSearch.toLowerCase()));

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="animate-pulse font-bold text-xl text-indigo-400">Chargement de la matrice...</div></div>;

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8 relative font-sans">
      
      {/* Decorative Background Elements for Glass Effect */}
      <div className="fixed top-[-10%] left-[-10%] w-96 h-96 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob z-0"></div>
      <div className="fixed top-[-10%] right-[-10%] w-96 h-96 bg-teal-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000 z-0"></div>

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        
        {/* Modern Glass Header */}
        <div className="bg-white/70 backdrop-blur-2xl p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <Link href="/dashboard" className="text-sm font-bold text-indigo-600 hover:text-indigo-800 transition mb-1 inline-block">← Retour au hub</Link>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Gestion des Utilisateurs</h1>
            <p className="text-slate-500 font-medium text-sm mt-1">Supervisez et créez les accès au portail Interact.</p>
          </div>
          
          <button 
            onClick={() => setIsModalOpen(true)} 
            className="px-6 py-3.5 bg-slate-900 text-white font-bold rounded-2xl shadow-lg shadow-slate-900/20 hover:bg-slate-800 hover:shadow-slate-900/30 transition-all transform hover:-translate-y-0.5"
          >
            + Ajouter un membre
          </button>
        </div>

        {/* Responsive Glass Table */}
        <div className="bg-white/60 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-slate-900/5 text-slate-600 text-xs uppercase tracking-widest border-b border-slate-200/50">
                  <th className="p-5 font-extrabold">Nom complet</th>
                  <th className="p-5 font-extrabold">Email</th>
                  <th className="p-5 font-extrabold">Rôle & Poste</th>
                  <th className="p-5 font-extrabold">Club Assigné</th>
                  <th className="p-5 font-extrabold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/50">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-white/50 transition-colors">
                    <td className="p-5 font-bold text-slate-900">{u.full_name}</td>
                    <td className="p-5 text-slate-500 font-medium">{u.email}</td>
                    <td className="p-5">
                      <span className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider shadow-sm border ${u.role === 'chef_club' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'bg-teal-50 text-teal-700 border-teal-100'}`}>
                        {u.role.replace(/_/g, ' ')}
                      </span>
                      <p className="text-xs text-slate-500 mt-2 font-semibold">{u.poste}</p>
                    </td>
                    <td className="p-5 font-bold text-slate-700">{u.club || '—'}</td>
                    <td className="p-5 text-right">
                      <button 
                        onClick={() => handleDelete(u.id, u.full_name)} 
                        className="text-red-500 font-bold hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors text-sm disabled:opacity-30 disabled:hover:bg-transparent"
                        disabled={u.id === profile.id}
                      >
                        Retirer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* LIQUID GLASS MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center z-50 p-4 transition-all">
          <div className="bg-white/80 backdrop-blur-2xl p-8 rounded-[2rem] max-w-xl w-full shadow-[0_20px_60px_rgb(0,0,0,0.1)] border border-white/60 relative max-h-[95vh] overflow-y-auto">
             <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 h-10 w-10 bg-slate-100/50 text-slate-500 hover:bg-slate-200 hover:text-slate-900 rounded-full flex items-center justify-center font-bold transition-colors">✕</button>
             
             <h2 className="text-2xl font-extrabold mb-8 text-slate-900 tracking-tight">Créer un accès portail</h2>
             
             <form onSubmit={handleAddUser} className="space-y-5">
               
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                 <div>
                   <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">Nom complet</label>
                   <input type="text" required value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} className="w-full p-4 bg-white/50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all font-semibold text-slate-800 shadow-sm" placeholder="Ex: Foulen Ben Foulen" />
                 </div>
                 <div>
                   <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">Type d'accès</label>
                   <select 
                     value={formData.role} 
                     onChange={(e) => {
                       const role = e.target.value;
                       setFormData({...formData, role, poste: role === 'chef_club' ? 'Chef des actions internationales' : POSTS_NATIONAUX[0], club: ''});
                       setClubSearch('');
                     }}
                     className="w-full p-4 bg-white/50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all font-bold text-slate-800 shadow-sm cursor-pointer"
                   >
                     <option value="chef_club">Club Local</option>
                     <option value="comite_national">Comité National</option>
                     <option value="chef_mission_inter">Mission Inter</option>
                   </select>
                 </div>
               </div>

               {formData.role === 'chef_club' ? (
                 <div className="relative">
                   <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">Rechercher et Assigner un Club</label>
                   <input 
                     type="text" 
                     required
                     value={clubSearch}
                     onChange={(e) => { setClubSearch(e.target.value); setFormData({...formData, club: e.target.value}); setShowClubDropdown(true); }}
                     onFocus={() => setShowClubDropdown(true)}
                     onBlur={() => setTimeout(() => setShowClubDropdown(false), 200)} // Delay hides dropdown so clicks register
                     placeholder="Tapez pour filtrer les clubs..."
                     className="w-full p-4 bg-white/50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all font-semibold text-slate-800 shadow-sm"
                   />
                   {showClubDropdown && filteredClubs.length > 0 && (
                     <div className="absolute z-50 w-full mt-2 bg-white/90 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-xl max-h-48 overflow-y-auto overflow-hidden">
                       {filteredClubs.map(c => (
                         <div 
                           key={c} 
                           onClick={() => { setClubSearch(c); setFormData({...formData, club: c}); setShowClubDropdown(false); }} 
                           className="p-4 hover:bg-indigo-50 cursor-pointer text-sm font-bold text-slate-700 transition-colors border-b border-slate-50 last:border-0"
                         >
                           {c}
                         </div>
                       ))}
                     </div>
                   )}
                 </div>
               ) : (
                 <div>
                   <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">Poste National</label>
                   <select value={formData.poste} onChange={(e) => setFormData({...formData, poste: e.target.value})} className="w-full p-4 bg-white/50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all font-bold text-slate-800 shadow-sm cursor-pointer">
                     {POSTS_NATIONAUX.map(poste => <option key={poste} value={poste}>{poste}</option>)}
                   </select>
                 </div>
               )}

               <div>
                 <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">Adresse Email</label>
                 <input type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full p-4 bg-white/50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all font-semibold text-slate-800 shadow-sm" placeholder="contact@interact.com" />
               </div>

               <div>
                 <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">Mot de passe provisoire</label>
                 <input type="password" required value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="w-full p-4 bg-white/50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all font-bold text-slate-800 shadow-sm tracking-widest" placeholder="••••••••" minLength="6" />
               </div>

               <button type="submit" disabled={isSubmitting} className="w-full py-4 mt-4 bg-slate-900 text-white font-extrabold rounded-2xl hover:bg-slate-800 hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:transform-none shadow-sm">
                 {isSubmitting ? 'Création de la session...' : 'Générer l\'utilisateur'}
               </button>

               {statusMsg && (
                 <div className={`p-4 rounded-xl font-bold text-center text-sm shadow-sm border ${statusMsg.includes('succès') ? 'bg-emerald-50/80 text-emerald-700 border-emerald-200' : 'bg-red-50/80 text-red-700 border-red-200'}`}>
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
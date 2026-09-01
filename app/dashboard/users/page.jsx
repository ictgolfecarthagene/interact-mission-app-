'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ApproveButton from '@/components/ApproveButton';
import { bulkApproveMembers } from '@/app/actions/admin';

const CLUBS = ["IC Tunis Medina", "IC Mirabel Tunis", "IC North Africa", "IC Pilote Ariana", "IC Bloom City", "IC Big South Tunis", "IC Tunis Cosmopolitan", "IC Tunis Doyen", "IC Tunis Inner City", "IC Tunis El Bey", "IC Anastasia", "IC Ennaser", "IC Tunis Golden Eagles", "IC Rey De Carthago", "IC Tinast Glory", "IC Didon Amilcar", "IC Tunis Golfe", "IC Opportunity", "IC Aquatic North", "IC Tunis Moon City", "IC Tunis Les Berges Du Lac", "IC Tunis Hannibal", "IC Amilcar Sidibousaid", "IC Sidibousaid", "IC Tunis César", "IC Carthage La Renaissance", "IC Tunis Belvédère", "IC Ariana Tines", "IC Ariana La Rose", "IC Saint Germain", "IC Maxula Prates", "IC Tunis Golfe Carthagène", "IC Megrine", "IC Tunis Amilcar", "IC Hammam Lif", "IC Hammamet", "IC Nabeul Neapolis", "IC Graces El Mourouj", "IC Pragma Sousse", "IC Sousse", "IC Kairouan", "IC Ruspina Monastir", "IC Monastir Zone Sud", "IC Sfax Doyen", "IC Sfax Métropole", "IC Sfax Flambeau", "IC Sfax Sindbad", "IC Sfax Tamaris"];
const POSTS_NATIONAUX = ["Coordinatrice Nationale", "Vice Coordinatrice", "Protocole Nationale", "Protocole Nationale Adjointe", "Secrétaire Nationale", "Secrétaire Nationale Adjointe", "Trésorière Nationale"];

export default function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [clubSearch, setClubSearch] = useState('');
  const [showClubDropdown, setShowClubDropdown] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '', fullName: '', role: 'chef_club', poste: 'Chef des actions internationales', club: '' });

  const [selectedUsers, setSelectedUsers] = useState([]);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  const [dialog, setDialog] = useState({ isOpen: false, isConfirm: false, title: '', message: '', type: 'danger', confirmText: '', onConfirm: null });

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push('/');
      const { data: userProfile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      
      if (user.email !== 'yessinebenfraj106@gmail.com' && userProfile?.role !== 'comite_national' && userProfile?.role !== 'chef_mission_inter') {
        return router.push('/dashboard');
      }
      
      setProfile(userProfile);
      const { data: allUsers } = await supabase.from('profiles').select('*').order('role', { ascending: true });
      setUsers(allUsers || []);
      setLoading(false);
    }
    loadData();
  }, [router]);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedUsers(users.map(u => u.id));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleSelectUser = (id) => {
    if (selectedUsers.includes(id)) {
      setSelectedUsers(selectedUsers.filter(userId => userId !== id));
    } else {
      setSelectedUsers([...selectedUsers, id]);
    }
  };

  const promptBulkApprove = () => {
    setDialog({
      isOpen: true, isConfirm: true, title: 'Approbation Multiple', message: `Voulez-vous approuver l'accès de ${selectedUsers.length} utilisateur(s) ?`, type: 'success', confirmText: 'Approuver',
      onConfirm: async () => {
        setIsBulkProcessing(true);
        const result = await bulkApproveMembers(selectedUsers);
        if (result.success) {
          setUsers(users.map(u => selectedUsers.includes(u.id) ? { ...u, is_verified: true } : u));
          setSelectedUsers([]);
          setDialog({ isOpen: true, isConfirm: false, title: 'Succès', message: 'Utilisateurs approuvés.', type: 'success' });
        } else {
          setDialog({ isOpen: true, isConfirm: false, title: 'Erreur', message: "Erreur lors de l'approbation multiple.", type: 'danger' });
        }
        setIsBulkProcessing(false);
      }
    });
  };

  const promptBulkDelete = () => {
    setDialog({
      isOpen: true, isConfirm: true, title: 'Suppression Multiple', message: `Attention ! Voulez-vous supprimer définitivement ${selectedUsers.length} utilisateur(s) ? Cette action est irréversible.`, type: 'danger', confirmText: 'Supprimer',
      onConfirm: async () => {
        setIsBulkProcessing(true);
        const deletePromises = selectedUsers.map(async (id) => {
          const response = await fetch('/api/admin/delete-user', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
          const result = await response.json();
          if (!response.ok) throw new Error(result.error || "Delete failed");
          return id;
        });
        
        try {
          await Promise.all(deletePromises);
          setUsers(users.filter(u => !selectedUsers.includes(u.id)));
          setSelectedUsers([]);
          setDialog({ isOpen: true, isConfirm: false, title: 'Succès', message: 'Utilisateurs supprimés.', type: 'success' });
        } catch (err) {
          setDialog({ isOpen: true, isConfirm: false, title: 'Erreur', message: `Erreur lors de la suppression groupée: ${err.message}`, type: 'danger' });
        }
        setIsBulkProcessing(false);
      }
    });
  };

  const openCreateModal = () => {
    setEditMode(false);
    setEditingUserId(null);
    setFormData({ email: '', password: '', fullName: '', role: 'chef_club', poste: 'Chef des actions internationales', club: '' });
    setClubSearch('');
    setStatusMsg('');
    setIsModalOpen(true);
  };

  const openEditModal = (user) => {
    setEditMode(true);
    setEditingUserId(user.id);
    setFormData({ email: user.email, password: '', fullName: user.full_name, role: user.role, poste: user.poste, club: user.club || '' });
    setClubSearch(user.club || '');
    setStatusMsg('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatusMsg('');
    try {
      const endpoint = editMode ? '/api/admin/update-user' : '/api/admin/create-user';
      const payload = editMode ? { id: editingUserId, ...formData } : formData;
      const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      setStatusMsg(editMode ? 'Mise à jour réussie !' : 'Utilisateur créé avec succès !');
      
      if (!editMode) {
        const instantNewUser = { id: Math.random().toString(), full_name: formData.fullName, email: formData.email, role: formData.role, poste: formData.poste, club: formData.role === 'chef_club' ? formData.club : null, is_verified: true };
        setUsers(prev => [instantNewUser, ...prev]);
      } else {
        const { data: updatedUsers } = await supabase.from('profiles').select('*').order('role', { ascending: true });
        setUsers(updatedUsers || []);
      }
      setTimeout(() => setIsModalOpen(false), 1500);
    } catch (err) {
      setStatusMsg(`Erreur: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const promptDelete = (id, name) => {
    setDialog({
      isOpen: true, isConfirm: true, title: 'Confirmer la suppression', message: `Êtes-vous sûr de vouloir supprimer définitivement le profil de ${name} ?`, type: 'danger', confirmText: 'Supprimer',
      onConfirm: async () => {
        try {
          const response = await fetch('/api/admin/delete-user', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
          const result = await response.json(); 
          if (!response.ok) throw new Error(result.error || "Delete failed");
          setUsers(users.filter(u => u.id !== id));
          setDialog({ isOpen: true, isConfirm: false, title: 'Succès', message: 'Utilisateur supprimé.', type: 'success' });
        } catch (err) {
          setDialog({ isOpen: true, isConfirm: false, title: 'Erreur', message: `Détail : ${err.message}`, type: 'danger' });
        }
      }
    });
  };

  const filteredClubs = CLUBS.filter(c => c.toLowerCase().includes(clubSearch.toLowerCase()));

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="animate-pulse font-bold text-xl text-indigo-400">Chargement...</div></div>;

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8 relative font-sans overflow-hidden">
      <div className="fixed top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob z-0 pointer-events-none"></div>
      <div className="fixed top-[-10%] right-[-10%] w-[500px] h-[500px] bg-teal-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000 z-0 pointer-events-none"></div>

      <div className="max-w-7xl mx-auto space-y-6 relative z-10">
        <div className="bg-white/70 backdrop-blur-2xl p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <Link href="/dashboard" className="text-sm font-bold text-indigo-600 hover:text-indigo-800 transition mb-1 inline-block">← Retour au hub</Link>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Gestion des Utilisateurs</h1>
          </div>
          <button onClick={openCreateModal} className="px-6 py-3.5 bg-slate-900 text-white font-bold rounded-2xl shadow-lg hover:-translate-y-0.5 transition-all">
            + Ajouter un membre
          </button>
        </div>

        {selectedUsers.length > 0 && (
          <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl flex justify-between items-center shadow-sm">
            <span className="text-indigo-800 font-extrabold text-sm">{selectedUsers.length} utilisateur(s) sélectionné(s)</span>
            <div className="flex gap-3">
              <button onClick={promptBulkApprove} disabled={isBulkProcessing} className="px-5 py-2 bg-emerald-500 text-white font-bold rounded-xl text-sm shadow-sm hover:bg-emerald-600 transition-colors disabled:opacity-50">Approuver</button>
              <button onClick={promptBulkDelete} disabled={isBulkProcessing} className="px-5 py-2 bg-red-50 text-red-600 border border-red-200 font-bold rounded-xl text-sm shadow-sm hover:bg-red-100 transition-colors disabled:opacity-50">Retirer</button>
            </div>
          </div>
        )}

        <div className="bg-white/60 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50 overflow-hidden">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-slate-900/5 text-slate-600 text-xs uppercase tracking-widest border-b border-slate-200/50">
                <th className="p-5 w-10"><input type="checkbox" checked={selectedUsers.length === users.length && users.length > 0} onChange={handleSelectAll} className="w-4 h-4 rounded text-indigo-600 cursor-pointer" /></th>
                <th className="p-5 font-extrabold">Nom & Email</th>
                <th className="p-5 font-extrabold">Rôle & Poste</th>
                <th className="p-5 font-extrabold">Club Assigné</th>
                <th className="p-5 font-extrabold">Statut</th>
                <th className="p-5 font-extrabold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/50">
              {users.map((u) => (
                <tr key={u.id} className={`hover:bg-white/50 transition-colors ${selectedUsers.includes(u.id) ? 'bg-indigo-50/30' : ''}`}>
                  <td className="p-5"><input type="checkbox" checked={selectedUsers.includes(u.id)} onChange={() => handleSelectUser(u.id)} className="w-4 h-4 rounded text-indigo-600 cursor-pointer" /></td>
                  <td className="p-5">
                    <p className="font-bold text-slate-900">{u.full_name}</p>
                    <p className="text-xs font-medium text-slate-500">{u.email}</p>
                  </td>
                  
                  <td className="p-5">
                    {u.email === 'yessinebenfraj106@gmail.com' ? (
                      // EXCLUSIF TOP ADMIN : Badge noir et pas de texte en dessous
                      <span className="px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase border bg-slate-900 text-white border-slate-900 shadow-sm">
                        TOP ADMIN
                      </span>
                    ) : (
                      // AFFICHAGE NORMAL POUR TOUS LES AUTRES
                      <>
                        <span className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase border ${u.role === 'chef_club' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'bg-teal-50 text-teal-700 border-teal-100'}`}>
                          {u.role === 'chef_mission_inter' ? 'Mission Inter' : u.role.replace(/_/g, ' ')}
                        </span>
                        <p className="text-xs text-slate-500 mt-2 font-semibold">{u.poste}</p>
                      </>
                    )}
                  </td>
                  
                  <td className="p-5 font-bold text-slate-700">{u.club || '—'}</td>
                  <td className="p-5">{u.is_verified ? <span className="px-3 py-1 bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold">Validé</span> : <span className="px-3 py-1 bg-amber-100 text-amber-700 border border-amber-200 rounded-full text-xs font-bold">En attente</span>}</td>
                  <td className="p-5 text-right space-x-2">
                    {!u.is_verified && <ApproveButton userId={u.id} isVerified={u.is_verified} />}
                    <button onClick={() => openEditModal(u)} className="text-blue-600 font-bold text-sm">Modifier</button>
                    <button onClick={() => promptDelete(u.id, u.full_name)} disabled={u.id === profile.id} className="text-red-500 font-bold text-sm disabled:opacity-30">Retirer</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE / EDIT USER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center z-40 p-4">
          <div className="bg-white/80 backdrop-blur-2xl p-8 rounded-[2rem] max-w-xl w-full">
             <h2 className="text-2xl font-extrabold mb-8 text-slate-900">{editMode ? 'Modifier' : 'Créer un accès'}</h2>
             <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 h-10 w-10 bg-slate-100/50 text-slate-500 hover:bg-slate-200 rounded-full font-bold flex items-center justify-center transition-colors">✕</button>
             <form onSubmit={handleSubmit} className="space-y-5">
               <div className="grid grid-cols-2 gap-5">
                 <input type="text" required value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} placeholder="Nom complet" className="w-full p-4 bg-white/50 border border-slate-200 rounded-2xl font-semibold" />
                 <select value={formData.role} onChange={(e) => { 
                    const role = e.target.value;
                    let poste = role === 'chef_club' ? 'Chef des actions internationales' : POSTS_NATIONAUX[0];
                    if (role === 'chef_mission_inter') poste = 'Chef mission des actions internationales';
                    setFormData({...formData, role, poste});
                 }} className="w-full p-4 bg-white/50 border border-slate-200 rounded-2xl font-bold">
                   <option value="chef_club">Club Local</option>
                   <option value="comite_national">Comité National</option>
                   <option value="chef_mission_inter">Mission des actions internationales</option>
                 </select>
               </div>
               {formData.role === 'comite_national' && (
                 <select value={formData.poste} onChange={(e) => setFormData({...formData, poste: e.target.value})} className="w-full p-4 bg-white/50 border border-slate-200 rounded-2xl font-bold">
                   {POSTS_NATIONAUX.map(p => <option key={p} value={p}>{p}</option>)}
                 </select>
               )}
               {formData.role === 'chef_club' && (
                  <div className="relative">
                    <input type="text" required value={clubSearch} onChange={(e) => { setClubSearch(e.target.value); setFormData({...formData, club: e.target.value}); setShowClubDropdown(true); }} onFocus={() => setShowClubDropdown(true)} onBlur={() => setTimeout(() => setShowClubDropdown(false), 200)} className="w-full p-4 bg-white/50 border border-slate-200 rounded-2xl outline-none font-semibold" placeholder="Assigner un club..." />
                    {showClubDropdown && filteredClubs.length > 0 && <div className="absolute z-50 w-full mt-2 bg-white/90 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-xl max-h-48 overflow-y-auto"><div className="p-2">{filteredClubs.map(c => <div key={c} onMouseDown={() => { setClubSearch(c); setFormData({...formData, club: c}); setShowClubDropdown(false); }} className="p-3 hover:bg-indigo-50 cursor-pointer text-sm font-bold rounded-lg text-slate-700">{c}</div>)}</div></div>}
                  </div>
               )}
               <input type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="Email" className="w-full p-4 bg-white/50 border border-slate-200 rounded-2xl font-semibold" />
               <input type="password" required={!editMode} value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} placeholder={editMode ? "Nouveau mot de passe (optionnel)" : "Mot de passe"} className="w-full p-4 bg-white/50 border border-slate-200 rounded-2xl tracking-widest font-bold" minLength="6" />
               <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-slate-900 text-white font-extrabold rounded-2xl">{isSubmitting ? 'Traitement...' : 'Sauvegarder'}</button>
               {statusMsg && <div className="p-4 rounded-xl font-bold text-center text-sm bg-indigo-50 text-indigo-700">{statusMsg}</div>}
             </form>
          </div>
        </div>
      )}

      {/* CUSTOM UI POPUP MODAL (CONFIRMATIONS) */}
      {dialog.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl border border-white/50 text-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 ${dialog.type === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
              {dialog.type === 'success' ? '✓' : '!'}
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 mb-2">{dialog.title}</h3>
            <p className="text-slate-500 font-medium mb-8 leading-relaxed">{dialog.message}</p>
            
            <div className="flex gap-3">
              {dialog.isConfirm && (
                <button onClick={() => setDialog({ isOpen: false })} className="flex-1 py-3.5 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all">Annuler</button>
              )}
              <button 
                onClick={() => { if (dialog.onConfirm) dialog.onConfirm(); else setDialog({ isOpen: false }); }} 
                className={`flex-1 py-3.5 text-white font-extrabold rounded-xl transition-all shadow-md ${dialog.type === 'success' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-600 hover:bg-red-700'}`}
              >
                {dialog.confirmText || 'OK'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
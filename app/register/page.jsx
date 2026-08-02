'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const CLUBS = ["IC Tunis Medina", "IC Mirabel Tunis", "IC North Africa", "IC Pilote Ariana", "IC Bloom City", "IC Big South Tunis", "IC Tunis Cosmopolitan", "IC Tunis Doyen", "IC Tunis Inner City", "IC Tunis El Bey", "IC Anastasia", "IC Ennaser", "IC Tunis Golden Eagles", "IC Rey De Carthago", "IC Tinast Glory", "IC Didon Amilcar", "IC Tunis Golfe", "IC Opportunity", "IC Aquatic North", "IC Tunis Moon City", "IC Tunis Les Berges Du Lac", "IC Tunis Hannibal", "IC Amilcar Sidibousaid", "IC Sidibousaid", "IC Tunis César", "IC Carthage La Renaissance", "IC Tunis Belvédère", "IC Ariana Tines", "IC Ariana La Rose", "IC Saint Germain", "IC Maxula Prates", "IC Tunis Golfe Carthagène", "IC Megrine", "IC Tunis Amilcar", "IC Hammam Lif", "IC Boumhel El Bassatine", "IC Hammamet", "IC Nabeul Neapolis", "IC Graces El Mourouj", "IC Pragma Sousse", "IC Sousse", "IC Kairouan", "IC Ruspina Monastir", "IC Monastir Zone Sud", "IC Sfax Doyen", "IC Sfax Métropole", "IC Sfax Flambeau", "IC Sfax Sindbad", "IC Sfax Tamaris", "IC Gabes Oasis", "IC Djerba Flamingo"];

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ fullName: '', email: '', password: '', club: '' });
  const [accountType, setAccountType] = useState('club'); // 'club' or 'national'
  const [clubSearch, setClubSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  const filteredClubs = CLUBS.filter(c => c.toLowerCase().includes(clubSearch.toLowerCase()));

  const handleRegister = async (e) => {
    e.preventDefault();
    
    // Assign "Comité National" as the club if that type is selected
    const finalClub = accountType === 'national' ? 'Comité National' : formData.club;
    
    if (!finalClub) return setStatusMsg('Veuillez sélectionner un club.');
    
    setIsSubmitting(true);
    setStatusMsg('');

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, club: finalClub, type: accountType })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Updated success message for Admin Verification
      setStatusMsg('Compte créé avec succès ! En attente de validation par un administrateur.');
      setTimeout(() => router.push('/'), 4000); 
    } catch (err) {
      setStatusMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="fixed top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob z-0"></div>
      <div className="fixed top-[-10%] right-[-10%] w-[500px] h-[500px] bg-teal-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000 z-0"></div>

      <div className="bg-white/80 backdrop-blur-2xl p-8 sm:p-10 rounded-[2.5rem] w-full max-w-md shadow-[0_20px_60px_rgb(0,0,0,0.05)] border border-white/60 relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Inscription</h1>
          <p className="text-sm font-medium text-slate-500 mt-2">Créez votre accès au portail Interact.</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-5">
          {/* Account Type Selector */}
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button type="button" onClick={() => setAccountType('club')} className={`flex-1 text-xs font-bold py-2 rounded-lg transition-all ${accountType === 'club' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}>Club Interact</button>
            <button type="button" onClick={() => setAccountType('national')} className={`flex-1 text-xs font-bold py-2 rounded-lg transition-all ${accountType === 'national' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}>Comité National</button>
          </div>

          <div>
            <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-2">Nom Complet</label>
            <input type="text" required autoComplete="name" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className="w-full p-4 bg-white/50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-semibold shadow-sm transition-all" />
          </div>

          {/* Only show Club search if "Club Interact" is selected */}
          {accountType === 'club' && (
            <div className="relative">
              <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-2">Club Interact</label>
              <input type="text" required={accountType === 'club'} autoComplete="organization" value={clubSearch} onChange={e => { setClubSearch(e.target.value); setShowDropdown(true); }} onFocus={() => setShowDropdown(true)} onBlur={() => setTimeout(() => setShowDropdown(false), 200)} className="w-full p-4 bg-white/50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-semibold shadow-sm transition-all" placeholder="Rechercher votre club..." />
              {showDropdown && filteredClubs.length > 0 && (
                <div className="absolute z-50 w-full mt-2 bg-white/95 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-xl max-h-48 overflow-y-auto">
                  <div className="p-2">
                    {filteredClubs.map(c => (
                      <div key={c} onMouseDown={() => { setClubSearch(c); setFormData({...formData, club: c}); setShowDropdown(false); }} className="p-3 hover:bg-indigo-50 cursor-pointer text-sm font-bold rounded-lg text-slate-700">{c}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-2">Email Officiel</label>
            <input type="email" required autoComplete="username" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full p-4 bg-white/50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-semibold shadow-sm transition-all" />
          </div>

          <div className="relative">
            <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-2">Mot de Passe</label>
            <div className="relative flex items-center">
              <input type={showPassword ? "text" : "password"} required minLength="6" autoComplete="new-password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full p-4 bg-white/50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold tracking-widest shadow-sm transition-all pr-12" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 text-slate-400 hover:text-indigo-600 focus:outline-none">
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                )}
              </button>
            </div>
          </div>

          <button type="submit" disabled={isSubmitting} className="w-full py-4 mt-2 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-extrabold rounded-2xl hover:shadow-lg hover:-translate-y-0.5 transition-all shadow-md disabled:opacity-50">
            {isSubmitting ? 'Création...' : 'S\'inscrire'}
          </button>
        </form>

        {statusMsg && (
          <div className={`mt-4 p-4 rounded-xl font-bold text-center text-sm shadow-sm ${statusMsg.includes('succès') ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
            {statusMsg}
          </div>
        )}

        <div className="mt-6 text-center">
          <Link href="/" className="text-sm font-bold text-indigo-600 hover:text-indigo-800">Déjà un compte ? Connectez-vous.</Link>
        </div>
      </div>
    </div>
  );
}
'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const WORLD_DATA = [
  { continent: '🌍 Afrique', countries: [ { name: 'Tunisie', code: 'tn' }, { name: 'Algérie', code: 'dz' }, { name: 'Maroc', code: 'ma' }, { name: 'Sénégal', code: 'sn' }, { name: 'Côte d\'Ivoire', code: 'ci' }, { name: 'Égypte', code: 'eg' }, { name: 'Afrique du Sud', code: 'za' }, { name: 'Cameroun', code: 'cm' }, { name: 'Mali', code: 'ml' }, { name: 'Burkina Faso', code: 'bf' }, { name: 'Congo', code: 'cg' }, { name: 'Gabon', code: 'ga' }, { name: 'Ghana', code: 'gh' }, { name: 'Kenya', code: 'ke' }, { name: 'Libye', code: 'ly' }, { name: 'Madagascar', code: 'mg' }, { name: 'Mauritanie', code: 'mr' }, { name: 'Niger', code: 'ne' }, { name: 'Nigéria', code: 'ng' }, { name: 'Ouganda', code: 'ug' }, { name: 'Rwanda', code: 'rw' }, { name: 'Tchad', code: 'td' }, { name: 'Togo', code: 'tg' } ] },
  { continent: '🇪🇺 Europe', countries: [ { name: 'France', code: 'fr' }, { name: 'Italie', code: 'it' }, { name: 'Espagne', code: 'es' }, { name: 'Allemagne', code: 'de' }, { name: 'Belgique', code: 'be' }, { name: 'Suisse', code: 'ch' }, { name: 'Royaume-Uni', code: 'gb' }, { name: 'Portugal', code: 'pt' }, { name: 'Autriche', code: 'at' }, { name: 'Bulgarie', code: 'bg' }, { name: 'Croatie', code: 'hr' }, { name: 'Danemark', code: 'dk' }, { name: 'Finlande', code: 'fi' }, { name: 'Grèce', code: 'gr' }, { name: 'Hongrie', code: 'hu' }, { name: 'Irlande', code: 'ie' }, { name: 'Norvège', code: 'no' }, { name: 'Pays-Bas', code: 'nl' }, { name: 'Pologne', code: 'pl' }, { name: 'République Tchèque', code: 'cz' }, { name: 'Roumanie', code: 'ro' }, { name: 'Serbie', code: 'rs' }, { name: 'Suède', code: 'se' }, { name: 'Turquie', code: 'tr' }, { name: 'Ukraine', code: 'ua' } ] },
  { continent: '🌏 Asie', countries: [ { name: 'Palestine', code: 'ps' }, { name: 'Liban', code: 'lb' }, { name: 'Arabie Saoudite', code: 'sa' }, { name: 'Émirats Arabes Unis', code: 'ae' }, { name: 'Jordanie', code: 'jo' }, { name: 'Qatar', code: 'qa' }, { name: 'Japon', code: 'jp' }, { name: 'Chine', code: 'cn' }, { name: 'Corée du Sud', code: 'kr' }, { name: 'Inde', code: 'in' }, { name: 'Indonésie', code: 'id' }, { name: 'Iran', code: 'ir' }, { name: 'Irak', code: 'iq' }, { name: 'Koweït', code: 'kw' }, { name: 'Malaisie', code: 'my' }, { name: 'Oman', code: 'om' }, { name: 'Pakistan', code: 'pk' }, { name: 'Philippines', code: 'ph' }, { name: 'Singapour', code: 'sg' }, { name: 'Syrie', code: 'sy' }, { name: 'Thaïlande', code: 'th' }, { name: 'Vietnam', code: 'vn' }, { name: 'Yémen', code: 'ye' } ] },
  { continent: '🌎 Amériques', countries: [ { name: 'États-Unis', code: 'us' }, { name: 'Canada', code: 'ca' }, { name: 'Brésil', code: 'br' }, { name: 'Argentine', code: 'ar' }, { name: 'Mexique', code: 'mx' }, { name: 'Chili', code: 'cl' }, { name: 'Colombie', code: 'co' }, { name: 'Pérou', code: 'pe' }, { name: 'Venezuela', code: 've' }, { name: 'Cuba', code: 'cu' }, { name: 'Uruguay', code: 'uy' }, { name: 'Bolivie', code: 'bo' }, { name: 'Paraguay', code: 'py' }, { name: 'Équateur', code: 'ec' }, { name: 'Costa Rica', code: 'cr' }, { name: 'Panama', code: 'pa' }, { name: 'Jamaïque', code: 'jm' }, { name: 'Haïti', code: 'ht' } ] }
];

export default function SubmitForeignClub() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  
  const [formData, setFormData] = useState({
    club_name: '', continent: WORLD_DATA[0].continent, country: '', club_ig: '',
    chef_name: '', chef_ig: '', chef_whatsapp: '', chef_email: '',
    president_name: '', president_ig: '', president_whatsapp: '', president_email: ''
  });
  
  const [includeChef, setIncludeChef] = useState(true);
  const [includePresident, setIncludePresident] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [selectedFlagCode, setSelectedFlagCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // NEW: CUSTOM POPUP STATE
  const [dialog, setDialog] = useState({ isOpen: false, message: '', type: 'error' });

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push('/');
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setProfile(data);
    }
    loadUser();
  }, [router]);

  const activeCountries = WORLD_DATA.find(c => c.continent === formData.continent)?.countries || [];
  const filteredCountries = activeCountries.filter(c => c.name.toLowerCase().includes(countrySearch.toLowerCase()));

  const handleCountrySelect = (countryName, countryCode) => {
    setCountrySearch(countryName); 
    setSelectedFlagCode(countryCode);
    setFormData({...formData, country: countryName}); 
    setShowCountryDropdown(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.country) return setDialog({ isOpen: true, message: "Veuillez sélectionner un pays dans la liste.", type: 'error' });
    if (!includeChef && !includePresident) return setDialog({ isOpen: true, message: "Veuillez remplir les informations pour au moins un Chef des actions ou un Président.", type: 'error' });

    setIsSubmitting(true);
    
    const payload = {
      ...formData,
      submitter_id: profile.id,
      chef_name: includeChef ? formData.chef_name : null,
      chef_ig: includeChef ? formData.chef_ig : null,
      chef_whatsapp: includeChef ? formData.chef_whatsapp : null,
      chef_email: includeChef ? formData.chef_email : null,
      president_name: includePresident ? formData.president_name : null,
      president_ig: includePresident ? formData.president_ig : null,
      president_whatsapp: includePresident ? formData.president_whatsapp : null,
      president_email: includePresident ? formData.president_email : null,
    };

    const { error } = await supabase.from('foreign_clubs').insert([payload]);

    if (error) {
      setDialog({ isOpen: true, message: `Erreur: ${error.message}`, type: 'error' });
      setIsSubmitting(false);
    } else {
      setDialog({ isOpen: true, message: "Club enregistré avec succès dans la base mondiale !", type: 'success' });
      setTimeout(() => router.push('/dashboard/foreign-clubs/map'), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8 relative font-sans overflow-hidden">
      <div className="max-w-4xl mx-auto relative z-10 space-y-6">
        
        <div className="bg-white/70 backdrop-blur-2xl p-6 rounded-3xl shadow-sm border border-white/50">
          <Link href="/dashboard" className="text-sm font-bold text-amber-600 hover:text-amber-800 transition mb-2 inline-block">← Retour</Link>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Référencer un Club Étranger</h1>
          <p className="text-slate-500 font-medium mt-1">Les soumissions sont anonymes (seule la Coordination Nationale voit l'auteur).</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* SECTION 1: CLUB */}
          <div className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-sm border border-white/50">
            <h2 className="text-xl font-extrabold text-slate-900 mb-6 flex items-center gap-2"><span>🏢</span> Informations du Club</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">Nom du club étranger</label>
                <input type="text" required value={formData.club_name} onChange={e => setFormData({...formData, club_name: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-amber-500 outline-none font-bold" />
              </div>
              <div>
                <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">Lien Instagram du club</label>
                <input type="url" value={formData.club_ig} onChange={e => setFormData({...formData, club_ig: e.target.value})} placeholder="https://instagram.com/..." className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-amber-500 outline-none font-medium" />
              </div>
              
              <div>
                <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">Continent</label>
                <select value={formData.continent} onChange={e => { setFormData({...formData, continent: e.target.value, country: ''}); setCountrySearch(''); setSelectedFlagCode(''); }} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-amber-500 outline-none font-bold">
                  {WORLD_DATA.map(d => <option key={d.continent} value={d.continent}>{d.continent}</option>)}
                </select>
              </div>

              <div className="relative">
                <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">Pays</label>
                <div className="relative flex items-center">
                  {selectedFlagCode && (
                    <img src={`https://flagcdn.com/24x18/${selectedFlagCode}.png`} width="24" height="18" alt="flag" className="absolute left-4 rounded-sm shadow-sm" />
                  )}
                  <input type="text" required value={countrySearch} onChange={e => { setCountrySearch(e.target.value); setShowCountryDropdown(true); setSelectedFlagCode(''); }} onFocus={() => setShowCountryDropdown(true)} onBlur={() => setTimeout(() => setShowCountryDropdown(false), 200)} placeholder="Rechercher un pays..." className={`w-full p-4 ${selectedFlagCode ? 'pl-12' : 'pl-4'} bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-amber-500 outline-none font-bold transition-all`} />
                </div>
                {showCountryDropdown && filteredCountries.length > 0 && (
                  <div className="absolute z-50 w-full mt-2 bg-white/95 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-xl max-h-48 overflow-y-auto">
                    {filteredCountries.map(c => (
                      <div key={c.name} onMouseDown={() => handleCountrySelect(c.name, c.code)} className="p-3 flex items-center gap-3 hover:bg-amber-50 cursor-pointer text-sm font-bold text-slate-700">
                        <img src={`https://flagcdn.com/24x18/${c.code}.png`} width="24" height="18" alt="flag" className="rounded-sm shadow-sm" />
                        {c.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* TOGGLES */}
          <div className="flex gap-4">
            <label className={`flex-1 p-4 rounded-2xl border-2 cursor-pointer font-bold transition-all ${includeChef ? 'bg-amber-50 border-amber-500 text-amber-800' : 'bg-white border-slate-200 text-slate-500'}`}>
              <input type="checkbox" checked={includeChef} onChange={e => setIncludeChef(e.target.checked)} className="hidden" />
              ✓ Ajouter le Chef des Actions
            </label>
            <label className={`flex-1 p-4 rounded-2xl border-2 cursor-pointer font-bold transition-all ${includePresident ? 'bg-amber-50 border-amber-500 text-amber-800' : 'bg-white border-slate-200 text-slate-500'}`}>
              <input type="checkbox" checked={includePresident} onChange={e => setIncludePresident(e.target.checked)} className="hidden" />
              ✓ Ajouter le Président
            </label>
          </div>

          {/* SECTION 2: CHEF */}
          {includeChef && (
            <div className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-sm border border-amber-200">
              <h2 className="text-xl font-extrabold text-slate-900 mb-6 flex items-center gap-2"><span>✈️</span> Chef des Actions Internationales</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div><label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">Nom Complet</label><input type="text" required value={formData.chef_name} onChange={e => setFormData({...formData, chef_name: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl" /></div>
                <div><label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">Numéro WhatsApp (avec code)</label><input type="tel" required placeholder="+33 6..." value={formData.chef_whatsapp} onChange={e => setFormData({...formData, chef_whatsapp: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl" /></div>
                <div><label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">Lien Instagram</label><input type="url" value={formData.chef_ig} onChange={e => setFormData({...formData, chef_ig: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl" /></div>
                <div><label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">Email</label><input type="email" value={formData.chef_email} onChange={e => setFormData({...formData, chef_email: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl" /></div>
              </div>
            </div>
          )}

          {/* SECTION 3: PRESIDENT */}
          {includePresident && (
            <div className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-sm border border-indigo-200">
              <h2 className="text-xl font-extrabold text-slate-900 mb-6 flex items-center gap-2"><span>👑</span> Président du Club</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div><label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">Nom Complet</label><input type="text" required value={formData.president_name} onChange={e => setFormData({...formData, president_name: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl" /></div>
                <div><label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">Numéro WhatsApp (avec code)</label><input type="tel" required placeholder="+33 6..." value={formData.president_whatsapp} onChange={e => setFormData({...formData, president_whatsapp: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl" /></div>
                <div><label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">Lien Instagram</label><input type="url" value={formData.president_ig} onChange={e => setFormData({...formData, president_ig: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl" /></div>
                <div><label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">Email</label><input type="email" value={formData.president_email} onChange={e => setFormData({...formData, president_email: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl" /></div>
              </div>
            </div>
          )}

          <button type="submit" disabled={isSubmitting} className="w-full py-4 mt-6 bg-slate-900 text-white font-extrabold rounded-2xl hover:bg-slate-800 transition-all shadow-md hover:-translate-y-0.5 disabled:opacity-50">
            {isSubmitting ? 'Enregistrement...' : 'Enregistrer le Club'}
          </button>
        </form>
      </div>

      {/* CUSTOM UI POPUP MODAL */}
      {dialog.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl border border-white/50 text-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 ${dialog.type === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
              {dialog.type === 'success' ? '✓' : '✕'}
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 mb-2">{dialog.type === 'success' ? 'Succès' : 'Attention'}</h3>
            <p className="text-slate-500 font-medium mb-8 leading-relaxed">{dialog.message}</p>
            <button onClick={() => setDialog({ isOpen: false, message: '', type: 'error' })} className="w-full py-3.5 bg-slate-900 text-white font-extrabold rounded-xl hover:bg-slate-800 transition-all">
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
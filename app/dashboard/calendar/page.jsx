'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { JOURNEES_INTERNATIONALES } from '@/lib/constants';

export default function CalendarUI() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [allActions, setAllActions] = useState([]);
  
  const [selectedDateStr, setSelectedDateStr] = useState(null);
  const [journeesOnDate, setJourneesOnDate] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [actionsOnSelectedDate, setActionsOnSelectedDate] = useState([]);
  
  const [selectedJournee, setSelectedJournee] = useState('');
  const [customJournee, setCustomJournee] = useState('');
  const [nomAction, setNomAction] = useState('');
  const [description, setDescription] = useState('');
  const [socialLink, setSocialLink] = useState('');
  const [submitStatus, setSubmitStatus] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push('/');
      const { data: userProfile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setProfile(userProfile);

      let query = supabase.from('submitted_actions').select('*');
      if (userProfile?.role === 'chef_club') query = query.eq('club', userProfile.club);
      
      const { data: actionsData } = await query;
      setAllActions(actionsData || []);
    }
    loadData();
  }, [router]);

  const getInitials = (name) => {
    if (!name) return 'U';
    const splitName = name.trim().split(' ');
    return (splitName.length === 1 ? splitName[0][0] : splitName[0][0] + splitName[splitName.length - 1][0]).toUpperCase();
  };

  const getClubShortName = (name) => {
    if (!name) return "";
    return name.replace(/Interact Club/gi, "IC").replace(/Interact/gi, "IC").trim();
  };

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month) === 0 ? 6 : getFirstDayOfMonth(year, month) - 1; 
  
  const monthNames = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
  const dayNames = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const formatMMDD = (m, d) => `${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

  const getActionsForDate = (dateStr) => {
    return allActions.filter(action => {
      const journeeInfo = JOURNEES_INTERNATIONALES.find(j => j.name === action.journee_name);
      return journeeInfo?.date === dateStr;
    });
  };

  const handleDayClick = (day) => {
    const dateStr = formatMMDD(month, day);
    const matchingJournees = JOURNEES_INTERNATIONALES.filter(j => j.date === dateStr);
    const actionsForThisDay = getActionsForDate(dateStr);
    
    setSelectedDateStr(dateStr);
    setJourneesOnDate(matchingJournees);
    setActionsOnSelectedDate(actionsForThisDay);
    setSelectedJournee(matchingJournees.length > 0 ? matchingJournees[0].name : 'custom');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const finalJourneeName = selectedJournee === 'custom' ? customJournee : selectedJournee;
    
    // Included submitter_name here
    const newAction = { 
      user_id: profile.id, 
      club: profile.club, 
      submitter_name: profile.full_name,
      journee_name: finalJourneeName, 
      nom_action: nomAction, 
      description: description, 
      social_link: socialLink, 
      archived: false 
    };
    
    const { data, error } = await supabase.from('submitted_actions').insert([newAction]).select().single();
    setIsSubmitting(false);

    if (error) {
      setSubmitStatus('Erreur lors de la soumission.');
    } else {
      setSubmitStatus('Action soumise avec succès !');
      setAllActions([...allActions, data]);
      setTimeout(() => { setShowModal(false); setSubmitStatus(''); setNomAction(''); setDescription(''); setSocialLink(''); setCustomJournee(''); }, 2000);
    }
  };

  const searchResults = searchTerm.length > 2 ? JOURNEES_INTERNATIONALES.filter(j => j.name.toLowerCase().includes(searchTerm.toLowerCase())) : [];

  if (!profile) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><div className="animate-pulse font-bold text-xl text-blue-400">Chargement...</div></div>;

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8 relative font-sans overflow-hidden">
      
      <div className="fixed top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob z-0 pointer-events-none"></div>
      <div className="fixed top-[-10%] right-[-10%] w-[500px] h-[500px] bg-teal-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000 z-0 pointer-events-none"></div>

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        
        <div className="bg-white/70 backdrop-blur-2xl p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <Link href="/dashboard" className="text-sm font-bold text-blue-600 hover:text-blue-800 transition mb-1 inline-block">← Retour au hub</Link>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Calendrier des Actions</h1>
          </div>
          <div className="flex items-center gap-6">
            <input type="text" placeholder="Rechercher une journée..." className="px-5 py-2.5 bg-white/60 border border-slate-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none w-64 transition-all" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            <div className="h-10 w-px bg-slate-200 hidden md:block"></div>
            <div className="hidden md:block text-right">
              <p className="font-bold text-slate-900 text-lg">{profile.full_name}</p>
              <p className="text-sm font-medium text-slate-500">{profile.poste} {profile.role === 'chef_club' && <span className="text-blue-600 font-bold"> • {profile.club}</span>}</p>
            </div>
            <div className="h-14 w-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md flex items-center justify-center font-bold text-xl shrink-0 ring-2 ring-blue-100">{getInitials(profile.full_name)}</div>
          </div>
        </div>

        {searchResults.length > 0 && (
          <div className="bg-white/80 backdrop-blur-md p-5 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-blue-100">
            <h3 className="font-bold text-slate-700 mb-3 tracking-wide">Résultats de recherche :</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {searchResults.map((j, idx) => <div key={idx} className="p-3 bg-blue-50/80 text-blue-700 text-sm rounded-xl font-bold border border-blue-100">{j.date} : {j.name}</div>)}
            </div>
          </div>
        )}

        <div className="bg-white/70 backdrop-blur-2xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50 overflow-hidden">
          <div className="flex justify-between items-center bg-slate-900/90 text-white px-8 py-5 backdrop-blur-md">
            <button onClick={prevMonth} className="px-4 py-2 hover:bg-slate-800 rounded-xl font-bold transition-colors">← Précédent</button>
            <h2 className="text-2xl font-extrabold tracking-wide">{monthNames[month]} {year}</h2>
            <button onClick={nextMonth} className="px-4 py-2 hover:bg-slate-800 rounded-xl font-bold transition-colors">Suivant →</button>
          </div>

          <div className="grid grid-cols-7 bg-white/40 border-b border-slate-200/50">
            {dayNames.map((day) => <div key={day} className="py-4 text-center text-xs font-extrabold text-slate-500 uppercase tracking-widest">{day}</div>)}
          </div>

          <div className="grid grid-cols-7 border-l border-slate-200/30">
            {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} className="min-h-[140px] border-r border-b border-slate-200/50 bg-slate-50/30"></div>)}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = formatMMDD(month, day);
              const daysActions = getActionsForDate(dateStr);
              const hasEvents = JOURNEES_INTERNATIONALES.some(j => j.date === dateStr);

              return (
                <div key={day} onClick={() => handleDayClick(day)} className="min-h-[140px] border-r border-b border-slate-200/50 p-3 flex flex-col cursor-pointer hover:bg-white/60 transition-colors group bg-white/20">
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-sm font-extrabold w-8 h-8 flex items-center justify-center rounded-full transition-colors ${hasEvents && daysActions.length === 0 ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 group-hover:text-blue-600'}`}>{day}</span>
                  </div>
                  
                  <div className="flex flex-col gap-1.5 mt-1">
                    {daysActions.map(action => {
                      let tagStyle = 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white border border-blue-400';
                      let icon = '';
                      
                      if (action.archived) {
                        tagStyle = 'bg-slate-100 text-slate-500 border border-slate-200 shadow-none';
                        icon = '📦 ';
                      } else if (action.remarque) {
                        tagStyle = 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white border border-emerald-400';
                      }

                      return (
                        <div key={action.id} className={`text-[10px] rounded-lg px-2 py-1 truncate font-bold shadow-sm transition-all ${tagStyle}`} title={action.nom_action}>
                          {icon}{getClubShortName(action.club)}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center z-50 p-4 transition-all">
          <div className="bg-white/90 backdrop-blur-2xl p-8 rounded-[2rem] max-w-xl w-full shadow-[0_20px_60px_rgb(0,0,0,0.1)] border border-white/60 relative max-h-[90vh] overflow-y-auto">
             <button onClick={() => setShowModal(false)} className="absolute top-5 right-5 h-8 w-8 bg-slate-100/50 text-slate-500 hover:bg-slate-200 hover:text-slate-900 rounded-full flex items-center justify-center font-bold transition-colors">✕</button>
             
             {/* COMITE NATIONAL VIEW */}
             {profile.role === 'comite_national' && (
               <div>
                 <h2 className="text-2xl font-extrabold mb-6 text-teal-800 border-b border-slate-200 pb-3">Actions du {selectedDateStr}</h2>
                 {actionsOnSelectedDate.length === 0 ? <p className="text-slate-400 font-medium italic text-center py-6">Aucune action trouvée.</p> : actionsOnSelectedDate.map(a => (
                   <div key={a.id} className={`p-5 rounded-2xl border mb-4 relative ${a.archived ? 'bg-slate-50/50 border-slate-200 opacity-75' : 'bg-white border-slate-200 shadow-sm'}`}>
                     {a.archived && <span className="absolute top-4 right-4 text-[10px] font-bold bg-slate-200 text-slate-600 px-2 py-1 rounded-lg uppercase tracking-wider">📦 Archivé</span>}
                     <p className="font-bold text-slate-900 text-lg pr-20">{a.nom_action}</p>
                     <p className="text-sm font-bold text-indigo-600 mb-2">{a.club}</p>
                     <p className="text-xs font-bold text-teal-700 bg-teal-50 px-2 py-1 rounded inline-block mb-4 border border-teal-100">{a.journee_name}</p>
                     <div className="block"><a href={a.social_link} target="_blank" rel="noreferrer" className="text-xs bg-slate-100 text-slate-700 px-4 py-2 rounded-xl font-bold hover:bg-slate-200 transition-colors inline-block">Voir la publication ↗</a></div>
                   </div>
                 ))}
               </div>
             )}

             {/* CHEF MISSION VIEW (Sees Submitter Name) */}
             {profile.role === 'chef_mission_inter' && (
               <div>
                 <h2 className="text-2xl font-extrabold mb-6 text-blue-800 border-b border-slate-200 pb-3">Détails ({selectedDateStr})</h2>
                 {actionsOnSelectedDate.length === 0 ? <p className="text-slate-400 font-medium italic text-center py-6">Aucune action trouvée.</p> : actionsOnSelectedDate.map(a => (
                   <div key={a.id} className={`p-5 rounded-2xl border mb-4 relative ${a.archived ? 'bg-slate-50/50 border-slate-200 opacity-75' : 'bg-white border-slate-200 shadow-sm'}`}>
                     {a.archived && <span className="absolute top-4 right-4 text-[10px] font-bold bg-slate-200 text-slate-600 px-2 py-1 rounded-lg uppercase tracking-wider">📦 Archivé</span>}
                     
                     <div className="flex justify-between items-start mb-2">
                       <p className="font-bold text-slate-900 text-lg pr-4">{a.nom_action}</p>
                       {a.submitter_name && <span className="text-[10px] font-extrabold text-slate-600 bg-slate-100 px-2 py-1 rounded-md border border-slate-200">👤 {a.submitter_name}</span>}
                     </div>
                     
                     <p className="text-sm font-bold text-indigo-600 mb-3">{a.club}</p>
                     <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-100 px-2 py-1 rounded-md font-bold uppercase tracking-wider">{a.journee_name}</span>
                     <p className="text-sm text-slate-600 mt-4 bg-slate-50 p-4 rounded-xl leading-relaxed">{a.description}</p>
                     <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-100">
                       <a href={a.social_link} target="_blank" rel="noreferrer" className="text-xs text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 font-bold transition-colors">Lien ↗</a>
                       {a.remarque && <span className="text-xs text-emerald-700 font-bold bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-lg shadow-sm">✓ Feedback envoyé</span>}
                     </div>
                   </div>
                 ))}
               </div>
             )}

             {/* CHEF CLUB VIEW (Form with Pre-filled Name/Club) */}
             {profile.role === 'chef_club' && (
               <>
                 {actionsOnSelectedDate.length > 0 && (
                   <div className="mb-8">
                     <h3 className="font-extrabold text-slate-900 text-lg border-b border-slate-200 pb-3 mb-4">Vos actions soumises :</h3>
                     {actionsOnSelectedDate.map(a => (
                       <div key={a.id} className={`p-4 rounded-2xl border mb-3 relative ${a.archived ? 'bg-slate-50/50 border-slate-200' : a.remarque ? 'bg-emerald-50 border-emerald-200 shadow-sm' : 'bg-white border-slate-200 shadow-sm'}`}>
                         {a.archived && <span className="absolute top-4 right-4 text-[10px] font-bold bg-slate-200 text-slate-600 px-2 py-1 rounded-lg uppercase tracking-wider">📦 Clôturé</span>}
                         <p className="font-bold text-indigo-700 text-base pr-20">{a.nom_action}</p>
                         <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-wider">{a.journee_name}</p>
                         {a.remarque && (
                           <div className="mt-3 bg-white/80 text-emerald-800 p-3 rounded-xl text-xs font-bold border border-emerald-100 shadow-sm">
                             <span className="text-emerald-500 mr-1 text-sm">✓</span> Remarque Mission : {a.remarque}
                           </div>
                         )}
                       </div>
                     ))}
                   </div>
                 )}

                 <h2 className="text-xl font-extrabold mb-5 text-slate-900 border-t border-slate-200 pt-6">Nouvelle déclaration</h2>
                 <form onSubmit={handleSubmit} className="space-y-5">
                   
                   {/* Pre-filled identity block */}
                   <div className="grid grid-cols-2 gap-4 bg-slate-50/50 p-3 rounded-2xl border border-slate-100">
                     <div>
                       <label className="block text-[10px] font-extrabold text-slate-500 mb-1.5 uppercase tracking-wider">Responsable</label>
                       <input type="text" disabled value={profile.full_name} className="w-full p-2.5 bg-slate-100/80 border border-slate-200 rounded-xl text-slate-500 font-semibold cursor-not-allowed text-xs" />
                     </div>
                     <div>
                       <label className="block text-[10px] font-extrabold text-slate-500 mb-1.5 uppercase tracking-wider">Club Assigné</label>
                       <input type="text" disabled value={profile.club} className="w-full p-2.5 bg-slate-100/80 border border-slate-200 rounded-xl text-slate-500 font-semibold cursor-not-allowed text-xs truncate" />
                     </div>
                   </div>

                   <div>
                     <label className="block text-xs font-extrabold text-slate-500 mb-1.5 uppercase tracking-wider">Journée Internationale</label>
                     <select value={selectedJournee} onChange={(e) => setSelectedJournee(e.target.value)} className="w-full p-3.5 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-semibold text-slate-700 transition-all shadow-sm">
                       {journeesOnDate.map((j, idx) => <option key={idx} value={j.name}>{j.name}</option>)}
                       <option value="custom">Autre / Journée personnalisée...</option>
                     </select>
                   </div>
                   {selectedJournee === 'custom' && (
                     <div>
                       <label className="block text-xs font-extrabold text-slate-500 mb-1.5 uppercase tracking-wider">Nom de la journée</label>
                       <input type="text" required value={customJournee} onChange={(e) => setCustomJournee(e.target.value)} className="w-full p-3.5 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm" />
                     </div>
                   )}
                   <div>
                     <label className="block text-xs font-extrabold text-slate-500 mb-1.5 uppercase tracking-wider">Nom de l'action</label>
                     <input type="text" required value={nomAction} onChange={(e) => setNomAction(e.target.value)} className="w-full p-3.5 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm" />
                   </div>
                   <div>
                     <label className="block text-xs font-extrabold text-slate-500 mb-1.5 uppercase tracking-wider">Lien de la publication</label>
                     <input type="url" required value={socialLink} onChange={(e) => setSocialLink(e.target.value)} className="w-full p-3.5 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm" />
                   </div>
                   <div>
                     <label className="block text-xs font-extrabold text-slate-500 mb-1.5 uppercase tracking-wider">Description courte</label>
                     <textarea rows="3" required value={description} onChange={(e) => setDescription(e.target.value)} className="w-full p-3.5 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none transition-all shadow-sm" />
                   </div>
                   <button type="submit" disabled={isSubmitting} className="w-full py-4 mt-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-extrabold rounded-xl hover:shadow-lg hover:-translate-y-0.5 transition-all shadow-md disabled:opacity-50 disabled:transform-none">
                     {isSubmitting ? 'Transmission en cours...' : 'Envoyer à la mission'}
                   </button>
                   {submitStatus && <div className={`p-4 rounded-xl font-bold text-center text-sm shadow-sm ${submitStatus.includes('succès') ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>{submitStatus}</div>}
                 </form>
               </>
             )}
          </div>
        </div>
      )}
    </div>
  );
}
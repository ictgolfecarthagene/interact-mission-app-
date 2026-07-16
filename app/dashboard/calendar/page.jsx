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
  
  // Database Actions
  const [allActions, setAllActions] = useState([]);
  
  // Modal State
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

      // Fetch Actions: Admins fetch all, Clubs fetch only theirs
      let query = supabase.from('submitted_actions').select('*');
      if (userProfile?.role === 'chef_club') {
        query = query.eq('club', userProfile.club);
      }
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

  // Helper to map DB actions to the specific calendar date based on journee_name
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
    
    // If admin clicks, do nothing (they just view the grid). If club clicks, open modal.
    if (profile?.role === 'chef_club') {
      setSelectedDateStr(dateStr);
      setJourneesOnDate(matchingJournees);
      setActionsOnSelectedDate(actionsForThisDay);
      setSelectedJournee(matchingJournees.length > 0 ? matchingJournees[0].name : 'custom');
      setShowModal(true);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const finalJourneeName = selectedJournee === 'custom' ? customJournee : selectedJournee;

    const newAction = {
      user_id: profile.id,
      club: profile.club,
      journee_name: finalJourneeName,
      nom_action: nomAction,
      description: description,
      social_link: socialLink
    };

    const { data, error } = await supabase.from('submitted_actions').insert([newAction]).select().single();

    setIsSubmitting(false);

    if (error) {
      setSubmitStatus('Erreur lors de la soumission.');
    } else {
      setSubmitStatus('Action soumise avec succès !');
      setAllActions([...allActions, data]); // Update local state so it appears immediately
      setTimeout(() => {
        setShowModal(false);
        setSubmitStatus('');
        setNomAction('');
        setDescription('');
        setSocialLink('');
        setCustomJournee('');
      }, 2000);
    }
  };

  const searchResults = searchTerm.length > 2 
    ? JOURNEES_INTERNATIONALES.filter(j => j.name.toLowerCase().includes(searchTerm.toLowerCase()))
    : [];

  if (!profile) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="animate-pulse font-bold">Chargement...</div></div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8 relative">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <Link href="/dashboard" className="text-sm font-bold text-blue-600 hover:underline mb-1 inline-block">← Retour au tableau de bord</Link>
            <h1 className="text-2xl font-extrabold text-gray-900">Calendrier des Actions</h1>
          </div>
          
          <div className="flex items-center gap-6">
            <input type="text" placeholder="Rechercher une journée..." className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 outline-none w-64" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            <div className="h-10 w-px bg-gray-200 hidden md:block"></div>
            <div className="hidden md:block text-right">
              <p className="font-bold text-gray-900 text-lg">{profile.full_name}</p>
              <p className="text-sm font-medium text-gray-500">{profile.poste} {profile.role === 'chef_club' && <span className="text-blue-600 font-bold"> • {profile.club}</span>}</p>
            </div>
            <div className="h-14 w-14 rounded-full bg-blue-600 text-white shadow-md flex items-center justify-center font-extrabold text-xl shrink-0">{getInitials(profile.full_name)}</div>
          </div>
        </div>

        {searchTerm.length > 2 && (
          <div className="bg-white p-4 rounded-xl shadow-sm border border-blue-100">
            <h3 className="font-bold text-gray-700 mb-2">Résultats de recherche :</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {searchResults.map((j, idx) => <div key={idx} className="p-2 bg-blue-50 text-blue-700 text-sm rounded-md font-medium">{j.date} : {j.name}</div>)}
              {searchResults.length === 0 && <p className="text-sm text-gray-500">Aucune journée trouvée.</p>}
            </div>
          </div>
        )}

        {/* Calendar Grid */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="flex justify-between items-center bg-gray-900 text-white px-6 py-4">
            <button onClick={prevMonth} className="p-2 hover:bg-gray-700 rounded-lg font-bold">← Précédent</button>
            <h2 className="text-2xl font-bold">{monthNames[month]} {year}</h2>
            <button onClick={nextMonth} className="p-2 hover:bg-gray-700 rounded-lg font-bold">Suivant →</button>
          </div>

          <div className="grid grid-cols-7 bg-gray-100 border-b border-gray-200">
            {dayNames.map((day) => <div key={day} className="py-3 text-center text-sm font-bold text-gray-600 uppercase">{day}</div>)}
          </div>

          <div className="grid grid-cols-7 border-l border-gray-100">
            {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} className="min-h-[120px] border-r border-b border-gray-100 bg-gray-50/50"></div>)}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = formatMMDD(month, day);
              const hasEvents = JOURNEES_INTERNATIONALES.some(j => j.date === dateStr);
              const daysActions = getActionsForDate(dateStr);

              return (
                <div key={day} onClick={() => handleDayClick(day)} className={`min-h-[120px] border-r border-b border-gray-100 p-2 flex flex-col ${profile?.role === 'chef_club' ? 'cursor-pointer hover:bg-blue-50 transition' : ''}`}>
                  <div className="flex justify-between items-start mb-1">
                    <span className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full ${hasEvents ? 'bg-blue-600 text-white' : 'text-gray-700'}`}>{day}</span>
                    {profile?.role === 'chef_club' && daysActions.length > 0 && <span className="w-2 h-2 rounded-full bg-green-500 mt-2 mr-1" title="Action soumise"></span>}
                  </div>
                  
                  {/* ADMIN VIEW: Show "IC Club Name" badges */}
                  {profile?.role !== 'chef_club' && daysActions.map(action => (
                    <div key={action.id} className="text-[10px] bg-indigo-50 border border-indigo-100 text-indigo-700 rounded px-1 py-0.5 truncate mt-1 font-bold" title={action.nom_action}>
                      {action.club}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modal for Club Chefs to view feedback and submit new actions */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 rounded-2xl max-w-lg w-full shadow-2xl relative max-h-[90vh] overflow-y-auto">
             <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 font-bold text-xl">✕</button>
             
             {/* Show Previous Submissions & Feedback */}
             {actionsOnSelectedDate.length > 0 && (
               <div className="mb-6 space-y-3">
                 <h3 className="font-bold text-gray-900 border-b pb-2">Vos actions pour cette date :</h3>
                 {actionsOnSelectedDate.map(a => (
                   <div key={a.id} className="bg-gray-50 p-3 rounded-lg border">
                     <p className="font-bold text-blue-600 text-sm">{a.nom_action}</p>
                     <p className="text-xs text-gray-600 mt-1">{a.journee_name}</p>
                     {a.remarque && (
                       <div className="mt-2 bg-orange-100 text-orange-800 p-2 rounded text-xs font-bold border border-orange-200">
                         💡 Point à améliorer (Mission) : {a.remarque}
                       </div>
                     )}
                   </div>
                 ))}
               </div>
             )}

             <h2 className="text-xl font-bold mb-4 text-gray-900 border-t pt-4">Soumettre une nouvelle action</h2>
             
             <form onSubmit={handleSubmit} className="space-y-4">
               <div>
                 <label className="block text-sm font-bold text-gray-700 mb-1">Journée Internationale</label>
                 <select value={selectedJournee} onChange={(e) => setSelectedJournee(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none font-medium">
                   {journeesOnDate.map((j, idx) => <option key={idx} value={j.name}>{j.name}</option>)}
                   <option value="custom">Autre / Journée personnalisée...</option>
                 </select>
               </div>
               {selectedJournee === 'custom' && (
                 <div>
                   <label className="block text-sm font-bold text-gray-700 mb-1">Nom de la journée</label>
                   <input type="text" required value={customJournee} onChange={(e) => setCustomJournee(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none" />
                 </div>
               )}
               <div>
                 <label className="block text-sm font-bold text-gray-700 mb-1">Nom de l'action</label>
                 <input type="text" required value={nomAction} onChange={(e) => setNomAction(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none" />
               </div>
               <div>
                 <label className="block text-sm font-bold text-gray-700 mb-1">Lien de la publication</label>
                 <input type="url" required value={socialLink} onChange={(e) => setSocialLink(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none" />
               </div>
               <div>
                 <label className="block text-sm font-bold text-gray-700 mb-1">Description courte</label>
                 <textarea rows="3" required value={description} onChange={(e) => setDescription(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none resize-none" />
               </div>
               <button type="submit" disabled={isSubmitting} className="w-full py-4 mt-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition disabled:opacity-50">
                 {isSubmitting ? 'Envoi en cours...' : 'Envoyer à la mission'}
               </button>
               {submitStatus && <div className={`p-3 rounded-lg font-bold text-center text-sm ${submitStatus.includes('succès') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{submitStatus}</div>}
             </form>
          </div>
        </div>
      )}
    </div>
  );
}
'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function InboxPage() {
  const [profile, setProfile] = useState(null);
  const [actions, setActions] = useState([]);
  
  // Chat State (Chef Mission Only)
  const [messages, setMessages] = useState([]);
  const [activeChatClub, setActiveChatClub] = useState(null);
  const [replyText, setReplyText] = useState('');
  
  const router = useRouter();

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push('/');

      const { data: userProfile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setProfile(userProfile);

      if (userProfile?.role === 'comite_national' || userProfile?.role === 'chef_mission_inter') {
        const { data: actionsData } = await supabase.from('submitted_actions').select('*').order('created_at', { ascending: false });
        setActions(actionsData || []);

        if (userProfile?.role === 'chef_mission_inter') {
          const { data: msgs } = await supabase.from('ahkili_messages').select('*').order('created_at', { ascending: true });
          setMessages(msgs || []);
        }
      } else {
        router.push('/dashboard');
      }
    }
    loadData();
  }, [router]);

  const clubsWithMessages = [...new Set(messages.map(m => m.club))];
  const activeChatMessages = messages.filter(m => m.club === activeChatClub);

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !activeChatClub) return;

    const msgData = {
      user_id: profile.id,
      club: activeChatClub,
      message: replyText,
      is_mission_reply: true
    };

    const { error } = await supabase.from('ahkili_messages').insert([msgData]);
    if (!error) {
      setMessages([...messages, { ...msgData, created_at: new Date().toISOString() }]);
      setReplyText('');
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    const splitName = name.trim().split(' ');
    return (splitName.length === 1 ? splitName[0][0] : splitName[0][0] + splitName[splitName.length - 1][0]).toUpperCase();
  };

  if (!profile) return <div className="min-h-screen flex items-center justify-center"><div className="animate-pulse font-bold">Chargement...</div></div>;

  // ==========================================
  // VIEW 1: STRICT COMITÉ NATIONAL VIEW
  // ==========================================
  if (profile.role === 'comite_national') {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          
          <div className="bg-white p-6 rounded-2xl shadow-sm border flex justify-between items-center">
            <div>
              <Link href="/dashboard" className="text-sm font-bold text-teal-600 hover:underline mb-1 inline-block">← Retour au tableau de bord</Link>
              <h1 className="text-2xl font-extrabold text-gray-900">Travaux des Clubs</h1>
            </div>
            <div className="flex items-center gap-4 hidden sm:flex">
              <div className="text-right">
                <p className="font-bold text-gray-900">{profile.full_name}</p>
                <p className="text-sm text-gray-500">{profile.poste}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold">
                {getInitials(profile.full_name)}
              </div>
            </div>
          </div>

          {/* Data Table: Only Name, Date, Club, and Link */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-teal-600 text-white text-sm uppercase tracking-wider">
                  <th className="p-4 font-bold">Nom de l'action</th>
                  <th className="p-4 font-bold">Club</th>
                  <th className="p-4 font-bold">Date & Journée</th>
                  <th className="p-4 font-bold text-right">Lien de la publication</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {actions.length === 0 ? (
                  <tr><td colSpan="4" className="p-6 text-center text-gray-500 italic">Aucune action n'a été soumise.</td></tr>
                ) : actions.map(action => (
                  <tr key={action.id} className="hover:bg-gray-50 transition">
                    <td className="p-4 font-bold text-gray-900">{action.nom_action}</td>
                    <td className="p-4 font-bold text-blue-600">{action.club}</td>
                    <td className="p-4 text-gray-600">
                      <div className="flex flex-col gap-1 items-start">
                        <span className="bg-teal-50 text-teal-700 px-2 py-1 rounded-md text-xs font-bold border border-teal-100">{action.journee_name}</span>
                        <span className="text-xs font-medium">{new Date(action.created_at).toLocaleDateString('fr-FR')}</span>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <a href={action.social_link} target="_blank" rel="noreferrer" className="px-4 py-2 bg-blue-50 text-blue-600 font-bold rounded-lg hover:bg-blue-100 text-sm inline-block">Voir le lien ↗</a>
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

  // ==========================================
  // VIEW 2: CHEF MISSION VIEW (FULL INBOX & CHAT)
  // ==========================================
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border flex justify-between items-center">
          <div>
            <Link href="/dashboard" className="text-sm font-bold text-blue-600 hover:underline mb-1 inline-block">← Retour au tableau de bord</Link>
            <h1 className="text-2xl font-extrabold text-gray-900">Boîte de Réception Centrale</h1>
          </div>
          <div className="flex items-center gap-4 hidden sm:flex">
            <div className="text-right">
              <p className="font-bold text-gray-900">{profile.full_name}</p>
              <p className="text-sm text-gray-500">{profile.poste}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
              {getInitials(profile.full_name)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          <div className="bg-white rounded-2xl shadow-sm border overflow-hidden flex flex-col h-[650px]">
            <div className="bg-green-600 px-6 py-4 shrink-0">
              <h2 className="text-lg font-bold text-white">📥 Actions Soumises</h2>
            </div>
            <div className="p-6 overflow-y-auto flex-1 space-y-4 bg-gray-50/50">
              {actions.length === 0 ? <p className="text-gray-500 italic">Aucune action soumise.</p> : actions.map((action) => (
                <div key={action.id} className="p-4 border rounded-xl bg-white shadow-sm">
                  <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-1 rounded-full">{action.journee_name}</span>
                  <h3 className="text-md font-bold mt-2">{action.nom_action}</h3>
                  <p className="text-sm font-bold text-blue-600 mb-2">{action.club}</p>
                  <p className="text-sm text-gray-600 mb-3">{action.description}</p>
                  <a href={action.social_link} target="_blank" rel="noreferrer" className="text-xs font-bold text-blue-600 hover:underline">Voir le lien ↗</a>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border overflow-hidden flex flex-col h-[650px]">
            {!activeChatClub ? (
              <>
                <div className="bg-indigo-600 px-6 py-4 shrink-0">
                  <h2 className="text-lg font-bold text-white font-arabic">💬 Messages أحكيلي</h2>
                </div>
                <div className="p-6 overflow-y-auto flex-1 bg-gray-50/50">
                  {clubsWithMessages.length === 0 ? (
                    <p className="text-gray-500 italic">Aucun club ne vous a contacté.</p>
                  ) : (
                    <div className="space-y-3">
                      {clubsWithMessages.map((club, idx) => (
                        <button key={idx} onClick={() => setActiveChatClub(club)} className="w-full text-left p-4 bg-white border rounded-xl shadow-sm hover:border-indigo-400 transition flex justify-between items-center group">
                          <span className="font-bold text-gray-800">{club}</span>
                          <span className="text-indigo-600 font-bold group-hover:translate-x-1 transition">Ouvrir →</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="bg-indigo-600 px-4 py-3 shrink-0 flex items-center gap-3">
                  <button onClick={() => setActiveChatClub(null)} className="text-white hover:bg-indigo-500 p-2 rounded-lg font-bold text-sm">← Retour</button>
                  <h2 className="text-md font-bold text-white truncate">Discussion avec {activeChatClub}</h2>
                </div>
                
                <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50/50">
                  {activeChatMessages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.is_mission_reply ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] p-3 rounded-2xl ${msg.is_mission_reply ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white border text-gray-800 rounded-tl-none shadow-sm'}`}>
                        <p className="text-sm">{msg.message}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleReply} className="p-3 bg-white border-t flex gap-2 items-end">
                  <textarea 
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Répondre au club..."
                    className="flex-1 p-2 border rounded-lg resize-none outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    rows="2"
                  />
                  <button type="submit" className="px-4 py-3 bg-indigo-600 text-white font-bold text-sm rounded-lg hover:bg-indigo-700 transition">
                    Envoyer
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function InboxPage() {
  const [profile, setProfile] = useState(null);
  const [actions, setActions] = useState([]);
  const [viewMode, setViewMode] = useState('active'); // State for Active vs Archive tab
  
  // Mission Chat State
  const [threads, setThreads] = useState([]);
  const [activeThread, setActiveThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [replyText, setReplyText] = useState('');
  
  // Feedback State
  const [remarqueInputs, setRemarqueInputs] = useState({});

  const router = useRouter();

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push('/');

      const { data: userProfile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      
      if (userProfile?.role === 'chef_club') return router.push('/dashboard');
      setProfile(userProfile);

      const { data: actionsData } = await supabase.from('submitted_actions').select('*').order('created_at', { ascending: false });
      setActions(actionsData || []);

      if (userProfile?.role === 'chef_mission_inter') {
        const { data: threadData } = await supabase.from('ahkili_threads').select('*').order('created_at', { ascending: false });
        setThreads(threadData || []);
      }
    }
    loadData();
  }, [router]);

  // Archive Logic
  const handleArchive = async (actionId) => {
    const { error } = await supabase.from('submitted_actions').update({ archived: true }).eq('id', actionId);
    if (!error) {
      setActions(actions.map(a => a.id === actionId ? { ...a, archived: true } : a));
    }
  };

  const handleSaveRemarque = async (actionId) => {
    const text = remarqueInputs[actionId];
    if (!text) return;
    
    const { error } = await supabase.from('submitted_actions').update({ remarque: text }).eq('id', actionId);
    if (!error) {
      setActions(actions.map(a => a.id === actionId ? { ...a, remarque: text } : a));
      alert("Point à améliorer envoyé au club !");
    }
  };

  const openThread = async (thread) => {
    setActiveThread(thread);
    const { data: msgs } = await supabase.from('ahkili_messages').select('*').eq('thread_id', thread.id).order('created_at', { ascending: true });
    setMessages(msgs || []);
    await supabase.from('ahkili_messages').update({ status: 'read' }).eq('thread_id', thread.id).eq('is_mission_reply', false).eq('status', 'delivered');
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !activeThread) return;

    const msgData = { thread_id: activeThread.id, sender_id: profile.id, message: replyText, is_mission_reply: true };
    const { error } = await supabase.from('ahkili_messages').insert([msgData]);
    if (!error) {
      setMessages([...messages, { ...msgData, created_at: new Date().toISOString(), status: 'delivered' }]);
      setReplyText('');
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    const splitName = name.trim().split(' ');
    return (splitName.length === 1 ? splitName[0][0] : splitName[0][0] + splitName[splitName.length - 1][0]).toUpperCase();
  };

  if (!profile || profile.role === 'chef_club') return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="animate-pulse font-bold">Chargement...</div></div>;

  // Filter actions based on Active vs Archive
  const filteredActions = actions.filter(a => viewMode === 'active' ? !a.archived : a.archived);

  // COMITE NATIONAL VIEW
  if (profile.role === 'comite_national') {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border flex justify-between items-center">
            <div>
              <Link href="/dashboard" className="text-sm font-bold text-teal-600 hover:underline mb-1 inline-block">← Retour</Link>
              <h1 className="text-2xl font-extrabold text-gray-900">Travaux des Clubs</h1>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
            <div className="bg-teal-600 px-6 py-4 flex justify-between items-center">
              <h2 className="text-lg font-bold text-white">📥 Registre {viewMode === 'active' ? 'Actif' : 'Archivé'}</h2>
              <div className="flex bg-teal-700 rounded-lg p-1">
                <button onClick={() => setViewMode('active')} className={`px-4 py-1 text-xs font-bold rounded ${viewMode === 'active' ? 'bg-white text-teal-700' : 'text-white'}`}>Actives</button>
                <button onClick={() => setViewMode('archive')} className={`px-4 py-1 text-xs font-bold rounded ${viewMode === 'archive' ? 'bg-white text-teal-700' : 'text-white'}`}>Archives</button>
              </div>
            </div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 text-gray-600 text-sm uppercase tracking-wider">
                  <th className="p-4 font-bold">Action & Club</th>
                  <th className="p-4 font-bold">Date & Journée</th>
                  <th className="p-4 font-bold text-right">Lien & Remarque</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredActions.length === 0 ? (
                  <tr><td colSpan="3" className="p-6 text-center text-gray-500 italic">Aucune action dans ce dossier.</td></tr>
                ) : filteredActions.map(action => (
                  <tr key={action.id} className="hover:bg-gray-50">
                    <td className="p-4">
                      <p className="font-bold text-gray-900">{action.nom_action}</p>
                      <p className="font-bold text-blue-600 text-sm">{action.club}</p>
                    </td>
                    <td className="p-4 text-gray-600">
                      <span className="bg-teal-50 text-teal-700 px-2 py-1 rounded-md text-xs font-bold border">{action.journee_name}</span>
                    </td>
                    <td className="p-4 text-right space-y-2">
                      <a href={action.social_link} target="_blank" rel="noreferrer" className="px-4 py-2 bg-blue-50 text-blue-600 font-bold rounded-lg text-xs inline-block">Voir ↗</a>
                      {action.remarque && (
                        <p className="text-xs text-green-700 font-bold bg-green-50 p-2 rounded text-left mt-2 border border-green-200">✓ Validé: {action.remarque}</p>
                      )}
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

  // CHEF MISSION VIEW
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border flex justify-between items-center">
          <div>
            <Link href="/dashboard" className="text-sm font-bold text-blue-600 hover:underline mb-1 inline-block">← Retour</Link>
            <h1 className="text-2xl font-extrabold text-gray-900">Boîte de Réception Centrale</h1>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          <div className="bg-white rounded-2xl shadow-sm border overflow-hidden flex flex-col h-[650px]">
            <div className="bg-green-600 px-6 py-4 shrink-0 flex justify-between items-center">
              <h2 className="text-lg font-bold text-white">📥 Actions {viewMode === 'active' ? 'Soumises' : 'Archivées'}</h2>
              <div className="flex bg-green-700 rounded-lg p-1">
                <button onClick={() => setViewMode('active')} className={`px-3 py-1 text-xs font-bold rounded ${viewMode === 'active' ? 'bg-white text-green-700' : 'text-white'}`}>Actives</button>
                <button onClick={() => setViewMode('archive')} className={`px-3 py-1 text-xs font-bold rounded ${viewMode === 'archive' ? 'bg-white text-green-700' : 'text-white'}`}>Archives</button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto flex-1 space-y-4 bg-gray-50/50">
              {filteredActions.length === 0 ? <p className="text-gray-500 italic text-center mt-10">Aucune action dans ce dossier.</p> : filteredActions.map((action) => (
                <div key={action.id} className="p-4 border rounded-xl bg-white shadow-sm">
                  
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${action.remarque ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                      {action.journee_name}
                    </span>
                    {!action.archived && (
                      <button onClick={() => handleArchive(action.id)} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-1 rounded font-bold hover:bg-gray-200">Archiver</button>
                    )}
                  </div>
                  
                  <div className="flex justify-between items-start mt-2">
                    <h3 className="text-md font-bold">{action.nom_action}</h3>
                    <a href={action.social_link} target="_blank" rel="noreferrer" className="text-xs font-bold text-blue-600 hover:underline">Voir ↗</a>
                  </div>
                  <p className="text-sm font-bold text-blue-600 mb-2">{action.club}</p>
                  <p className="text-sm text-gray-600 mb-4">{action.description}</p>
                  
                  {/* Feedback Section */}
                  {action.remarque ? (
                    <div className="bg-green-50 border border-green-200 p-3 rounded-lg flex justify-between items-center">
                      <div>
                        <p className="text-xs font-bold text-green-800 uppercase mb-1">✓ Remarque envoyée :</p>
                        <p className="text-sm text-green-900">{action.remarque}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="Ajouter une remarque / point à améliorer..." 
                        className="flex-1 p-2 text-sm border rounded-lg outline-none focus:border-green-400"
                        value={remarqueInputs[action.id] || ''}
                        onChange={(e) => setRemarqueInputs({...remarqueInputs, [action.id]: e.target.value})}
                      />
                      <button onClick={() => handleSaveRemarque(action.id)} className="px-3 py-2 bg-green-100 text-green-700 font-bold text-sm rounded-lg hover:bg-green-200">Valider</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Chat Hub Logic (Unchanged) */}
          <div className="bg-white rounded-2xl shadow-sm border overflow-hidden flex flex-col h-[650px]">
            {!activeThread ? (
              <>
                <div className="bg-indigo-600 px-6 py-4 shrink-0"><h2 className="text-lg font-bold text-white font-arabic">💬 Messages أحكيلي</h2></div>
                <div className="p-6 overflow-y-auto flex-1 bg-gray-50/50 space-y-3">
                  {threads.length === 0 ? <p className="text-gray-500 italic">Aucune discussion.</p> : threads.map(t => (
                    <button key={t.id} onClick={() => openThread(t)} className="w-full text-left p-4 bg-white border rounded-xl shadow-sm hover:border-indigo-400 transition flex justify-between items-center group">
                      <div>
                        <h3 className="font-bold text-gray-900">{t.subject}</h3>
                        <p className="text-xs text-gray-500 mt-1">{t.club}</p>
                      </div>
                      <span className="text-indigo-600 font-bold group-hover:translate-x-1 transition">Ouvrir →</span>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className="bg-indigo-600 px-4 py-3 shrink-0 flex items-center gap-3">
                  <button onClick={() => {setActiveThread(null); setReplyText('');}} className="text-white hover:bg-indigo-500 p-2 rounded-lg font-bold text-sm">← Retour</button>
                  <div className="overflow-hidden">
                    <h2 className="text-md font-bold text-white truncate">{activeThread.subject}</h2>
                    <p className="text-xs text-indigo-200">{activeThread.club}</p>
                  </div>
                </div>
                
                <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50/50">
                  {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.is_mission_reply ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] p-3 rounded-2xl ${msg.is_mission_reply ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white border text-gray-800 rounded-tl-none shadow-sm'}`}>
                        <p className="text-sm">{msg.message}</p>
                        <div className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${msg.is_mission_reply ? 'text-indigo-200' : 'text-gray-400'}`}>
                          <span>{new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                          {msg.is_mission_reply && <span className={msg.status === 'read' ? 'text-blue-300 font-bold' : ''}>{msg.status === 'read' ? '✓✓' : '✓'}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleReply} className="p-3 bg-white border-t flex gap-2 items-end">
                  <textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Répondre..." className="flex-1 p-2 border rounded-lg resize-none outline-none focus:ring-2 focus:ring-indigo-500 text-sm" rows="2" />
                  <button type="submit" className="px-4 py-3 bg-indigo-600 text-white font-bold text-sm rounded-lg hover:bg-indigo-700">Envoyer</button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
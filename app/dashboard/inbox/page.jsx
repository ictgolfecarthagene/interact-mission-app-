'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function InboxPage() {
  const [profile, setProfile] = useState(null);
  const [actions, setActions] = useState([]);
  const [viewMode, setViewMode] = useState('active'); // 'active' or 'archive'
  
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

  // Sync Archive Logic
  const handleArchive = async (actionId) => {
    const { error } = await supabase.from('submitted_actions').update({ archived: true }).eq('id', actionId);
    if (!error) setActions(actions.map(a => a.id === actionId ? { ...a, archived: true } : a));
  };

  const handleUnarchive = async (actionId) => {
    const { error } = await supabase.from('submitted_actions').update({ archived: false }).eq('id', actionId);
    if (!error) setActions(actions.map(a => a.id === actionId ? { ...a, archived: false } : a));
  };

  const handleSaveRemarque = async (actionId) => {
    const text = remarqueInputs[actionId];
    if (!text) return;
    
    const { error } = await supabase.from('submitted_actions').update({ remarque: text }).eq('id', actionId);
    if (!error) {
      setActions(actions.map(a => a.id === actionId ? { ...a, remarque: text } : a));
      setRemarqueInputs({...remarqueInputs, [actionId]: ''});
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

  if (!profile || profile.role === 'chef_club') return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><div className="animate-pulse font-bold text-xl text-indigo-400">Chargement...</div></div>;

  const filteredActions = actions.filter(a => viewMode === 'active' ? !a.archived : a.archived);

  // ========================================================
  // COMITE NATIONAL VIEW
  // ========================================================
  if (profile.role === 'comite_national') {
    return (
      <div className="min-h-screen bg-slate-50 p-4 sm:p-8 relative font-sans overflow-hidden">
        
        {/* Liquid Glass Background */}
        <div className="fixed top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob z-0 pointer-events-none"></div>
        <div className="fixed top-[-10%] right-[-10%] w-[500px] h-[500px] bg-teal-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000 z-0 pointer-events-none"></div>

        <div className="max-w-6xl mx-auto space-y-8 relative z-10">
          
          <div className="bg-white/70 backdrop-blur-2xl p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50 flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <Link href="/dashboard" className="text-sm font-bold text-teal-600 hover:text-teal-800 transition mb-1 inline-block">← Retour au hub</Link>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Travaux des Clubs</h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="font-bold text-slate-900">{profile.full_name}</p>
                <p className="text-sm text-slate-500 font-medium">{profile.poste}</p>
              </div>
              <div className="h-14 w-14 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 text-white flex items-center justify-center font-extrabold text-xl shadow-md ring-2 ring-teal-100">
                {getInitials(profile.full_name)}
              </div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50 overflow-hidden">
            <div className="bg-gradient-to-r from-teal-600 to-emerald-600 px-6 py-5 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white tracking-wide">📥 Registre {viewMode === 'active' ? 'Actif' : 'Archivé'}</h2>
              <div className="flex bg-teal-900/30 rounded-xl p-1 backdrop-blur-sm shadow-inner">
                <button onClick={() => setViewMode('active')} className={`px-5 py-2 text-sm font-bold rounded-lg transition-all ${viewMode === 'active' ? 'bg-white text-teal-800 shadow-sm' : 'text-teal-50 hover:text-white'}`}>Actives</button>
                <button onClick={() => setViewMode('archive')} className={`px-5 py-2 text-sm font-bold rounded-lg transition-all ${viewMode === 'archive' ? 'bg-white text-teal-800 shadow-sm' : 'text-teal-50 hover:text-white'}`}>Archives</button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-slate-900/5 text-slate-600 text-xs uppercase tracking-widest font-extrabold border-b border-slate-200/50">
                    <th className="p-5">Action & Club</th>
                    <th className="p-5">Date & Journée</th>
                    <th className="p-5 text-right">Gestion & Liens</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/50">
                  {filteredActions.length === 0 ? (
                    <tr><td colSpan="3" className="p-12 text-center text-slate-500 font-medium italic">Aucune action dans ce dossier.</td></tr>
                  ) : filteredActions.map(action => (
                    <tr key={action.id} className="hover:bg-white/60 transition-colors group">
                      <td className="p-5">
                        <p className="font-bold text-slate-900 text-base">{action.nom_action}</p>
                        <p className="font-bold text-indigo-600 text-sm mt-1">{action.club}</p>
                      </td>
                      <td className="p-5">
                        <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider bg-teal-50 text-teal-700 border border-teal-100 shadow-sm">
                          {action.journee_name}
                        </span>
                      </td>
                      <td className="p-5 text-right space-y-2">
                        <div className="flex justify-end gap-2">
                          <a href={action.social_link} target="_blank" rel="noreferrer" className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-200 transition-colors shadow-sm">Voir ↗</a>
                          {viewMode === 'active' ? (
                            <button onClick={() => handleArchive(action.id)} className="px-4 py-2 bg-orange-50 text-orange-700 font-bold rounded-xl text-xs hover:bg-orange-100 transition-colors shadow-sm">Archiver</button>
                          ) : (
                            <button onClick={() => handleUnarchive(action.id)} className="px-4 py-2 bg-blue-50 text-blue-700 font-bold rounded-xl text-xs hover:bg-blue-100 transition-colors shadow-sm">Désarchiver</button>
                          )}
                        </div>
                        {action.remarque && (
                          <p className="text-xs text-emerald-700 font-bold bg-emerald-50 p-2.5 rounded-xl text-left mt-3 border border-emerald-100 shadow-sm inline-block">✓ Validé: {action.remarque}</p>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ========================================================
  // CHEF MISSION VIEW
  // ========================================================
  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8 relative font-sans overflow-hidden">
      
      {/* Liquid Glass Background */}
      <div className="fixed top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob z-0 pointer-events-none"></div>
      <div className="fixed top-[-10%] right-[-10%] w-[500px] h-[500px] bg-teal-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000 z-0 pointer-events-none"></div>

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        
        <div className="bg-white/70 backdrop-blur-2xl p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <Link href="/dashboard" className="text-sm font-bold text-indigo-600 hover:text-indigo-800 transition mb-1 inline-block">← Retour au hub</Link>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Boîte de Réception Centrale</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="font-bold text-slate-900">{profile.full_name}</p>
              <p className="text-sm text-slate-500 font-medium">{profile.poste}</p>
            </div>
            <div className="h-14 w-14 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 text-white flex items-center justify-center font-extrabold text-xl shadow-md ring-2 ring-indigo-100">
              {getInitials(profile.full_name)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Actions Column */}
          <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50 overflow-hidden flex flex-col h-[700px]">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-5 shrink-0 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white tracking-wide">📥 Actions {viewMode === 'active' ? 'Soumises' : 'Archivées'}</h2>
              <div className="flex bg-black/20 rounded-xl p-1 backdrop-blur-md shadow-inner">
                <button onClick={() => setViewMode('active')} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${viewMode === 'active' ? 'bg-white text-emerald-800 shadow-sm' : 'text-emerald-50 hover:text-white'}`}>Actives</button>
                <button onClick={() => setViewMode('archive')} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${viewMode === 'archive' ? 'bg-white text-emerald-800 shadow-sm' : 'text-emerald-50 hover:text-white'}`}>Archives</button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-5 bg-slate-50/30">
              {filteredActions.length === 0 ? <p className="text-slate-500 font-medium italic text-center mt-10">Aucune action dans ce dossier.</p> : filteredActions.map((action) => (
                <div key={action.id} className="p-6 border border-slate-200/50 rounded-2xl bg-white/80 backdrop-blur-md shadow-sm hover:shadow-md transition-shadow group">
                  
                  <div className="flex justify-between items-start mb-4">
                    <span className={`text-[10px] font-extrabold px-3 py-1.5 rounded-lg uppercase tracking-wider shadow-sm border ${action.remarque ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-indigo-50 text-indigo-700 border-indigo-100'}`}>
                      {action.journee_name}
                    </span>
                    <div className="flex gap-2">
                      <a href={action.social_link} target="_blank" rel="noreferrer" className="text-xs bg-slate-100 text-slate-700 px-4 py-2 rounded-xl font-bold hover:bg-slate-200 transition-colors shadow-sm">Voir ↗</a>
                      {viewMode === 'active' ? (
                        <button onClick={() => handleArchive(action.id)} className="text-xs bg-orange-50 text-orange-700 px-4 py-2 rounded-xl font-bold hover:bg-orange-100 transition-colors shadow-sm">Archiver</button>
                      ) : (
                        <button onClick={() => handleUnarchive(action.id)} className="text-xs bg-blue-50 text-blue-700 px-4 py-2 rounded-xl font-bold hover:bg-blue-100 transition-colors shadow-sm">Désarchiver</button>
                      )}
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-extrabold text-slate-900 leading-tight">{action.nom_action}</h3>
                  <p className="text-sm font-bold text-indigo-600 mt-1.5 mb-4">{action.club}</p>
                  <p className="text-sm text-slate-600 mb-6 leading-relaxed bg-slate-50/80 p-4 rounded-xl border border-slate-100">{action.description}</p>
                  
                  {/* Feedback Section */}
                  {action.remarque ? (
                    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 p-4 rounded-xl flex justify-between items-center shadow-sm">
                      <div>
                        <p className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-widest mb-1.5">✓ Feedback Validé</p>
                        <p className="text-sm font-bold text-emerald-900">{action.remarque}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
                      <input 
                        type="text" 
                        placeholder="Taper un point à améliorer..." 
                        className="flex-1 p-2.5 text-sm bg-transparent outline-none font-semibold text-slate-700"
                        value={remarqueInputs[action.id] || ''}
                        onChange={(e) => setRemarqueInputs({...remarqueInputs, [action.id]: e.target.value})}
                      />
                      <button onClick={() => handleSaveRemarque(action.id)} className="px-5 py-2.5 bg-emerald-500 text-white font-bold text-sm rounded-lg hover:bg-emerald-600 transition-colors shadow-md">Valider</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Ahkili Chat Column */}
          <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50 overflow-hidden flex flex-col h-[700px]">
            {!activeThread ? (
              <>
                <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-5 shrink-0">
                  <h2 className="text-xl font-bold text-white tracking-wide font-arabic">💬 Messages أحكيلي</h2>
                </div>
                <div className="p-6 overflow-y-auto flex-1 bg-slate-50/30 space-y-3">
                  {threads.length === 0 ? <p className="text-slate-500 font-medium italic text-center mt-10">Aucune discussion.</p> : threads.map(t => (
                    <button key={t.id} onClick={() => openThread(t)} className="w-full text-left p-5 bg-white/80 backdrop-blur-md border border-slate-200/50 rounded-2xl shadow-sm hover:shadow-md hover:border-indigo-300 transition-all flex justify-between items-center group">
                      <div>
                        <h3 className="font-extrabold text-slate-900">{t.subject}</h3>
                        <p className="text-sm font-bold text-indigo-600 mt-1.5">{t.club}</p>
                      </div>
                      <div className="h-10 w-10 rounded-full bg-indigo-50 flex items-center justify-center group-hover:bg-indigo-100 transition-colors border border-indigo-100">
                        <span className="text-indigo-600 font-extrabold group-hover:translate-x-0.5 transition-transform">→</span>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-5 py-4 shrink-0 flex items-center gap-4 shadow-sm">
                  <button onClick={() => {setActiveThread(null); setReplyText('');}} className="text-white hover:bg-white/20 p-2.5 rounded-xl font-bold text-sm transition-colors backdrop-blur-sm">←</button>
                  <div className="overflow-hidden">
                    <h2 className="text-base font-extrabold text-white truncate">{activeThread.subject}</h2>
                    <p className="text-xs font-bold text-indigo-100 mt-0.5">{activeThread.club}</p>
                  </div>
                </div>
                
                <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-50/30">
                  {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.is_mission_reply ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] p-4 rounded-2xl shadow-sm ${msg.is_mission_reply ? 'bg-indigo-600 text-white rounded-tr-sm' : 'bg-white/90 backdrop-blur-md border border-slate-200/50 text-slate-800 rounded-tl-sm'}`}>
                        <p className="text-sm font-medium leading-relaxed">{msg.message}</p>
                        <div className={`flex items-center justify-end gap-1.5 mt-2 text-[10px] font-extrabold ${msg.is_mission_reply ? 'text-indigo-200' : 'text-slate-400'}`}>
                          <span>{new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                          {msg.is_mission_reply && <span className={msg.status === 'read' ? 'text-emerald-300' : ''}>{msg.status === 'read' ? '✓✓' : '✓'}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleReply} className="p-4 bg-white/80 backdrop-blur-md border-t border-slate-200/50 flex gap-3 items-end">
                  <textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Écrire une réponse..." className="flex-1 p-3.5 bg-slate-50 border border-slate-200 rounded-xl resize-none outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm font-medium shadow-inner" rows="2" />
                  <button type="submit" className="px-6 py-4 bg-indigo-600 text-white font-extrabold text-sm rounded-xl hover:bg-indigo-700 transition-colors shadow-md hover:-translate-y-0.5 transform">Envoyer</button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
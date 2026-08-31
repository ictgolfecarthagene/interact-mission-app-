'use client';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AhkiliThreadsPage() {
  const [profile, setProfile] = useState(null);
  const [threads, setThreads] = useState([]);
  const [activeThread, setActiveThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const router = useRouter();
  
  const messagesEndRef = useRef(null);
  const [dialog, setDialog] = useState({ isOpen: false, message: '' });

  const getTargetClub = (user, userProfile) => {
    if (user.email === 'yessinebenfraj106@gmail.com') {
      return localStorage.getItem('god_mode_club') || 'IC Tunis Golfe Carthagène';
    }
    return userProfile?.club;
  };

  useEffect(() => {
    async function loadProfileAndThreads() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push('/');
      const { data: userProfile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setProfile(userProfile);
      
      const targetClub = getTargetClub(user, userProfile);

      if (targetClub) {
        const { data: myThreads } = await supabase
          .from('ahkili_threads')
          .select('*, profiles(full_name)')
          .eq('club', targetClub)
          .order('created_at', { ascending: false });
        setThreads(myThreads || []);
      }
    }
    loadProfileAndThreads();
  }, [router]);

  useEffect(() => {
    if (!activeThread || !profile) return;

    const channel = supabase
      .channel(`chat_thread_${activeThread.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'ahkili_messages', filter: `thread_id=eq.${activeThread.id}` },
        async (payload) => {
          if (payload.new.sender_id !== profile.id) {
            const { data: senderProfile } = await supabase.from('profiles').select('full_name').eq('id', payload.new.sender_id).single();
            const liveMessage = { ...payload.new, profiles: { full_name: senderProfile?.full_name } };
            
            setMessages((currentMessages) => [...currentMessages, liveMessage]);
            supabase.from('ahkili_messages').update({ status: 'read' }).eq('id', payload.new.id).then();
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeThread, profile]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const openThread = async (thread) => {
    setActiveThread(thread);
    const { data: msgs } = await supabase
      .from('ahkili_messages')
      .select('*, profiles(full_name)')
      .eq('thread_id', thread.id)
      .order('created_at', { ascending: true });
    
    setMessages(msgs || []);
    await supabase.from('ahkili_messages').update({ status: 'read' }).eq('thread_id', thread.id).eq('is_mission_reply', true).eq('status', 'delivered');
  };

  const handleCreateThread = async (e) => {
    e.preventDefault();
    if (!newSubject.trim() || !newMessage.trim()) return;
    
    const { data: { user } } = await supabase.auth.getUser();
    const targetClub = getTargetClub(user, profile);

    const { data: threadData, error: threadError } = await supabase.from('ahkili_threads').insert([{ user_id: profile.id, club: targetClub, subject: newSubject }]).select('*, profiles(full_name)').single();
    
    if (threadError) {
      return setDialog({ isOpen: true, message: `Impossible de créer la discussion: ${threadError.message}` });
    }

    await supabase.from('ahkili_messages').insert([{ thread_id: threadData.id, sender_id: profile.id, message: newMessage, is_mission_reply: false }]);
    setThreads([threadData, ...threads]);
    setIsCreating(false); setNewSubject(''); setNewMessage(''); openThread(threadData);
  };

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!newMessage.trim() || !activeThread) return;
    
    const msgData = { thread_id: activeThread.id, sender_id: profile.id, message: newMessage.trim(), is_mission_reply: false };
    
    setMessages([...messages, { ...msgData, profiles: { full_name: profile.full_name }, created_at: new Date().toISOString(), status: 'delivered' }]); 
    setNewMessage('');
    await supabase.from('ahkili_messages').insert([msgData]);
  };

  const handleKeyDown = (e) => {
    // If Enter is pressed without Shift, send the message (Mobile & PC)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (newMessage.trim()) handleSendMessage();
    }
  };

  if (!profile) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="animate-pulse text-xl font-bold text-indigo-400">Chargement...</div></div>;

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8 relative font-sans overflow-hidden">
      <div className="fixed top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob z-0 pointer-events-none"></div>
      <div className="fixed top-[-10%] right-[-10%] w-[500px] h-[500px] bg-teal-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000 z-0 pointer-events-none"></div>

      <div className="max-w-4xl mx-auto space-y-6 relative z-10">
        <div className="bg-white/70 backdrop-blur-2xl p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50 flex justify-between items-center">
          <div><Link href="/dashboard" className="text-sm font-bold text-indigo-600 hover:text-indigo-800 transition mb-1 inline-block">← Retour au hub</Link><h1 className="text-3xl font-extrabold text-slate-900 font-arabic">أحكيلي</h1></div>
          <div className="text-right hidden sm:block"><p className="font-bold text-slate-900">{profile.full_name}</p><p className="text-sm font-medium text-slate-500">{profile.club || 'Admin'}</p></div>
        </div>

        <div className="bg-white/60 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50 overflow-hidden min-h-[600px] flex flex-col">
          {!activeThread && !isCreating && (
            <>
              <div className="p-6 border-b border-slate-200/50 flex justify-between items-center bg-white/40">
                <h2 className="font-extrabold text-slate-900 text-xl tracking-wide">Vos discussions</h2>
                <button onClick={() => setIsCreating(true)} className="px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl shadow-md hover:bg-indigo-700 hover:-translate-y-0.5 transition-all">+ Nouvelle discussion</button>
              </div>
              <div className="p-6 space-y-4 flex-1 overflow-y-auto">
                {threads.length === 0 ? <p className="text-center text-slate-400 mt-10 font-medium">Aucune discussion en cours.</p> : threads.map(t => (
                  <div key={t.id} onClick={() => openThread(t)} className="p-5 border border-slate-200 bg-white/50 rounded-2xl hover:bg-white hover:shadow-md cursor-pointer flex justify-between items-center transition-all group">
                    <div>
                      <h3 className="font-bold text-slate-900 text-lg">{t.subject}</h3>
                      <p className="text-xs font-bold text-slate-500 mt-1">
                        Démarrée par <span className="text-indigo-600 font-extrabold">{t.profiles?.full_name || 'Un membre'}</span> • {new Date(t.created_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <span className="text-indigo-600 font-extrabold group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {isCreating && (
            <div className="p-8 flex-1 bg-white/40">
              <button onClick={() => setIsCreating(false)} className="text-sm font-bold text-slate-500 hover:text-slate-900 mb-6 transition-colors">← Annuler</button>
              <h2 className="text-2xl font-extrabold mb-6 text-slate-900 tracking-tight">Démarrer une nouvelle discussion</h2>
              <form onSubmit={handleCreateThread} className="space-y-5">
                <div><label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">Sujet de la discussion</label><input type="text" required value={newSubject} onChange={(e) => setNewSubject(e.target.value)} className="w-full p-4 bg-white/80 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm transition-all" placeholder="Ex: Demande de budget..." /></div>
                <div><label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">Premier message</label><textarea required value={newMessage} onChange={(e) => setNewMessage(e.target.value)} className="w-full p-4 bg-white/80 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm resize-none h-32 transition-all" placeholder="Écrivez votre message à la mission..." /></div>
                <button type="submit" className="w-full py-4 bg-indigo-600 text-white font-extrabold rounded-2xl shadow-lg hover:bg-indigo-700 transition-all hover:-translate-y-0.5">Envoyer à la mission</button>
              </form>
            </div>
          )}

          {activeThread && (
            <>
              <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-5 shrink-0 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-4">
                  <button onClick={() => {setActiveThread(null); setNewMessage('');}} className="text-white hover:bg-white/20 p-2 rounded-xl font-bold transition-colors backdrop-blur-sm">← Retour</button>
                  <h2 className="text-lg font-bold text-white tracking-wide">{activeThread.subject}</h2>
                </div>
              </div>
              <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-white/20 flex flex-col">
                {messages.map((msg, idx) => {
                  const isMyMessage = !msg.is_mission_reply; 
                  
                  return (
                    <div key={idx} className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] p-4 rounded-2xl shadow-sm ${isMyMessage ? 'bg-indigo-600 text-white rounded-tr-sm' : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm'}`}>
                        
                        {!isMyMessage && (
                          <p className="text-[10px] font-extrabold uppercase mb-1 opacity-70 text-slate-500">
                            Mission des actions
                          </p>
                        )}
                        {isMyMessage && msg.profiles?.full_name !== profile.full_name && (
                           <p className="text-[10px] font-extrabold uppercase mb-1 opacity-80 text-indigo-200">
                             {msg.profiles?.full_name}
                           </p>
                        )}
                        
                        <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                        <div className={`flex items-center justify-end gap-1.5 mt-2 text-[10px] font-extrabold ${isMyMessage ? 'text-indigo-200' : 'text-slate-400'}`}>
                          <span>{new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                          {isMyMessage && <span className={msg.status === 'read' ? 'text-emerald-300' : ''}>{msg.status === 'read' ? '✓✓' : '✓'}</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
              <form onSubmit={handleSendMessage} className="p-4 bg-white/80 backdrop-blur-md border-t border-slate-200/50 flex gap-3 items-end">
                <textarea 
                  value={newMessage} 
                  onChange={(e) => setNewMessage(e.target.value)} 
                  onKeyDown={handleKeyDown}
                  enterKeyHint="send" 
                  placeholder="Écrivez une réponse..." 
                  className="flex-1 p-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 resize-none font-medium transition-all shadow-inner" 
                  rows="2" 
                />
                <button type="submit" disabled={!newMessage.trim()} className="px-6 py-3.5 bg-indigo-600 text-white font-extrabold rounded-xl shadow-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 transition-all">Envoyer</button>
              </form>
            </>
          )}
        </div>
      </div>

      {dialog.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl border border-white/50 text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 bg-red-100 text-red-600">
              ✕
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 mb-2">Attention</h3>
            <p className="text-slate-500 font-medium mb-8 leading-relaxed">{dialog.message}</p>
            <button onClick={() => setDialog({ isOpen: false, message: '' })} className="w-full py-3.5 bg-slate-900 text-white font-extrabold rounded-xl hover:bg-slate-800 transition-all shadow-md">
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
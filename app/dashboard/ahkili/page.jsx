'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AhkiliThreadsPage() {
  const [profile, setProfile] = useState(null);
  const [threads, setThreads] = useState([]);
  const [activeThread, setActiveThread] = useState(null);
  const [messages, setMessages] = useState([]);
  
  // New Thread State
  const [isCreating, setIsCreating] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  
  // Message State
  const [newMessage, setNewMessage] = useState('');
  const router = useRouter();

  useEffect(() => {
    async function loadProfileAndThreads() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push('/');

      const { data: userProfile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setProfile(userProfile);

      if (userProfile?.club) {
        const { data: myThreads } = await supabase
          .from('ahkili_threads')
          .select('*')
          .eq('club', userProfile.club)
          .order('created_at', { ascending: false });
        setThreads(myThreads || []);
      }
    }
    loadProfileAndThreads();
  }, [router]);

  const openThread = async (thread) => {
    setActiveThread(thread);
    const { data: msgs } = await supabase.from('ahkili_messages').select('*').eq('thread_id', thread.id).order('created_at', { ascending: true });
    setMessages(msgs || []);

    // Mark mission's replies as read when the club opens the chat
    await supabase.from('ahkili_messages').update({ status: 'read' }).eq('thread_id', thread.id).eq('is_mission_reply', true).eq('status', 'delivered');
  };

  const handleCreateThread = async (e) => {
    e.preventDefault();
    if (!newSubject.trim() || !newMessage.trim()) return;

    // 1. Create Thread
    const { data: threadData, error: threadError } = await supabase.from('ahkili_threads')
      .insert([{ user_id: profile.id, club: profile.club, subject: newSubject }])
      .select().single();

    if (threadError) return alert(threadError.message);

    // 2. Insert first message
    await supabase.from('ahkili_messages').insert([{
      thread_id: threadData.id,
      sender_id: profile.id,
      message: newMessage,
      is_mission_reply: false
    }]);

    setThreads([threadData, ...threads]);
    setIsCreating(false);
    setNewSubject('');
    setNewMessage('');
    openThread(threadData);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeThread) return;

    const msgData = {
      thread_id: activeThread.id,
      sender_id: profile.id,
      message: newMessage,
      is_mission_reply: false
    };

    const { error } = await supabase.from('ahkili_messages').insert([msgData]);
    if (!error) {
      setMessages([...messages, { ...msgData, created_at: new Date().toISOString(), status: 'delivered' }]);
      setNewMessage('');
    }
  };

  if (!profile) return <div className="min-h-screen flex items-center justify-center"><div className="animate-pulse font-bold">Chargement...</div></div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border flex justify-between items-center">
          <div>
            <Link href="/dashboard" className="text-sm font-bold text-indigo-600 hover:underline mb-1 inline-block">← Retour au tableau de bord</Link>
            <h1 className="text-2xl font-extrabold text-gray-900 font-arabic">أحكيلي (Conversations)</h1>
          </div>
          <div className="text-right hidden sm:block">
            <p className="font-bold">{profile.full_name}</p>
            <p className="text-sm text-gray-500">{profile.club}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden min-h-[600px] flex flex-col">
          
          {/* VIEW 1: THREAD LIST */}
          {!activeThread && !isCreating && (
            <>
              <div className="p-6 border-b flex justify-between items-center bg-indigo-50/50">
                <h2 className="font-bold text-gray-800">Vos discussions</h2>
                <button onClick={() => setIsCreating(true)} className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700">+ Nouvelle discussion</button>
              </div>
              <div className="p-6 space-y-3 flex-1 overflow-y-auto">
                {threads.length === 0 ? <p className="text-center text-gray-400 mt-10">Aucune discussion en cours.</p> : threads.map(t => (
                  <div key={t.id} onClick={() => openThread(t)} className="p-4 border rounded-xl hover:border-indigo-400 cursor-pointer flex justify-between items-center transition group">
                    <div>
                      <h3 className="font-bold text-gray-900">{t.subject}</h3>
                      <p className="text-xs text-gray-500 mt-1">{new Date(t.created_at).toLocaleDateString('fr-FR')} - Cliquez pour ouvrir</p>
                    </div>
                    <span className="text-indigo-600 font-bold group-hover:translate-x-1 transition">→</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* VIEW 2: CREATE NEW THREAD */}
          {isCreating && (
            <div className="p-8 flex-1">
              <button onClick={() => setIsCreating(false)} className="text-sm font-bold text-gray-500 hover:text-gray-900 mb-6">← Annuler</button>
              <h2 className="text-2xl font-bold mb-6">Démarrer une nouvelle discussion</h2>
              <form onSubmit={handleCreateThread} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Sujet de la discussion</label>
                  <input type="text" required value={newSubject} onChange={(e) => setNewSubject(e.target.value)} className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-600 outline-none" placeholder="Ex: Demande de budget, Question sur l'action..." />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Premier message</label>
                  <textarea required value={newMessage} onChange={(e) => setNewMessage(e.target.value)} className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-600 outline-none resize-none h-32" placeholder="Écrivez votre message à la mission..." />
                </div>
                <button type="submit" className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700">Envoyer à la mission</button>
              </form>
            </div>
          )}

          {/* VIEW 3: ACTIVE CHAT */}
          {activeThread && (
            <>
              <div className="bg-indigo-600 px-4 py-4 shrink-0 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button onClick={() => {setActiveThread(null); setNewMessage('');}} className="text-white hover:bg-indigo-500 p-2 rounded-lg font-bold text-sm">← Retour</button>
                  <h2 className="text-md font-bold text-white">{activeThread.subject}</h2>
                </div>
              </div>
              
              <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-gray-50/50">
                {messages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.is_mission_reply ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[75%] p-3 rounded-2xl ${msg.is_mission_reply ? 'bg-white border text-gray-800 rounded-tl-none' : 'bg-indigo-600 text-white rounded-tr-none shadow-md'}`}>
                      <p className="text-sm">{msg.message}</p>
                      <div className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${msg.is_mission_reply ? 'text-gray-400' : 'text-indigo-200'}`}>
                        <span>{new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                        {/* Read Receipts (Only show checks for messages YOU sent) */}
                        {!msg.is_mission_reply && (
                          <span className={msg.status === 'read' ? 'text-blue-300 font-bold' : ''}>{msg.status === 'read' ? '✓✓' : '✓'}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <form onSubmit={handleSendMessage} className="p-3 bg-white border-t flex gap-3 items-end rounded-b-2xl">
                <textarea 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Écrivez une réponse..."
                  className="flex-1 p-3 border rounded-xl resize-none outline-none focus:ring-2 focus:ring-indigo-500 max-h-32"
                  rows="2"
                />
                <button type="submit" className="px-6 py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700">Envoyer</button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
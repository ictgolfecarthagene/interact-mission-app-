'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AhkiliChatPage() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [profile, setProfile] = useState(null);
  const router = useRouter();

  useEffect(() => {
    async function loadChat() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push('/');

      const { data: userProfile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setProfile(userProfile);

      // Fetch chat history for this specific club
      if (userProfile?.club) {
        const { data: chatHistory } = await supabase
          .from('ahkili_messages')
          .select('*')
          .eq('club', userProfile.club)
          .order('created_at', { ascending: true });
        setMessages(chatHistory || []);
      }
    }
    loadChat();
  }, [router]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const msgData = {
      user_id: profile.id,
      club: profile.club,
      message: newMessage,
      is_mission_reply: false // False means it came from the club
    };

    const { error } = await supabase.from('ahkili_messages').insert([msgData]);
    
    if (!error) {
      setMessages([...messages, { ...msgData, created_at: new Date().toISOString() }]);
      setNewMessage('');
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    const splitName = name.trim().split(' ');
    return (splitName.length === 1 ? splitName[0][0] : splitName[0][0] + splitName[splitName.length - 1][0]).toUpperCase();
  };

  if (!profile) return <div className="min-h-screen flex items-center justify-center"><div className="animate-pulse font-bold">Chargement...</div></div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border flex justify-between items-center">
          <div>
            <Link href="/dashboard" className="text-sm font-bold text-indigo-600 hover:underline mb-1 inline-block">← Retour</Link>
            <h1 className="text-2xl font-extrabold text-gray-900 font-arabic">أحكيلي (Chat Direct)</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="font-bold">{profile.full_name}</p>
              <p className="text-sm text-gray-500">{profile.club}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold">
              {getInitials(profile.full_name)}
            </div>
          </div>
        </div>

        {/* Chat Window */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col h-[600px]">
          <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-gray-50/50">
            {messages.length === 0 ? (
              <p className="text-center text-gray-400 mt-10">Envoyez votre premier message à la mission. Tout est confidentiel.</p>
            ) : (
              messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.is_mission_reply ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[75%] p-4 rounded-2xl ${msg.is_mission_reply ? 'bg-white border text-gray-800 rounded-tl-none' : 'bg-indigo-600 text-white rounded-tr-none shadow-md'}`}>
                    <p className="text-sm">{msg.message}</p>
                    <span className={`text-[10px] mt-2 block ${msg.is_mission_reply ? 'text-gray-400' : 'text-indigo-200'}`}>
                      {new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Input Area */}
          <form onSubmit={handleSend} className="p-4 bg-white border-t flex gap-4 items-end rounded-b-2xl">
            <textarea 
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Écrivez votre message..."
              className="flex-1 p-3 border rounded-xl resize-none outline-none focus:ring-2 focus:ring-indigo-500 max-h-32"
              rows="2"
            />
            <button type="submit" className="px-6 py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition">
              Envoyer
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LoadingSpinner } from '../components/shared';

const Messages = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [currentMessages, setCurrentMessages] = useState([]);

  const messagesEndRef = useRef(null);

  // Fetch conversations on mount
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/messages.php?action=conversations&limit=20');
        const data = await response.json();
        if (data.status === 'success' && data.conversations) {
          setConversations(data.conversations);
          if (data.conversations.length > 0) {
            setSelectedChatId(data.conversations[0].id);
          }
          setError(null);
        } else {
          setConversations(getSampleConversations());
        }
      } catch (err) {
        console.error('Error fetching conversations:', err);
        setConversations(getSampleConversations());
        setError('Failed to load conversations');
      } finally {
        setLoading(false);
      }
    };
    fetchConversations();
  }, []);

  // Fetch messages when conversation changes
  useEffect(() => {
    if (selectedChatId) {
      fetchMessages(selectedChatId);
    }
  }, [selectedChatId]);

  const fetchMessages = async (conversationId) => {
    try {
      const response = await fetch(`/api/messages.php?action=list&conversation_id=${conversationId}&limit=50`);
      const data = await response.json();
      if (data.status === 'success') {
        setCurrentMessages(data.messages || []);
      } else {
        setCurrentMessages(getSampleMessages());
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
      setCurrentMessages(getSampleMessages());
    }
  };

  // Mock Conversations fallback
  const getSampleConversations = () => [
    {
      id: 1,
      type: 'direct',
      name: 'Dr. Budi Santoso',
      created_by: 1,
      created_at: '2026-05-10T10:30:00Z',
      message_count: 5,
      last_message_at: '2026-05-16T08:15:00Z'
    }
  ];

  const getSampleMessages = () => [
    {
      id: 1,
      sender_id: 2,
      sender_name: 'Dr. Budi Santoso',
      sender_avatar: 'https://via.placeholder.com/40/6366f1/ffffff?text=BS',
      message_text: 'Halo, bagaimana progress risetmu?',
      message_type: 'text',
      status: 'read',
      created_at: '2026-05-16T08:15:00Z'
    }
  ];

  const selectedChat = conversations.find(c => c.id === selectedChatId);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages, selectedChatId]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChatId) return;

    try {
      const response = await fetch('/api/messages.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send',
          conversation_id: selectedChatId,
          sender_id: 1,
          message_text: newMessage.trim(),
          message_type: 'text'
        })
      });

      const data = await response.json();
      if (data.status === 'success') {
        setNewMessage('');
        fetchMessages(selectedChatId);
      }
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  const filteredConversations = conversations.filter(c => {
    const matchesSearch = c.name && c.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'all' ||
                       (activeTab === 'groups' && c.type === 'group') ||
                       (activeTab === 'direct' && c.type === 'direct');
    return matchesSearch && matchesTab;
  });

  if (loading) {
    return (
      <main className="pt-28 pb-12 px-4 sm:px-6 lg:px-8 h-screen flex items-center justify-center">
        <LoadingSpinner />
      </main>
    );
  }

  return (
    <main className="pt-28 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-600 mb-6">
        <Link to="/" className="hover:text-indigo-600 transition-colors">Beranda</Link>
        <span className="text-gray-400">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
        </span>
        <Link to="/dashboard" className="hover:text-indigo-600 transition-colors">Dashboard</Link>
        <span className="text-gray-400">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
        </span>
        <span className="text-gray-900 font-medium">Pesan</span>
      </nav>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Pesan</h1>
        <button className="lg:hidden px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
          {showMobileChat ? '← Kembali' : '+ Pesan Baru'}
        </button>
      </div>

      {/* Chat Container */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden h-[calc(100vh-12rem)] flex flex-col lg:flex-row">
        
        {/* LEFT PANEL: Conversations List */}
        <div className={`w-full lg:w-96 border-r border-gray-200 flex flex-col bg-white ${showMobileChat ? 'hidden lg:flex' : 'flex'}`}>
          {/* Search & Filters */}
          <div className="p-4 border-b border-gray-100 space-y-3">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Cari percakapan..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              />
              <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {[
                { id: 'all', label: 'Semua' },
                { id: 'unread', label: 'Belum Dibaca' },
                { id: 'groups', label: 'Grup' },
                { id: 'archived', label: 'Arsip' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                    activeTab === tab.id ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length > 0 ? filteredConversations.map(chat => (
              <button
                key={chat.id}
                onClick={() => { setSelectedChatId(chat.id); setShowMobileChat(true); }}
                className={`w-full p-4 flex gap-3 border-b border-gray-50 hover:bg-gray-50 transition-colors text-left ${selectedChatId === chat.id ? 'bg-indigo-50/50 border-l-4 border-l-indigo-600' : ''}`}
              >
                <div className="relative shrink-0">
                  <img src={chat.avatar} alt={chat.name} className="w-12 h-12 rounded-full object-cover" />
                  {chat.online && <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <p className={`text-sm font-semibold truncate ${chat.unread > 0 ? 'text-gray-900' : 'text-gray-700'}`}>{chat.name}</p>
                    <span className="text-xs text-gray-500 shrink-0 ml-2">{chat.time}</span>
                  </div>
                  <p className="text-xs text-gray-500 truncate mb-1">{chat.lastMsg}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-gray-400 uppercase tracking-wide">{chat.type === 'group' ? `${chat.members} anggota` : 'Pribadi'}</span>
                    {chat.unread > 0 && (
                      <span className="bg-indigo-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                        {chat.unread}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            )) : (
              <div className="p-8 text-center text-gray-500">
                <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                <p className="text-sm">Tidak ada percakapan ditemukan</p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL: Chat Window */}
        <div className={`flex-1 flex flex-col bg-gray-50 ${showMobileChat ? 'flex' : 'hidden lg:flex'}`}>
          {selectedChat ? (
            <>
              {/* Chat Header */}
              <div className="px-6 py-4 bg-white border-b border-gray-200 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                  <button onClick={() => setShowMobileChat(false)} className="lg:hidden mr-2 text-gray-500 hover:text-gray-700">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  <img src={selectedChat.avatar} alt={selectedChat.name} className="w-10 h-10 rounded-full object-cover" />
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{selectedChat.name}</p>
                    <p className="text-xs text-green-600 flex items-center gap-1">
                      {selectedChat.online ? (
                        <>Online <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span></>
                      ) : (
                        <>Terakhir aktif 2 jam lalu</>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors" title="Panggilan Suara">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                  </button>
                  <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors" title="Panggilan Video">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                  </button>
                  <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors" title="Info">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </button>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-gray-50 to-white">
                <div className="text-center">
                  <span className="px-3 py-1 bg-gray-200 text-gray-600 text-xs rounded-full">Hari Ini</span>
                </div>
                {currentMessages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                    {msg.sender !== 'me' && (
                      <img src={selectedChat.avatar} alt="" className="w-8 h-8 rounded-full object-cover mr-2 mt-1" />
                    )}
                    <div className={`max-w-[70%] ${msg.sender === 'me' ? 'order-1' : ''}`}>
                      {msg.sender !== 'me' && msg.name && (
                        <p className="text-xs text-indigo-600 font-medium mb-1 ml-1">{msg.name}</p>
                      )}
                      <div className={`px-4 py-2.5 rounded-2xl text-sm ${
                        msg.sender === 'me' 
                          ? 'bg-indigo-600 text-white rounded-br-none' 
                          : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none shadow-sm'
                      }`}>
                        {msg.text}
                      </div>
                      <div className={`flex items-center gap-1 mt-1 text-[10px] ${msg.sender === 'me' ? 'justify-end text-gray-500' : 'text-gray-400'}`}>
                        <span>{msg.time}</span>
                        {msg.sender === 'me' && (
                          <span className="flex items-center">
                            {msg.status === 'sent' && (
                              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                            )}
                            {msg.status === 'delivered' && (
                              <>
                                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                <svg className="w-3 h-3 -ml-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                              </>
                            )}
                            {msg.status === 'read' && (
                              <span className="flex text-blue-500">
                                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                <svg className="w-3 h-3 -ml-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                              </span>
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-4 bg-white border-t border-gray-200">
                <form onSubmit={handleSendMessage} className="flex items-end gap-3">
                  <button type="button" className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors shrink-0">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                  </button>
                  <div className="flex-grow bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2 flex items-center">
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(e); } }}
                      placeholder="Ketik pesan..."
                      rows="1"
                      className="w-full bg-transparent text-sm focus:outline-none resize-none max-h-32"
                    />
                    <button type="button" className="p-1 text-gray-400 hover:text-gray-600">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </button>
                  </div>
                  <button 
                    type="submit" 
                    disabled={!newMessage.trim()}
                    className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm shrink-0"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Pilih Percakapan</h3>
              <p className="text-sm text-center max-w-xs">Pilih kontak atau grup dari daftar di sebelah kiri untuk memulai percakapan.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default Messages;
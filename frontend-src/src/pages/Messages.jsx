import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

/**
 * Pesan langsung antarpengguna (GET/POST /api/messages.php).
 * Versi lama mengirim sender_id: 1 untuk semua orang dan tidak bisa memulai percakapan.
 */
const api = async (query = '', body = null) => {
  const res = await fetch(`/api/messages.php${query}`, body ? {
    method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  } : { credentials: 'same-origin' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.status !== 'success') throw new Error(data.message || `HTTP ${res.status}`);
  return data;
};

const fmtTime = (ts) => {
  if (!ts) return '';
  const d = new Date(`${ts.replace(' ', 'T')}Z`);
  return Number.isNaN(d.getTime()) ? ts : d.toLocaleString();
};

const Messages = () => {
  const { t } = useTranslation('account');
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [starting, setStarting] = useState(false);
  const [recipient, setRecipient] = useState('');
  const [firstMessage, setFirstMessage] = useState('');
  const [search, setSearch] = useState('');
  const endRef = useRef(null);

  const loadConversations = useCallback(async (selectId = null) => {
    try {
      const d = await api('?action=conversations');
      setConversations(d.conversations);
      setError('');
      if (selectId) setSelectedId(selectId);
      else setSelectedId(prev => prev ?? d.conversations[0]?.id ?? null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMessages = useCallback(async (id) => {
    if (!id) { setMessages([]); return; }
    try {
      const d = await api(`?action=list&conversation_id=${id}`);
      setMessages(d.messages);
      setConversations(prev => prev.map(c => (c.id === id ? { ...c, unread: 0 } : c)));
    } catch (e) {
      toast.error(e.message);
    }
  }, []);

  useEffect(() => { loadConversations(); }, [loadConversations]);
  useEffect(() => { loadMessages(selectedId); }, [selectedId, loadMessages]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // Muat ulang pesan berkala selama halaman terbuka (tanpa websocket).
  useEffect(() => {
    if (!selectedId) return undefined;
    const id = setInterval(() => loadMessages(selectedId), 15000);
    return () => clearInterval(id);
  }, [selectedId, loadMessages]);

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim() || !selectedId) return;
    try {
      await api('', { action: 'send', conversation_id: selectedId, message_text: text.trim() });
      setText('');
      await loadMessages(selectedId);
      loadConversations(selectedId);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const start = async (e) => {
    e.preventDefault();
    try {
      const d = await api('', { action: 'start', recipient: recipient.trim(), message_text: firstMessage.trim() });
      setRecipient(''); setFirstMessage(''); setStarting(false);
      await loadConversations(d.conversation_id);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const leave = async () => {
    if (!selectedId || !window.confirm(t('community.messages.leave_confirm'))) return;
    try {
      await api('', { action: 'archive', conversation_id: selectedId });
      setSelectedId(null);
      loadConversations();
    } catch (err) { toast.error(err.message); }
  };

  const selected = conversations.find(c => c.id === selectedId);
  const visible = conversations.filter(c => (c.name || '').toLowerCase().includes(search.toLowerCase()));

  return (
    <main className="pt-[68px] pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      <nav className="flex items-center gap-2 text-[15px] text-gray-600 mb-6">
        <Link to="/" className="hover:text-indigo-600">{t('community.home')}</Link>
        <span className="text-gray-400">/</span>
        <span className="text-gray-900 font-medium">{t('community.messages.title')}</span>
      </nav>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('community.messages.title')}</h1>
        <button type="button" onClick={() => setStarting(s => !s)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-[15px] font-medium hover:bg-indigo-700">
          {t('community.messages.new')}
        </button>
      </div>

      {starting && (
        <form onSubmit={start} className="mb-6 bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-3">
          <input value={recipient} onChange={e => setRecipient(e.target.value)} required
            placeholder={t('community.messages.recipient_ph')}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-[15px]" />
          <textarea value={firstMessage} onChange={e => setFirstMessage(e.target.value)} required rows={3} maxLength={4000}
            placeholder={t('community.messages.first_ph')}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-[15px]" />
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-[15px] font-medium hover:bg-indigo-700">{t('community.messages.send')}</button>
            <button type="button" onClick={() => setStarting(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-[15px]">{t('common.cancel')}</button>
          </div>
        </form>
      )}

      {error && <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-[15px] text-red-700">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 min-h-[520px]">
        <aside className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-3 border-b border-gray-100">
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('community.messages.search_ph')}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[15px]" />
          </div>
          <ul className="flex-1 overflow-y-auto divide-y divide-gray-100">
            {loading && <li className="p-4 text-gray-500 text-[15px]">{t('common.loading')}</li>}
            {!loading && visible.length === 0 && <li className="p-4 text-gray-500 text-[15px]">{t('community.messages.empty')}</li>}
            {visible.map(c => (
              <li key={c.id}>
                <button type="button" onClick={() => setSelectedId(c.id)}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 ${c.id === selectedId ? 'bg-indigo-50' : ''}`}>
                  <div className="flex justify-between gap-2">
                    <span className="font-medium text-gray-900 truncate">{c.name || '—'}</span>
                    {c.unread > 0 && <span className="shrink-0 bg-indigo-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">{c.unread}</span>}
                  </div>
                  <p className="text-sm text-gray-500 truncate">{c.last_message || '—'}</p>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <section className="md:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col">
          {selected ? (
            <>
              <header className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{selected.name}</p>
                  {selected.participants?.[0]?.orcid && (
                    <Link to={`/orcid/${selected.participants[0].orcid}`} className="text-sm text-indigo-600 hover:underline">{selected.participants[0].orcid}</Link>
                  )}
                </div>
                <button type="button" onClick={leave} className="text-sm text-gray-500 hover:text-red-600">{t('community.messages.leave')}</button>
              </header>
              <div className="flex-1 overflow-y-auto p-5 space-y-3 max-h-[480px]">
                {messages.map(m => (
                  <div key={m.id} className={`flex ${m.is_mine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${m.is_mine ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-900'}`}>
                      {!m.is_mine && <p className="text-xs font-semibold mb-0.5">{m.sender_name}</p>}
                      <p className="text-[15px] whitespace-pre-wrap break-words">{m.message_text}</p>
                      <p className={`text-[11px] mt-1 ${m.is_mine ? 'text-indigo-100' : 'text-gray-500'}`}>{fmtTime(m.created_at)}</p>
                    </div>
                  </div>
                ))}
                <div ref={endRef} />
              </div>
              <form onSubmit={send} className="p-3 border-t border-gray-100 flex gap-2">
                <input value={text} onChange={e => setText(e.target.value)} maxLength={4000}
                  placeholder={t('community.messages.type_ph')}
                  className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-[15px]" />
                <button type="submit" disabled={!text.trim()}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-[15px] font-medium hover:bg-indigo-700 disabled:opacity-50">
                  {t('community.messages.send')}
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-8 text-center text-gray-500 text-[15px]">
              {t('community.messages.pick', { name: user?.name || '' })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
};

export default Messages;

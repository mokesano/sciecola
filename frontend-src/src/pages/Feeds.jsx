import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

/**
 * Feed komunitas (GET/POST /api/feeds.php): kiriman, suka, komentar.
 * Versi lama berisi grup, acara, undangan, dan pengguna aktif contoh, dan menampilkan
 * kiriman contoh bila API gagal; tombol "Buat Kiriman" tidak melakukan apa pun.
 */
const api = async (query = '', body = null) => {
  const res = await fetch(`/api/feeds.php${query}`, body ? {
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

const initials = (name) => (name || '?').split(/\s+/).map(n => n[0]).join('').slice(0, 2).toUpperCase();

function PostCard({ post, user, t, onChanged }) {
  const [open, setOpen] = useState(false);
  const [comments, setComments] = useState([]);
  const [comment, setComment] = useState('');
  const [liked, setLiked] = useState(post.liked_by_me);
  const [likes, setLikes] = useState(post.likes_count);

  const loadComments = async () => {
    try { setComments((await api(`?action=get&id=${post.id}`)).comments); } catch (e) { toast.error(e.message); }
  };
  const toggle = () => { if (!open) loadComments(); setOpen(o => !o); };
  const like = async () => {
    if (!user) { toast(t('community.feeds.login_to_interact')); return; }
    try { const d = await api('', { action: 'like', post_id: post.id }); setLiked(d.liked); setLikes(d.likes_count); }
    catch (e) { toast.error(e.message); }
  };
  const addComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    try { await api('', { action: 'comment', post_id: post.id, comment_text: comment.trim() }); setComment(''); loadComments(); onChanged(); }
    catch (err) { toast.error(err.message); }
  };
  const remove = async () => {
    if (!window.confirm(t('community.feeds.delete_confirm'))) return;
    try { await api('', { action: 'delete', post_id: post.id }); onChanged(); } catch (e) { toast.error(e.message); }
  };
  const removeComment = async (id) => {
    try { await api('', { action: 'delete_comment', comment_id: id }); loadComments(); onChanged(); } catch (e) { toast.error(e.message); }
  };

  return (
    <article className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <header className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center">{initials(post.author_name)}</div>
          <div>
            {post.author_orcid
              ? <Link to={`/orcid/${post.author_orcid}`} className="font-semibold text-gray-900 hover:underline">{post.author_name}</Link>
              : <p className="font-semibold text-gray-900">{post.author_name}</p>}
            <p className="text-sm text-gray-500">
              {fmtTime(post.created_at)} · {post.visibility === 'registered' ? t('community.feeds.vis_registered') : t('community.feeds.vis_public')}
              {post.is_pinned && ` · ${t('community.feeds.pinned')}`}
            </p>
          </div>
        </div>
        {post.can_delete && <button type="button" onClick={remove} className="text-sm text-gray-400 hover:text-red-600">{t('community.feeds.delete')}</button>}
      </header>
      {post.title && <h3 className="mt-3 font-semibold text-gray-900">{post.title}</h3>}
      <p className="mt-2 text-[15px] text-gray-800 whitespace-pre-wrap break-words">{post.content}</p>
      <footer className="mt-4 flex items-center gap-4 text-[15px] text-gray-600">
        <button type="button" onClick={like} className={`hover:text-indigo-600 ${liked ? 'text-indigo-600 font-semibold' : ''}`}>
          {liked ? '♥' : '♡'} {likes}
        </button>
        <button type="button" onClick={toggle} className="hover:text-indigo-600">💬 {post.comments_count}</button>
      </footer>
      {open && (
        <div className="mt-4 border-t border-gray-100 pt-4 space-y-3">
          {comments.map(c => (
            <div key={c.id} className="text-[15px]">
              <span className="font-semibold text-gray-900">{c.author_name}</span>{' '}
              <span className="text-gray-800 whitespace-pre-wrap">{c.comment_text}</span>
              <span className="text-xs text-gray-400 ml-2">{fmtTime(c.created_at)}</span>
              {c.can_delete && <button type="button" onClick={() => removeComment(c.id)} className="text-xs text-gray-400 hover:text-red-600 ml-2">{t('community.feeds.delete')}</button>}
            </div>
          ))}
          {comments.length === 0 && <p className="text-sm text-gray-500">{t('community.feeds.no_comments')}</p>}
          {user && (
            <form onSubmit={addComment} className="flex gap-2">
              <input value={comment} onChange={e => setComment(e.target.value)} maxLength={2000} placeholder={t('community.feeds.comment_ph')}
                className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[15px]" />
              <button type="submit" className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-[15px]">{t('community.feeds.comment')}</button>
            </form>
          )}
        </div>
      )}
    </article>
  );
}

const Feeds = () => {
  const { t } = useTranslation('account');
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState('public');
  const [posting, setPosting] = useState(false);

  const load = useCallback(async () => {
    try { setPosts((await api('?action=list&limit=30')).posts); setError(''); }
    catch (e) { setError(e.message); setPosts([]); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const publish = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setPosting(true);
    try { await api('', { action: 'create', content: content.trim(), visibility }); setContent(''); load(); }
    catch (err) { toast.error(err.message); }
    finally { setPosting(false); }
  };

  return (
    <main className="pt-[68px] pb-12 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto w-full">
      <h1 className="text-2xl font-bold text-gray-900 mt-6 mb-6">{t('community.feeds.title')}</h1>

      {user ? (
        <form onSubmit={publish} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-6 space-y-3">
          <textarea value={content} onChange={e => setContent(e.target.value)} rows={3} maxLength={5000}
            placeholder={t('community.feeds.compose_ph', { name: user.name || '' })}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-[15px]" />
          <div className="flex items-center justify-between gap-3">
            <select value={visibility} onChange={e => setVisibility(e.target.value)} className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[15px]">
              <option value="public">{t('community.feeds.vis_public')}</option>
              <option value="registered">{t('community.feeds.vis_registered')}</option>
            </select>
            <button type="submit" disabled={posting || !content.trim()}
              className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-[15px] font-medium hover:bg-indigo-700 disabled:opacity-50">
              {t('community.feeds.publish')}
            </button>
          </div>
        </form>
      ) : (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-6 text-[15px] text-indigo-800">
          {t('community.feeds.login_to_post')} <Link to="/login?next=/feeds" className="font-semibold underline">{t('community.feeds.login')}</Link>
        </div>
      )}

      {error && <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-[15px] text-red-700">{error}</div>}
      {loading && <p className="text-gray-500 text-[15px]">{t('common.loading')}</p>}
      {!loading && !error && posts.length === 0 && <p className="text-gray-500 text-[15px]">{t('community.feeds.empty')}</p>}

      <div className="space-y-4">
        {posts.map(p => <PostCard key={p.id} post={p} user={user} t={t} onChanged={load} />)}
      </div>
    </main>
  );
};

export default Feeds;

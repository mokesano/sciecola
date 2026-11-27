import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { FolderOpen, Users, Calendar, CheckCircle, Clock, AlertCircle, Plus,
  Search, Filter, Edit2, Trash2, Share2, Download, MessageSquare,
  FileText, BarChart3, Eye, Zap, Target, X, UserPlus, Flag,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import InitialsAvatar from '../components/shared/InitialsAvatar';

/**
 * Proyek Bersama — data dari /api/projects.php.
 * Semua tombol berfungsi: buat proyek, detail, ubah, anggota, tonggak, hubungi pemimpin,
 * salin tautan, filter, dan ekspor CSV. Tidak ada data contoh.
 */

const STATUSES = ['planning', 'active', 'paused', 'completed', 'cancelled'];
const SDG_HEX = {
  1: '#e5243b', 2: '#dda63a', 3: '#4c9f38', 4: '#c5192d', 5: '#ff3a21', 6: '#26bde2', 7: '#fcc30b', 8: '#a21942',
  9: '#fd6925', 10: '#dd1367', 11: '#fd9d24', 12: '#bf8b2e', 13: '#3f7e44', 14: '#0a97d9', 15: '#56c02b', 16: '#00689d', 17: '#19486a',
};

async function api(query = '', body = null) {
  const res = await fetch(`/api/projects.php${query}`, body ? {
    method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  } : { credentials: 'same-origin' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.status !== 'success') {
    const err = new Error(data.message || `HTTP ${res.status}`);
    err.status = res.status;
    err.serverMessage = Boolean(data.message);
    throw err;
  }
  return data;
}

const fmtNum = (v, locale) => (v === null || v === undefined ? '—' : Number(v).toLocaleString(locale, { maximumFractionDigits: 0 }));
const fmtDate = (v, locale) => (v ? new Date(`${v}T00:00:00`).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' }) : '—');

function Modal({ title, onClose, children, wide = false }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-20" onMouseDown={onClose}>
      <div className={`w-full ${wide ? 'max-w-3xl' : 'max-w-xl'} rounded-2xl bg-white shadow-2xl`} onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700" aria-label="Tutup">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

const Field = ({ label, children, hint }) => (
  <label className="block">
    <span className="mb-1 block text-sm font-medium text-gray-700">{label}</span>
    {children}
    {hint && <span className="mt-1 block text-xs text-gray-500">{hint}</span>}
  </label>
);
const inputCls = 'w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-[15px] focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 outline-none';

function SdgPicker({ value, onChange }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {Array.from({ length: 17 }, (_, i) => i + 1).map((n) => {
        const on = value.includes(n);
        return (
          <button key={n} type="button" onClick={() => onChange(on ? value.filter((x) => x !== n) : [...value, n].sort((a, b) => a - b))}
            className={`h-8 w-8 rounded-full text-sm font-bold transition ${on ? 'text-white ring-2 ring-offset-1 ring-gray-300' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
            style={on ? { backgroundColor: SDG_HEX[n] } : undefined} title={`SDG ${n}`}>
            {n}
          </button>
        );
      })}
    </div>
  );
}

/** Form buat / ubah proyek. */
function ProjectForm({ initial, onSubmit, submitting, t }) {
  const [f, setF] = useState(() => ({
    title: initial?.title || '', description: initial?.description || '', status: initial?.status || 'planning',
    visibility: initial?.visibility || 'public', start_date: initial?.start_date || '', end_date: initial?.end_date || '',
    budget: initial?.budget ?? '', spent: initial?.spent ?? '', progress: initial?.progress ?? 0, sdg_focus: initial?.sdg_focus || [],
  }));
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));
  const editing = Boolean(initial);
  return (
    <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); onSubmit(f); }}>
      <Field label={t('form.title')}><input className={inputCls} value={f.title} onChange={set('title')} required minLength={5} maxLength={255} /></Field>
      <Field label={t('form.description')}><textarea className={inputCls} rows={4} value={f.description} onChange={set('description')} maxLength={20000} /></Field>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label={t('form.status')}>
          <select className={inputCls} value={f.status} onChange={set('status')}>
            {STATUSES.map((s) => <option key={s} value={s}>{t(`status.${s}`)}</option>)}
          </select>
        </Field>
        <Field label={t('form.visibility')} hint={t(`form.visibility_hint.${f.visibility}`)}>
          <select className={inputCls} value={f.visibility} onChange={set('visibility')}>
            {['public', 'private'].map((v) => <option key={v} value={v}>{t(`visibility.${v}`)}</option>)}
          </select>
        </Field>
        <Field label={t('form.start_date')}><input type="date" className={inputCls} value={f.start_date || ''} onChange={set('start_date')} /></Field>
        <Field label={t('form.end_date')}><input type="date" className={inputCls} value={f.end_date || ''} onChange={set('end_date')} min={f.start_date || undefined} /></Field>
        <Field label={t('form.budget')}><input type="number" min="0" step="any" className={inputCls} value={f.budget} onChange={set('budget')} /></Field>
        {editing && <Field label={t('form.spent')}><input type="number" min="0" step="any" className={inputCls} value={f.spent} onChange={set('spent')} /></Field>}
      </div>
      {editing && (
        <Field label={`${t('form.progress')}: ${f.progress}%`}>
          <input type="range" min="0" max="100" step="5" value={f.progress} onChange={set('progress')} className="w-full accent-indigo-600" />
        </Field>
      )}
      <Field label={t('form.sdg')}><SdgPicker value={f.sdg_focus} onChange={(v) => setF((x) => ({ ...x, sdg_focus: v }))} /></Field>
      <div className="flex justify-end gap-2 pt-2">
        <button type="submit" disabled={submitting} className="rounded-lg bg-indigo-600 px-5 py-2 text-[15px] font-medium text-white hover:bg-indigo-700 disabled:opacity-60">
          {submitting ? t('common.saving') : editing ? t('common.save') : t('form.create')}
        </button>
      </div>
    </form>
  );
}

/** Detail proyek: ringkasan, anggota, tonggak, pengaturan. */
function ProjectDetail({ id, initialTab, onClose, onChanged, t, locale }) {
  const navigate = useNavigate();
  const [p, setP] = useState(null);
  const [tab, setTab] = useState(initialTab || 'overview');
  const [busy, setBusy] = useState(false);
  const [member, setMember] = useState({ orcid: '', role: '' });
  const [milestone, setMilestone] = useState({ title: '', target_date: '' });

  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const load = useCallback(async () => {
    try { setP((await api(`?action=get&id=${id}`)).project); }
    catch (e) { toast.error(e.message); closeRef.current(); }
  }, [id]);
  useEffect(() => { load(); }, [load]);

  const run = async (body, okMsg) => {
    setBusy(true);
    try { await api('', body); if (okMsg) toast.success(okMsg); await load(); onChanged(); return true; }
    catch (e) { toast.error(e.message); return false; }
    finally { setBusy(false); }
  };

  if (!p) return <Modal title={t('detail.loading')} onClose={onClose}><p className="text-gray-500">{t('detail.loading')}</p></Modal>;

  const lead = p.my_role === 'lead';
  const member_ = p.my_role === 'member';
  const tabs = ['overview', 'members', 'milestones', ...(lead ? ['settings'] : [])];

  return (
    <Modal title={p.title} onClose={onClose} wide>
      <div className="mb-4 flex flex-wrap gap-2 border-b border-gray-100 pb-3">
        {tabs.map((k) => (
          <button key={k} type="button" onClick={() => setTab(k)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${tab === k ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
            {t(`detail.tabs.${k}`)}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="space-y-4 text-[15px]">
          <p className="whitespace-pre-wrap text-gray-700">{p.description || t('detail.no_description')}</p>
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[
              ['status', t(`status.${p.status}`)],
              ['visibility', t(`visibility.${p.visibility}`)],
              ['period', `${fmtDate(p.start_date, locale)} – ${fmtDate(p.end_date, locale)}`],
              ['lead', p.lead_name || p.lead_orcid],
              ['budget', `${fmtNum(p.spent, locale)} / ${fmtNum(p.budget, locale)}`],
              ['progress', `${p.progress}%`],
            ].map(([k, v]) => (
              <div key={k} className="rounded-lg bg-gray-50 p-3">
                <dt className="text-xs text-gray-500">{t(`detail.fields.${k}`)}</dt>
                <dd className="font-medium text-gray-900">{v}</dd>
              </div>
            ))}
          </dl>
          {p.sdg_focus.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {p.sdg_focus.map((n) => (
                <span key={n} className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white" style={{ backgroundColor: SDG_HEX[n] }}>{n}</span>
              ))}
            </div>
          )}
          {p.publication_list?.length > 0 && (
            <div>
              <h3 className="mb-2 font-semibold text-gray-900">{t('detail.publications')}</h3>
              <ul className="space-y-1">
                {p.publication_list.map((x) => (
                  <li key={x.doi}><button type="button" className="text-left text-indigo-600 hover:underline" onClick={() => navigate(`/doi/${encodeURIComponent(x.doi)}`)}>{x.title || x.doi}</button></li>
                ))}
              </ul>
            </div>
          )}
          <div className="flex flex-wrap gap-2 pt-2">
            {!lead && p.lead_orcid && (
              <button type="button" onClick={() => navigate(`/messages?to=${encodeURIComponent(p.lead_orcid)}`)}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700">
                <MessageSquare className="h-4 w-4" /> {t('detail.contact_lead')}
              </button>
            )}
            {p.lead_orcid && (
              <button type="button" onClick={() => navigate(`/orcid/${p.lead_orcid}`)} className="rounded-lg border border-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-50">
                {t('detail.lead_profile')}
              </button>
            )}
          </div>
        </div>
      )}

      {tab === 'members' && (
        <div className="space-y-4">
          <ul className="divide-y divide-gray-100">
            <li className="flex items-center gap-3 py-2">
              <InitialsAvatar name={p.lead_name || p.lead_orcid} seed={p.lead_orcid} className="h-9 w-9 rounded-full" textClassName="text-sm" />
              <div className="flex-1"><p className="font-medium text-gray-900">{p.lead_name || p.lead_orcid}</p><p className="text-xs text-gray-500">{t('detail.lead_role')}</p></div>
            </li>
            {p.members.map((m) => (
              <li key={m.orcid} className="flex items-center gap-3 py-2">
                <InitialsAvatar name={m.name} seed={m.orcid} className="h-9 w-9 rounded-full" textClassName="text-sm" />
                <div className="flex-1">
                  <button type="button" onClick={() => navigate(`/orcid/${m.orcid}`)} className="font-medium text-gray-900 hover:text-indigo-600">{m.name}</button>
                  <p className="text-xs text-gray-500">{m.role} · {m.orcid}</p>
                </div>
                {(lead || (member_ && m.is_me)) && (
                  <button type="button" disabled={busy} onClick={() => window.confirm(t('detail.confirm_remove_member')) && run({ action: 'remove_member', project_id: p.id, orcid: m.orcid }, t('toast.member_removed'))}
                    className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600" title={t('detail.remove')}><Trash2 className="h-4 w-4" /></button>
                )}
              </li>
            ))}
          </ul>
          {p.members.length === 0 && <p className="text-sm text-gray-500">{t('detail.no_members')}</p>}
          {lead ? (
            <form className="grid grid-cols-1 gap-2 rounded-xl bg-gray-50 p-4 sm:grid-cols-[1fr_1fr_auto]"
              onSubmit={async (e) => { e.preventDefault(); if (await run({ action: 'add_member', project_id: p.id, ...member }, t('toast.member_added'))) setMember({ orcid: '', role: '' }); }}>
              <input className={inputCls} placeholder="0000-0000-0000-0000" value={member.orcid} onChange={(e) => setMember((x) => ({ ...x, orcid: e.target.value }))} required />
              <input className={inputCls} placeholder={t('detail.role_ph')} value={member.role} onChange={(e) => setMember((x) => ({ ...x, role: e.target.value }))} maxLength={100} />
              <button type="submit" disabled={busy} className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-60">
                <UserPlus className="h-4 w-4" /> {t('detail.add_member')}
              </button>
              <p className="text-xs text-gray-500 sm:col-span-3">{t('detail.member_hint')}</p>
            </form>
          ) : member_ ? (
            <button type="button" disabled={busy} onClick={() => window.confirm(t('detail.confirm_leave')) && run({ action: 'remove_member', project_id: p.id, orcid: p.members.find((x) => x.is_me)?.orcid || '' }, t('toast.left'))}
              className="rounded-lg border border-red-200 px-4 py-2 text-sm text-red-600 hover:bg-red-50">{t('detail.leave')}</button>
          ) : null}
        </div>
      )}

      {tab === 'milestones' && (
        <div className="space-y-4">
          {p.milestones.length === 0 && <p className="text-sm text-gray-500">{t('detail.no_milestones')}</p>}
          <ul className="space-y-2">
            {p.milestones.map((m) => (
              <li key={m.id} className="flex items-start gap-3 rounded-lg border border-gray-100 p-3">
                <input type="checkbox" className="mt-1 h-4 w-4 accent-indigo-600" checked={m.status === 'completed'} disabled={busy || !(lead || member_)}
                  onChange={() => run({ action: 'milestone_status', id: m.id, status: m.status === 'completed' ? 'in-progress' : 'completed' })} />
                <div className="flex-1">
                  <p className={`font-medium ${m.status === 'completed' ? 'text-gray-400 line-through' : 'text-gray-900'}`}>{m.title}</p>
                  <p className={`text-xs ${m.status === 'overdue' ? 'text-red-600' : 'text-gray-500'}`}>
                    {t('detail.target')}: {fmtDate(m.target_date, locale)} · {t(`milestone.${m.status}`)}
                  </p>
                </div>
                {lead && (
                  <button type="button" disabled={busy} onClick={() => window.confirm(t('detail.confirm_delete_milestone')) && run({ action: 'delete_milestone', id: m.id })}
                    className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                )}
              </li>
            ))}
          </ul>
          {(lead || member_) && (
            <form className="grid grid-cols-1 gap-2 rounded-xl bg-gray-50 p-4 sm:grid-cols-[1fr_auto_auto]"
              onSubmit={async (e) => { e.preventDefault(); if (await run({ action: 'add_milestone', project_id: p.id, ...milestone }, t('toast.milestone_added'))) setMilestone({ title: '', target_date: '' }); }}>
              <input className={inputCls} placeholder={t('detail.milestone_ph')} value={milestone.title} onChange={(e) => setMilestone((x) => ({ ...x, title: e.target.value }))} required maxLength={255} />
              <input type="date" className={inputCls} value={milestone.target_date} onChange={(e) => setMilestone((x) => ({ ...x, target_date: e.target.value }))} required />
              <button type="submit" disabled={busy} className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-60">
                <Flag className="h-4 w-4" /> {t('detail.add_milestone')}
              </button>
            </form>
          )}
        </div>
      )}

      {tab === 'settings' && lead && (
        <div className="space-y-6">
          <ProjectForm initial={p} t={t} submitting={busy}
            onSubmit={(f) => run({ action: 'update', id: p.id, ...f }, t('toast.saved'))} />
          <div className="rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="mb-2 text-sm text-red-800">{t('detail.delete_warning')}</p>
            <button type="button" disabled={busy}
              onClick={async () => { if (window.confirm(t('detail.confirm_delete'))) { if (await run({ action: 'delete', id: p.id }, t('toast.deleted'))) onClose(); } }}
              className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700">
              <Trash2 className="h-4 w-4" /> {t('detail.delete')}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

const ProjectManagement = () => {
  const { t, i18n } = useTranslation('project_management');
  const locale = i18n.language === 'id' ? 'id-ID' : 'en-US';
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);   // { status, message } bila daftar gagal dimuat
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ mine: false, sdg: '', sort: 'updated' });
  const [creating, setCreating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [detail, setDetail] = useState(null);        // { id, tab }
  const [picker, setPicker] = useState(null);        // tab tujuan setelah memilih proyek

  // Kegagalan memuat daftar ditampilkan di tempat (dengan tombol coba lagi), bukan toast
  // berulang. 502/503/504 berarti server PHP/proxy tidak menjawab — bukan kesalahan data.
  const fetchProjects = useCallback(async () => {
    try {
      setProjects((await api('?action=list')).projects || []);
      setLoadError(null);
    } catch (e) {
      setProjects([]);
      setLoadError({ status: e.status || 0, message: e.serverMessage ? e.message : '' });
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  // Tautan langsung: /projects?project=12 (dari notifikasi / tombol salin tautan).
  useEffect(() => {
    const id = Number(new URLSearchParams(location.search).get('project'));
    if (id) setDetail({ id, tab: 'overview' });
  }, [location.search]);

  const requireOrcid = () => {
    if (!user) { navigate(`/login?next=${encodeURIComponent('/projects')}`); return false; }
    if (!user.orcid) { toast(t('toast.need_orcid')); navigate('/settings'); return false; }
    return true;
  };

  const createProject = async (f) => {
    setSubmitting(true);
    try {
      const d = await api('', { action: 'create', ...f });
      toast.success(t('toast.created'));
      setCreating(false);
      await fetchProjects();
      setDetail({ id: d.project_id, tab: 'members' });
    } catch (e) { toast.error(e.message); }
    finally { setSubmitting(false); }
  };

  const copyLink = async (p) => {
    const url = `${window.location.origin}/#/projects?project=${p.id}`;
    try {
      if (navigator.share) await navigator.share({ title: p.title, url });
      else { await navigator.clipboard.writeText(url); toast.success(t('toast.link_copied')); }
    } catch { /* dibatalkan */ }
  };

  const stats = useMemo(() => ({
    total: projects.length,
    active: projects.filter((p) => p.status === 'active').length,
    planning: projects.filter((p) => p.status === 'planning').length,
    completed: projects.filter((p) => p.status === 'completed').length,
    totalBudget: projects.reduce((s, p) => s + (p.budget || 0), 0),
    totalPublications: projects.reduce((s, p) => s + (p.publications || 0), 0),
  }), [projects]);

  const myProjects = projects.filter((p) => p.can_edit);

  const filteredProjects = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    const list = projects.filter((p) => {
      if (q && !(`${p.title} ${p.description}`.toLowerCase().includes(q))) return false;
      if (activeTab !== 'all' && p.status !== activeTab) return false;
      if (filters.mine && !(p.can_edit || p.is_member)) return false;
      if (filters.sdg && !p.sdg_focus.includes(Number(filters.sdg))) return false;
      return true;
    });
    const by = {
      updated: (a, b) => String(b.updated_at || '').localeCompare(String(a.updated_at || '')),
      progress: (a, b) => b.progress - a.progress,
      end: (a, b) => String(a.end_date || '9999').localeCompare(String(b.end_date || '9999')),
      title: (a, b) => a.title.localeCompare(b.title),
    };
    return [...list].sort(by[filters.sort] || by.updated);
  }, [projects, searchTerm, activeTab, filters]);

  const exportCsv = (list = filteredProjects, name = 'proyek') => {
    if (!list.length) { toast(t('toast.nothing_to_export')); return; }
    const cols = ['id', 'title', 'status', 'progress', 'start_date', 'end_date', 'lead_name', 'lead_orcid', 'collaborators',
      'milestones_done', 'milestones_total', 'publications', 'budget', 'spent', 'sdg_focus', 'visibility', 'updated_at'];
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const rows = list.map((p) => cols.map((c) => esc(c === 'sdg_focus' ? p.sdg_focus.join(' ') : p[c])).join(','));
    const blob = new Blob([`﻿${cols.join(',')}\n${rows.join('\n')}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /* Ikon dan warna tetap di kode; judul dan keterangannya dari locale. */
  const quickText = t('quick.items', { returnObjects: true });
  const quickActions = [
    { icon: Plus,      color: 'from-blue-500 to-indigo-600', run: () => requireOrcid() && setCreating(true) },
    { icon: Users,     color: 'from-green-500 to-emerald-600', run: () => requireOrcid() && setPicker('members') },
    { icon: BarChart3, color: 'from-purple-500 to-pink-600', run: () => requireOrcid() && exportCsv(projects.filter((p) => p.can_edit || p.is_member), 'laporan-proyek-saya') },
    { icon: Target,    color: 'from-orange-500 to-red-600', run: () => requireOrcid() && setPicker('milestones') },
  ].map((card, i) => ({
    ...card,
    title: Array.isArray(quickText) ? quickText[i]?.title ?? '' : '',
    desc:  Array.isArray(quickText) ? quickText[i]?.desc  ?? '' : '',
  }));

  const getStatusColor = (status) => ({
    active: 'bg-green-100 text-green-700 border-green-200',
    planning: 'bg-blue-100 text-blue-700 border-blue-200',
    completed: 'bg-gray-100 text-gray-700 border-gray-200',
    paused: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    cancelled: 'bg-red-100 text-red-700 border-red-200',
  }[status] || 'bg-gray-100 text-gray-700 border-gray-200');
  const getStatusIcon = (status) => ({ active: Zap, planning: Clock, completed: CheckCircle, paused: AlertCircle, cancelled: X }[status] || Clock);

  const stop = (fn) => (e) => { e.stopPropagation(); fn(); };

  return (
    <main className="min-h-screen pt-[60px] bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">

      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white py-28 overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="container px-8 max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col gap-6 md:flex-row justify-between md:items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-4">
                <FolderOpen className="w-5 h-5" />
                <span className="text-[15px] font-medium">{t('hero.badge')}</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">{t('hero.title')}</h1>
              <p className="text-xl text-white/90 max-w-2xl">{t('hero.subtitle')}</p>
            </div>
            <button
              type="button"
              onClick={() => requireOrcid() && setCreating(true)}
              className="self-start md:self-auto bg-white text-indigo-600 px-6 py-3 rounded-xl font-semibold hover:bg-white/90 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              {t('hero.new_project')}
            </button>
          </div>
        </div>
      </section>

      {/* Stats Overview */}
      <section className="py-8">
        <div className="container px-8 max-w-7xl mx-auto relative z-10">
          <div className="bg-white rounded-2xl shadow-xl p-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { label: t('stats.total'), value: stats.total, icon: FolderOpen, color: 'from-blue-500 to-indigo-600' },
              { label: t('stats.active'), value: stats.active, icon: Zap, color: 'from-green-500 to-emerald-600' },
              { label: t('stats.planning'), value: stats.planning, icon: Clock, color: 'from-orange-500 to-red-600' },
              { label: t('stats.completed'), value: stats.completed, icon: CheckCircle, color: 'from-purple-500 to-pink-600' },
              { label: t('stats.budget'), value: stats.totalBudget ? Number(stats.totalBudget).toLocaleString(locale, { notation: 'compact', maximumFractionDigits: 1 }) : '—', icon: BarChart3, color: 'from-cyan-500 to-blue-600' },
              { label: t('stats.publications'), value: stats.totalPublications, icon: FileText, color: 'from-yellow-500 to-orange-600' },
            ].map((stat, index) => (
              <div key={index} className="text-center group">
                <div className={`inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl mb-3 group-hover:scale-110 transition-transform duration-300`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</div>
                <div className="text-[15px] text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tabs & Search */}
      <section className="py-6">
        <div className="container px-8 max-w-7xl mx-auto relative z-10">
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex gap-2 overflow-x-auto pb-2">
                {[
                  { id: 'all', label: t('tabs.all'), count: stats.total },
                  { id: 'active', label: t('tabs.active'), count: stats.active },
                  { id: 'planning', label: t('tabs.planning'), count: stats.planning },
                  { id: 'completed', label: t('tabs.completed'), count: stats.completed },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap flex items-center gap-2 ${
                      activeTab === tab.id ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {tab.label}
                    <span className={`text-sm px-2 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-white/20' : 'bg-gray-200'}`}>{tab.count}</span>
                  </button>
                ))}
              </div>

              <div className="flex gap-2 w-full md:w-auto">
                <div className="relative flex-1 md:w-80">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder={t('filter.search_placeholder')}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <button type="button" onClick={() => setShowFilters((v) => !v)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${showFilters || filters.mine || filters.sdg ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                  <Filter className="w-4 h-4" />
                  {t('filter.filters')}
                </button>
                <button type="button" onClick={() => exportCsv()} className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all">
                  <Download className="w-4 h-4" />
                  {t('filter.export')}
                </button>
              </div>
            </div>

            {showFilters && (
              <div className="mt-4 grid grid-cols-1 gap-3 border-t border-gray-100 pt-4 sm:grid-cols-3">
                <label className="flex items-center gap-2 text-[15px] text-gray-700">
                  <input type="checkbox" className="h-4 w-4 accent-indigo-600" checked={filters.mine}
                    onChange={() => (user ? setFilters((f) => ({ ...f, mine: !f.mine })) : requireOrcid())} />
                  {t('filter.mine')}
                </label>
                <select className={inputCls} value={filters.sdg} onChange={(e) => setFilters((f) => ({ ...f, sdg: e.target.value }))}>
                  <option value="">{t('filter.all_sdgs')}</option>
                  {Array.from({ length: 17 }, (_, i) => i + 1).map((n) => <option key={n} value={n}>SDG {n}</option>)}
                </select>
                <select className={inputCls} value={filters.sort} onChange={(e) => setFilters((f) => ({ ...f, sort: e.target.value }))}>
                  {['updated', 'progress', 'end', 'title'].map((s) => <option key={s} value={s}>{t(`filter.sort.${s}`)}</option>)}
                </select>
              </div>
            )}
          </div>

          {/* Projects List */}
          <div className="space-y-4">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="w-12 h-12 border-4 border-gray-200 border-t-indigo-600 rounded-full animate-spin"></div>
              </div>
            ) : loadError ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
                <AlertCircle className="mx-auto mb-2 h-8 w-8 text-red-500" />
                <p className="font-semibold text-red-800">{t('list.load_error_title')}</p>
                <p className="mt-1 text-sm text-red-700">
                  {loadError.message || ([502, 503, 504].includes(loadError.status) || loadError.status === 0
                    ? t('list.load_error_gateway', { status: loadError.status || '—' })
                    : t('list.load_error_generic', { status: loadError.status }))}
                </p>
                <button type="button" onClick={() => { setLoading(true); fetchProjects(); }}
                  className="mt-4 rounded-lg bg-red-600 px-5 py-2 text-white hover:bg-red-700">{t('list.retry')}</button>
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600">{projects.length ? t('list.empty') : t('list.none')}</p>
                {!projects.length && (
                  <button type="button" onClick={() => requireOrcid() && setCreating(true)} className="mt-4 rounded-lg bg-indigo-600 px-5 py-2 text-white hover:bg-indigo-700">
                    {t('hero.new_project')}
                  </button>
                )}
              </div>
            ) : (filteredProjects.map((project) => {
              const StatusIcon = getStatusIcon(project.status);
              return (
                <div
                  key={project.id}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter') setDetail({ id: project.id, tab: 'overview' }); }}
                  className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 cursor-pointer group"
                  onClick={() => setDetail({ id: project.id, tab: 'overview' })}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{project.title}</h3>
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getStatusColor(project.status)} flex items-center gap-1`}>
                          <StatusIcon className="w-3 h-3" />
                          {t(`status.${project.status}`)}
                        </span>
                        {project.visibility !== 'public' && (
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{t(`visibility.${project.visibility}`)}</span>
                        )}
                        {project.can_edit && <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs text-indigo-700">{t('card.yours')}</span>}
                      </div>
                      <p className="text-gray-600 text-[15px] mb-3 line-clamp-2">{project.description}</p>

                      <div className="flex flex-wrap items-center gap-4 text-[15px] text-gray-500 mb-3">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {fmtDate(project.start_date, locale)} – {fmtDate(project.end_date, locale)}
                        </span>
                        <span className="flex items-center gap-1"><Users className="w-4 h-4" />{t('card.collaborators', { count: project.collaborators })}</span>
                        <span className="flex items-center gap-1"><Flag className="w-4 h-4" />{t('card.milestones', { done: project.milestones_done, total: project.milestones_total })}</span>
                        <span className="flex items-center gap-1"><FileText className="w-4 h-4" />{t('card.publications', { count: project.publications })}</span>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-4">
                        {project.sdg_focus.map((sdg) => (
                          <span key={sdg} className="w-8 h-8 rounded-full text-white text-sm font-bold flex items-center justify-center" style={{ backgroundColor: SDG_HEX[sdg] }} title={`SDG ${sdg}`}>{sdg}</span>
                        ))}
                      </div>
                    </div>

                    <button type="button" onClick={stop(() => copyLink(project))} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title={t('card.share')}>
                      <Share2 className="w-5 h-5 text-gray-400" />
                    </button>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-[15px] mb-2">
                      <span className="text-gray-600">{t('card.progress')}</span>
                      <span className="font-semibold text-indigo-600">{project.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full transition-all duration-500" style={{ width: `${project.progress}%` }}></div>
                    </div>
                  </div>

                  {/* Team & Budget */}
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="flex -space-x-2">
                        <InitialsAvatar name={project.lead_name || project.lead_orcid} seed={project.lead_orcid}
                          className="w-8 h-8 rounded-full border-2 border-white" textClassName="text-xs" alt={t('detail.lead_role')} />
                        {project.members.slice(0, 4).map((m) => (
                          <InitialsAvatar key={m.orcid} name={m.name} seed={m.orcid} className="w-8 h-8 rounded-full border-2 border-white" textClassName="text-xs" />
                        ))}
                      </div>
                      <span className="text-sm text-gray-500">{project.lead_name || project.lead_orcid}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-6">
                      {project.budget ? (
                        <div className="text-right">
                          <div className="text-[15px] text-gray-500">{t('card.budget_used')}</div>
                          <div className="font-semibold text-gray-900">{fmtNum(project.spent, locale)} / {fmtNum(project.budget, locale)}</div>
                        </div>
                      ) : null}
                      {project.institution && (
                        <div className="text-right">
                          <div className="text-[15px] text-gray-500">{t('card.institution')}</div>
                          <div className="font-semibold text-gray-900">{project.institution}</div>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <button type="button" onClick={stop(() => setDetail({ id: project.id, tab: 'overview' }))} className="p-2 hover:bg-indigo-50 rounded-lg transition-colors group/btn" title={t('card.view')}>
                          <Eye className="w-5 h-5 text-gray-400 group-hover/btn:text-indigo-600" />
                        </button>
                        {project.can_edit && (
                          <button type="button" onClick={stop(() => setDetail({ id: project.id, tab: 'settings' }))} className="p-2 hover:bg-indigo-50 rounded-lg transition-colors group/btn" title={t('card.edit')}>
                            <Edit2 className="w-5 h-5 text-gray-400 group-hover/btn:text-indigo-600" />
                          </button>
                        )}
                        {!project.can_edit && project.lead_orcid && (
                          <button type="button" onClick={stop(() => (user ? navigate(`/messages?to=${encodeURIComponent(project.lead_orcid)}`) : requireOrcid()))}
                            className="p-2 hover:bg-indigo-50 rounded-lg transition-colors group/btn" title={t('detail.contact_lead')}>
                            <MessageSquare className="w-5 h-5 text-gray-400 group-hover/btn:text-indigo-600" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-sm text-gray-400 mt-3 text-right">
                    {t('card.updated', { when: project.updated_at ? new Date(project.updated_at.replace(' ', 'T')).toLocaleDateString(locale) : t('card.recently') })}
                  </div>
                </div>
              );
            }))}
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="pt-20 pb-28 bg-white">
        <div className="container px-8 max-w-7xl mx-auto relative z-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">{t('quick.title')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map((action, index) => (
              <button
                key={index}
                type="button"
                onClick={action.run}
                className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 group text-left border border-gray-100"
              >
                <div className={`inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br ${action.color} rounded-xl mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <action.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{action.title}</h3>
                <p className="text-gray-600 text-[15px]">{action.desc}</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      {creating && (
        <Modal title={t('form.new_title')} onClose={() => setCreating(false)}>
          <ProjectForm t={t} submitting={submitting} onSubmit={createProject} />
        </Modal>
      )}

      {picker && (
        <Modal title={t('picker.title')} onClose={() => setPicker(null)}>
          {myProjects.length === 0 ? (
            <div className="text-center">
              <p className="mb-4 text-gray-600">{t('picker.empty')}</p>
              <button type="button" onClick={() => { setPicker(null); setCreating(true); }} className="rounded-lg bg-indigo-600 px-5 py-2 text-white hover:bg-indigo-700">{t('hero.new_project')}</button>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {myProjects.map((p) => (
                <li key={p.id}>
                  <button type="button" onClick={() => { setDetail({ id: p.id, tab: picker }); setPicker(null); }}
                    className="flex w-full items-center justify-between gap-3 py-3 text-left hover:text-indigo-600">
                    <span className="font-medium">{p.title}</span>
                    <span className="text-sm text-gray-500">{t(`status.${p.status}`)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Modal>
      )}

      {detail && (
        <ProjectDetail
          key={`${detail.id}-${detail.tab}`}
          id={detail.id}
          initialTab={detail.tab}
          t={t}
          locale={locale}
          onClose={() => {
            setDetail(null);
            if (new URLSearchParams(location.search).get('project')) navigate('/projects', { replace: true });
          }}
          onChanged={fetchProjects}
        />
      )}
    </main>
  );
};

export default ProjectManagement;

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Lightbulb, Handshake, Building2, TrendingUp, Search, Filter, ArrowRight,
  DollarSign, Users, Target, Globe, Share2, ExternalLink, Star, CheckCircle,
  Clock, Briefcase, X, Plus, Send, BadgeCheck, ShieldAlert, ThumbsUp, Flag, EyeOff, Hourglass, Wallet,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import PremiumBadge from '../components/premium/PremiumBadge';
import PartnerShowcase from '../components/premium/PartnerShowcase';

/**
 * Pasar Inovasi — data dari /api/innovation_marketplace.php.
 * Semua tombol berfungsi: kategori & jenis organisasi (dari data), filter lanjutan,
 * detail peluang, ajukan lamaran, simpan, bagikan, dan pasang peluang baru.
 *
 * Kurasi: peluang dari pengguna tampil langsung berlencana "Dalam kurasi"; pengguna ber-ORCID
 * menilai (Layak / Laporkan), admin memberi lencana "Terverifikasi" setelah biaya penayangan
 * lunas. Pemasang melihat status kurasi, catatan admin, dan formulir konfirmasi pembayaran.
 */

const REPORT_REASONS = ['spam', 'misleading', 'not_research', 'duplicate', 'other'];
const CURATION_STYLE = {
  review:      { cls: 'bg-amber-100 text-amber-800 border-amber-200', icon: Hourglass },
  approved:    { cls: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: BadgeCheck },
  on_hold:     { cls: 'bg-gray-200 text-gray-700 border-gray-300', icon: EyeOff },
  auto_hidden: { cls: 'bg-red-100 text-red-700 border-red-200', icon: ShieldAlert },
};

function CurationBadge({ status, t, size = 'sm' }) {
  const s = CURATION_STYLE[status];
  if (!s) return null;
  const Icon = s.icon;
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full border font-semibold ${s.cls} ${size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'}`}
      title={t(`curation.status_hint.${status}`)}>
      <Icon className={size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'} /> {t(`curation.status.${status}`)}
    </span>
  );
}

const fmtMoney = (amount, currency, locale) => {
  if (amount === null || amount === undefined) return '—';
  try { return new Intl.NumberFormat(locale, { style: 'currency', currency: currency || 'IDR', maximumFractionDigits: 0 }).format(amount); }
  catch { return `${currency || ''} ${Number(amount).toLocaleString(locale)}`; }
};

const ORG_TYPES = ['industry', 'government', 'foundation', 'nonprofit'];
const SDG_HEX = {
  1: '#e5243b', 2: '#dda63a', 3: '#4c9f38', 4: '#c5192d', 5: '#ff3a21', 6: '#26bde2', 7: '#fcc30b', 8: '#a21942',
  9: '#fd6925', 10: '#dd1367', 11: '#fd9d24', 12: '#bf8b2e', 13: '#3f7e44', 14: '#0a97d9', 15: '#56c02b', 16: '#00689d', 17: '#19486a',
};
const inputCls = 'w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-[15px] focus:border-orange-500 focus:ring-2 focus:ring-orange-500 outline-none';

async function api(body) {
  const res = await fetch('/api/innovation_marketplace.php', {
    method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.status !== 'success') throw new Error(data.message || `HTTP ${res.status}`);
  return data;
}

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

const SdgDot = ({ n }) => (
  <span className="w-8 h-8 rounded-full text-white text-sm font-bold flex items-center justify-center" style={{ backgroundColor: SDG_HEX[n] }} title={`SDG ${n}`}>{n}</span>
);

const InnovationMarketplace = () => {
  const { t, i18n } = useTranslation('innovation_marketplace');
  const locale = i18n.language === 'id' ? 'id-ID' : 'en-US';
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const listRef = useRef(null);

  /* Ikon dan warna tetap di kode; judul dan keterangan langkahnya dari locale. */
  const stepText = t('how.steps', { returnObjects: true });
  const howSteps = [
    { icon: Search,     color: 'from-emerald-500 to-teal-600' },
    { icon: Briefcase,  color: 'from-blue-500 to-indigo-600' },
    { icon: Handshake,  color: 'from-orange-500 to-red-500' },
    { icon: TrendingUp, color: 'from-pink-500 to-rose-600' },
  ].map((card, i) => ({
    ...card,
    step:  i + 1,
    title: Array.isArray(stepText) ? stepText[i]?.title ?? '' : '',
    desc:  Array.isArray(stepText) ? stepText[i]?.desc  ?? '' : '',
  }));

  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [marketStats, setMarketStats] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeType, setActiveType] = useState('all');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [adv, setAdv] = useState({ sdg: '', deadline: 'any', sort: 'newest', savedOnly: false });
  const [selected, setSelected] = useState(null);
  const [applying, setApplying] = useState(null);
  const [posting, setPosting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [curation, setCuration] = useState({});
  const [reporting, setReporting] = useState(null);

  const loadOpportunities = useCallback(async () => {
    try {
      const res = await fetch('/api/innovation_marketplace.php?action=opportunities', { credentials: 'same-origin' });
      const data = await res.json();
      setOpportunities(data.status === 'success' ? data.opportunities || [] : []);
      if (data.curation) setCuration(data.curation);
    } catch {
      setOpportunities([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadStats = useCallback(() => {
    fetch('/api/innovation_marketplace.php?action=stats')
      .then((r) => r.json())
      .then((j) => { if (j.status === 'success') setMarketStats(j.data); })
      .catch(() => {});
  }, []);

  useEffect(() => { loadOpportunities(); loadStats(); }, [loadOpportunities, loadStats]);

  // Tautan langsung: /innovation-marketplace?opp=12 (dari tombol bagikan / notifikasi).
  useEffect(() => {
    const id = Number(new URLSearchParams(location.search).get('opp'));
    if (!id || !opportunities.length) return;
    const found = opportunities.find((o) => o.id === id);
    if (found) setSelected(found);
  }, [location.search, opportunities]);

  // Jaga detail yang terbuka tetap sinkron setelah data dimuat ulang.
  useEffect(() => {
    if (selected) {
      const fresh = opportunities.find((o) => o.id === selected.id);
      if (fresh && fresh !== selected) setSelected(fresh);
    }
  }, [opportunities, selected]);

  const fmt = (v, suffix = '') => (v === null || v === undefined ? '—' : `${Number(v).toLocaleString(locale)}${suffix}`);
  const stats = {
    totalOpportunities: fmt(marketStats?.totalOpportunities),
    totalFunding: fmt(marketStats?.totalApplications),
    activePartnerships: fmt(marketStats?.activePartnerships),
    successRate: fmt(marketStats?.successRate, '%'),
  };

  // Kategori & jenis organisasi diambil dari data peluang yang ada.
  const categories = useMemo(() => {
    const counts = {};
    opportunities.forEach((o) => { if (o.category) counts[o.category] = (counts[o.category] || 0) + 1; });
    return [{ id: 'all', name: t('filter.all_categories'), count: opportunities.length },
      ...Object.keys(counts).sort().map((c) => ({ id: c, name: c, count: counts[c] }))];
  }, [opportunities, t]);

  const typeCounts = useMemo(() => {
    const c = {};
    opportunities.forEach((o) => { if (o.type) c[o.type] = (c[o.type] || 0) + 1; });
    return c;
  }, [opportunities]);

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    const today = new Date().toISOString().slice(0, 10);
    const in30 = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
    const list = opportunities.filter((o) => {
      if (q && !`${o.title} ${o.description} ${o.organization || ''} ${(o.required_skills || []).join(' ')}`.toLowerCase().includes(q)) return false;
      if (activeCategory !== 'all' && o.category !== activeCategory) return false;
      if (activeType !== 'all' && o.type !== activeType) return false;
      if (adv.sdg && !o.sdg_focus.includes(Number(adv.sdg))) return false;
      if (adv.deadline === 'open' && o.deadline && o.deadline < today) return false;
      if (adv.deadline === '30d' && !(o.deadline && o.deadline >= today && o.deadline <= in30)) return false;
      if (adv.savedOnly && !o.saved) return false;
      return true;
    });
    const by = {
      newest: (a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')),
      deadline: (a, b) => String(a.deadline || '9999').localeCompare(String(b.deadline || '9999')),
      popular: (a, b) => b.application_count - a.application_count,
    };
    // Peluang unggulan (anggota premium) selalu di atas; urutan pilihan berlaku di dalam kelompoknya.
    const sorter = by[adv.sort] || by.newest;
    return [...list].sort((a, b) => (Number(b.featured) - Number(a.featured)) || sorter(a, b));
  }, [opportunities, searchTerm, activeCategory, activeType, adv]);

  const requireLogin = (orcid = false) => {
    if (!user) { navigate(`/login?next=${encodeURIComponent('/innovation-marketplace')}`); return false; }
    if (orcid && !user.orcid) { toast(t('toast.need_orcid')); navigate('/settings'); return false; }
    return true;
  };

  const toggleSave = async (o) => {
    if (!requireLogin()) return;
    try {
      const d = await api({ action: 'save', opportunity_id: o.id, saved: !o.saved });
      setOpportunities((list) => list.map((x) => (x.id === o.id ? { ...x, saved: d.saved } : x)));
      toast.success(d.saved ? t('toast.saved') : t('toast.unsaved'));
    } catch (e) { toast.error(e.message); }
  };

  const share = async (o) => {
    const url = `${window.location.origin}/#/innovation-marketplace?opp=${o.id}`;
    try {
      if (navigator.share) await navigator.share({ title: o.title, text: o.organization || '', url });
      else { await navigator.clipboard.writeText(url); toast.success(t('toast.link_copied')); }
    } catch { /* dibatalkan */ }
  };

  const startApply = (o) => {
    if (!requireLogin()) return;
    if (o.my_application) { toast(t('toast.already_applied')); return; }
    if (o.deadline_passed) { toast.error(t('toast.deadline_passed')); return; }
    setApplying(o);
  };

  const vote = async (o, v, reason = null, note = '') => {
    if (!requireLogin(curation.requires_orcid !== false)) return;
    const next = o.my_vote === v ? 'clear' : v;
    try {
      const d = await api({ action: 'vote', opportunity_id: o.id, vote: next, reason, note });
      setOpportunities((list) => list.map((x) => (x.id === o.id
        ? { ...x, my_vote: d.my_vote, endorsements: d.endorse, reports: d.report, curation_status: d.status } : x)));
      if (d.auto_hidden) toast(t('curation.toast_hidden'));
      else toast.success(next === 'clear' ? t('curation.toast_cleared') : t(`curation.toast_${next}`));
      setReporting(null);
    } catch (e) { toast.error(e.message); }
  };

  const confirmPayment = async (o, reference) => {
    setBusy(true);
    try {
      await api({ action: 'confirm_payment', opportunity_id: o.id, reference });
      toast.success(t('curation.toast_payment'));
      await loadOpportunities();
    } catch (e) { toast.error(e.message); }
    finally { setBusy(false); }
  };

  const scrollToList = () => listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const fmtDate = (d) => (d ? new Date(`${d}T00:00:00`).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' }) : t('list.no_deadline'));

  return (
    <main className="min-h-screen pt-[60px] bg-gradient-to-br from-slate-50 via-orange-50 to-yellow-50">

      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-orange-600 via-yellow-600 to-amber-600 text-white py-28 overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-yellow-300/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="container px-8 max-w-7xl mx-auto relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
              <Handshake className="w-5 h-5" />
              <span className="text-[15px] font-medium">{t('hero.badge')}</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">{t('hero.title')}</h1>
            <p className="text-xl md:text-2xl mb-8 text-white/90 max-w-3xl mx-auto">{t('hero.subtitle')}</p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
              {[
                { label: t('stats.opportunities'), value: stats.totalOpportunities, icon: Lightbulb },
                { label: t('stats.funding'), value: stats.totalFunding, icon: Users },
                { label: t('stats.partnerships'), value: stats.activePartnerships, icon: Handshake },
                { label: t('stats.success_rate'), value: stats.successRate, icon: CheckCircle },
              ].map((stat, index) => (
                <div key={index} className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <stat.icon className="w-6 h-6 mx-auto mb-2 opacity-80" />
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="text-[15px] opacity-80">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Search & Filter Section */}
      <section className="py-28 -mt-8" ref={listRef}>
        <div className="container px-8 max-w-7xl mx-auto">
          <div className="bg-white rounded-3xl shadow-2xl p-8 mb-8">
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder={t('filter.search_placeholder')}
                  className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none text-lg"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button type="button" onClick={() => setShowAdvanced((v) => !v)}
                className={`flex items-center gap-2 px-6 py-4 rounded-xl transition-all font-medium whitespace-nowrap ${showAdvanced || adv.sdg || adv.deadline !== 'any' || adv.savedOnly ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                <Filter className="w-5 h-5" />
                {t('filter.advanced')}
              </button>
              <button type="button" onClick={() => requireLogin(true) && setPosting(true)}
                className="flex items-center gap-2 px-6 py-4 bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-xl hover:from-orange-600 hover:to-yellow-600 transition-all font-medium whitespace-nowrap">
                <Plus className="w-5 h-5" />
                {t('cta.secondary')}
              </button>
            </div>

            {showAdvanced && (
              <div className="mt-6 grid grid-cols-1 gap-3 border-t border-gray-100 pt-6 sm:grid-cols-2 lg:grid-cols-4">
                <select className={inputCls} value={adv.sdg} onChange={(e) => setAdv((a) => ({ ...a, sdg: e.target.value }))}>
                  <option value="">{t('filter.all_sdgs')}</option>
                  {Array.from({ length: 17 }, (_, i) => i + 1).map((n) => <option key={n} value={n}>SDG {n}</option>)}
                </select>
                <select className={inputCls} value={adv.deadline} onChange={(e) => setAdv((a) => ({ ...a, deadline: e.target.value }))}>
                  {['any', 'open', '30d'].map((k) => <option key={k} value={k}>{t(`filter.deadline.${k}`)}</option>)}
                </select>
                <select className={inputCls} value={adv.sort} onChange={(e) => setAdv((a) => ({ ...a, sort: e.target.value }))}>
                  {['newest', 'deadline', 'popular'].map((k) => <option key={k} value={k}>{t(`filter.sort.${k}`)}</option>)}
                </select>
                <label className="flex items-center gap-2 text-[15px] text-gray-700">
                  <input type="checkbox" className="h-4 w-4 accent-orange-500" checked={adv.savedOnly}
                    onChange={() => (user ? setAdv((a) => ({ ...a, savedOnly: !a.savedOnly })) : requireLogin())} />
                  {t('filter.saved_only')}
                </label>
              </div>
            )}

            {/* Kategori (dari data) */}
            <div className="flex gap-3 mt-8 overflow-x-auto pb-2">
              {categories.map((c) => (
                <button key={c.id} type="button" onClick={() => setActiveCategory(c.id)}
                  className={`px-5 py-3 rounded-xl font-medium transition-all whitespace-nowrap flex items-center gap-2 ${
                    activeCategory === c.id ? 'bg-gradient-to-r from-orange-500 to-yellow-500 text-white shadow-lg' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}>
                  {c.id === 'all' ? <Lightbulb className="w-5 h-5" /> : <Target className="w-5 h-5" />}
                  {c.name}
                  <span className={`text-sm px-2 py-0.5 rounded-full ${activeCategory === c.id ? 'bg-white/20' : 'bg-gray-200'}`}>{c.count}</span>
                </button>
              ))}
            </div>

            {/* Jenis organisasi */}
            <div className="flex gap-2 mt-6 flex-wrap items-center">
              <span className="text-[15px] font-semibold text-gray-700 py-2">{t('filter.org_type')}</span>
              {['all', ...ORG_TYPES].map((type) => (
                <button key={type} type="button" onClick={() => setActiveType(type)}
                  className={`px-4 py-2 rounded-lg transition-all text-[15px] font-medium ${activeType === type ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                  {t(`org_type.${type}`)}
                  {type !== 'all' && <span className="ml-1 opacity-70">({typeCounts[type] || 0})</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Opportunities Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {loading ? (
              <div className="flex justify-center items-center py-12 col-span-full">
                <div className="w-12 h-12 border-4 border-gray-200 border-t-orange-500 rounded-full animate-spin"></div>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 col-span-full">
                <p className="text-gray-600">{opportunities.length ? t('list.empty') : t('list.none')}</p>
                {!opportunities.length && (
                  <button type="button" onClick={() => requireLogin(true) && setPosting(true)} className="mt-4 rounded-xl bg-orange-500 px-6 py-3 text-white hover:bg-orange-600">
                    {t('cta.secondary')}
                  </button>
                )}
              </div>
            ) : (filtered.map((opp) => (
              <div key={opp.id} role="button" tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter') setSelected(opp); }}
                className={`relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden cursor-pointer group ${opp.featured ? 'ring-2 ring-amber-400' : ''}`}
                onClick={() => setSelected(opp)}>
                {opp.featured && (
                  <span className="absolute right-0 top-0 z-10 rounded-bl-xl bg-gradient-to-r from-amber-300 to-yellow-400 px-3 py-1 text-xs font-bold text-amber-950 shadow">
                    ★ {t('premium:featured')}
                  </span>
                )}
                {/* Header */}
                <div className="bg-gradient-to-r from-orange-500 to-yellow-500 p-6 text-white">
                  <div className="flex justify-between items-start mb-4 gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {opp.logo_url ? (
                        <img src={opp.logo_url} alt={opp.organization || ''} className="w-12 h-12 rounded-lg bg-white p-1 object-contain"
                          onError={(e) => { e.target.style.display = 'none'; }} />
                      ) : (
                        <div className="w-12 h-12 shrink-0 rounded-lg bg-white/20 flex items-center justify-center text-lg font-bold">
                          {(opp.organization || opp.posted_by_name || 'O').charAt(0)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="text-[15px] opacity-90 truncate">{opp.organization || opp.posted_by_name || t('list.unknown_org')}</div>
                        <div className="font-bold text-lg">{opp.title}</div>
                        <div className="mt-1 flex flex-wrap gap-1.5"><CurationBadge status={opp.curation_status} t={t} /><PremiumBadge tier={opp.premium_tier} /></div>
                      </div>
                    </div>
                    {opp.type && (
                      <span className="px-3 py-1 rounded-full text-sm font-semibold border bg-white/20 backdrop-blur-sm whitespace-nowrap">{t(`org_type.${opp.type}`)}</span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-[15px] opacity-90">
                    <span className="flex items-center gap-1"><DollarSign className="w-4 h-4" />{opp.budget_range || t('list.budget_unspecified')}</span>
                    <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{fmtDate(opp.deadline)}</span>
                  </div>
                </div>

                {/* Body */}
                <div className="p-6">
                  <p className="text-gray-600 mb-4 line-clamp-3">{opp.description}</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {opp.sdg_focus.map((n) => <SdgDot key={n} n={n} />)}
                    {opp.category && <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">{opp.category}</span>}
                  </div>

                  {opp.required_skills.length > 0 && (
                    <div className="mb-4">
                      <div className="text-sm font-semibold text-gray-500 mb-2">{t('list.requirements')}</div>
                      <div className="flex flex-wrap gap-2">
                        {opp.required_skills.slice(0, 3).map((req) => (
                          <span key={req} className="px-2 py-1 bg-orange-50 text-orange-700 rounded text-sm">{req}</span>
                        ))}
                        {opp.required_skills.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-sm">{t('list.more', { count: opp.required_skills.length - 3 })}</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4 border-t border-gray-100">
                    {opp.is_mine ? (
                      <span className="flex-1 rounded-xl bg-gray-100 py-3 text-center font-medium text-gray-600">
                        {t('list.your_listing', { count: opp.application_count })}
                      </span>
                    ) : opp.my_application ? (
                      <span className="flex-1 rounded-xl bg-green-50 py-3 text-center font-medium text-green-700 flex items-center justify-center gap-2">
                        <CheckCircle className="w-4 h-4" /> {t(`application_status.${opp.my_application}`, { defaultValue: opp.my_application })}
                      </span>
                    ) : (
                      <button type="button" disabled={opp.deadline_passed}
                        onClick={(e) => { e.stopPropagation(); startApply(opp); }}
                        className="flex-1 bg-gradient-to-r from-orange-500 to-yellow-500 text-white py-3 rounded-xl hover:from-orange-600 hover:to-yellow-600 transition-all font-medium flex items-center justify-center gap-2 disabled:opacity-50">
                        {opp.deadline_passed ? t('list.closed') : t('list.apply')}
                        {!opp.deadline_passed && <ArrowRight className="w-4 h-4" />}
                      </button>
                    )}
                    <button type="button" onClick={(e) => { e.stopPropagation(); share(opp); }}
                      className="p-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all" title={t('list.share')}>
                      <Share2 className="w-5 h-5" />
                    </button>
                    <button type="button" onClick={(e) => { e.stopPropagation(); toggleSave(opp); }}
                      className={`p-3 rounded-xl transition-all ${opp.saved ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                      title={opp.saved ? t('list.unsave') : t('list.save')} aria-pressed={opp.saved}>
                      <Star className="w-5 h-5" fill={opp.saved ? 'currentColor' : 'none'} />
                    </button>
                  </div>
                  <div className="mt-3 flex items-center justify-center gap-4 text-sm text-gray-500">
                    <span>{t('list.applications', { count: opp.application_count })}</span>
                    {opp.curation_status === 'review' && (
                      <span className="inline-flex items-center gap-1" title={t('curation.counts_hint')}>
                        <ThumbsUp className="h-3.5 w-3.5" /> {opp.endorsements}
                        <Flag className="ml-2 h-3.5 w-3.5" /> {opp.reports}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )))}
          </div>
        </div>
      </section>

      <PartnerShowcase compact className="bg-white/60" />

      {/* How It Works */}
      <section className="py-28 bg-white">
        <div className="container px-8 max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">{t('how.title')}</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">{t('how.subtitle')}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {howSteps.map((item, index) => (
              <div key={index} className="relative">
                <div className="bg-gradient-to-br from-gray-50 to-white p-8 rounded-2xl text-center border border-gray-100 hover:shadow-xl transition-all duration-300">
                  <div className={`w-16 h-16 bg-gradient-to-br ${item.color} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                    <item.icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="absolute -top-3 -right-3 w-8 h-8 bg-gradient-to-br from-orange-500 to-yellow-500 text-white rounded-full flex items-center justify-center font-bold shadow-lg">
                    {item.step}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-600 text-[15px]">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-28 bg-gradient-to-r from-orange-600 via-yellow-600 to-amber-600 text-white">
        <div className="container px-8 max-w-7xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">{t('cta.title')}</h2>
          <p className="text-xl mb-8 text-white/90 max-w-3xl mx-auto">{t('cta.subtitle')}</p>
          <div className="flex flex-wrap justify-center gap-4">
            <button type="button" onClick={scrollToList}
              className="bg-white text-orange-600 px-8 py-4 rounded-xl font-semibold hover:bg-white/90 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center gap-2">
              {t('cta.primary')}
              <ArrowRight className="w-5 h-5" />
            </button>
            <button type="button" onClick={() => requireLogin(true) && setPosting(true)}
              className="bg-white/20 backdrop-blur-sm text-white px-8 py-4 rounded-xl font-semibold hover:bg-white/30 transition-all duration-300 border border-white/30 flex items-center gap-2">
              <Plus className="w-5 h-5" />
              {t('cta.secondary')}
            </button>
          </div>
        </div>
      </section>

      {/* Detail peluang */}
      {selected && (
        <Modal wide title={selected.title} onClose={() => {
          setSelected(null);
          if (new URLSearchParams(location.search).get('opp')) navigate('/innovation-marketplace', { replace: true });
        }}>
          <div className="space-y-4 text-[15px]">
            <CurationPanel opp={selected} t={t} locale={locale} curation={curation} busy={busy}
              onVote={(v) => (v === 'report' && selected.my_vote !== 'report' ? (requireLogin(curation.requires_orcid !== false) && setReporting(selected)) : vote(selected, v))}
              onConfirmPayment={(ref) => confirmPayment(selected, ref)} />
            <div className="flex flex-wrap items-center gap-2 text-gray-600">
              <Building2 className="h-4 w-4" />
              <span className="font-medium text-gray-900">{selected.organization || selected.posted_by_name || t('list.unknown_org')}</span>
              <PremiumBadge tier={selected.premium_tier} size="md" />
              {selected.type && <span className="rounded-full bg-orange-50 px-2 py-0.5 text-sm text-orange-700">{t(`org_type.${selected.type}`)}</span>}
              {selected.category && <span className="rounded-full bg-gray-100 px-2 py-0.5 text-sm">{selected.category}</span>}
              {selected.website && (
                <a href={selected.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-orange-600 hover:underline">
                  <Globe className="h-4 w-4" /> {t('detail.website')} <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-lg bg-gray-50 p-3"><dt className="text-xs text-gray-500">{t('detail.budget')}</dt><dd className="font-medium">{selected.budget_range || t('list.budget_unspecified')}</dd></div>
              <div className="rounded-lg bg-gray-50 p-3"><dt className="text-xs text-gray-500">{t('detail.deadline')}</dt><dd className={`font-medium ${selected.deadline_passed ? 'text-red-600' : ''}`}>{fmtDate(selected.deadline)}</dd></div>
              <div className="rounded-lg bg-gray-50 p-3"><dt className="text-xs text-gray-500">{t('detail.applications')}</dt><dd className="font-medium">{selected.application_count}</dd></div>
            </dl>
            <p className="whitespace-pre-wrap text-gray-700">{selected.description}</p>
            {selected.sdg_focus.length > 0 && (
              <div><h3 className="mb-2 font-semibold text-gray-900">{t('detail.sdgs')}</h3><div className="flex flex-wrap gap-2">{selected.sdg_focus.map((n) => <SdgDot key={n} n={n} />)}</div></div>
            )}
            {selected.required_skills.length > 0 && (
              <div>
                <h3 className="mb-2 font-semibold text-gray-900">{t('list.requirements')}</h3>
                <div className="flex flex-wrap gap-2">{selected.required_skills.map((r) => <span key={r} className="rounded bg-orange-50 px-2 py-1 text-sm text-orange-700">{r}</span>)}</div>
              </div>
            )}
            {selected.posted_by_orcid && (
              <p className="text-sm text-gray-500">
                {t('detail.posted_by')}{' '}
                <button type="button" className="text-orange-600 hover:underline" onClick={() => navigate(`/orcid/${selected.posted_by_orcid}`)}>
                  {selected.posted_by_name || selected.posted_by_orcid}
                </button>
              </p>
            )}
            <div className="flex flex-wrap gap-2 border-t border-gray-100 pt-4">
              {!selected.is_mine && !selected.my_application && (
                <button type="button" disabled={selected.deadline_passed} onClick={() => startApply(selected)}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-yellow-500 px-5 py-2.5 font-medium text-white disabled:opacity-50">
                  {selected.deadline_passed ? t('list.closed') : t('list.apply')} {!selected.deadline_passed && <ArrowRight className="h-4 w-4" />}
                </button>
              )}
              {selected.my_application && (
                <span className="inline-flex items-center gap-2 rounded-xl bg-green-50 px-5 py-2.5 font-medium text-green-700">
                  <CheckCircle className="h-4 w-4" /> {t(`application_status.${selected.my_application}`, { defaultValue: selected.my_application })}
                </span>
              )}
              <button type="button" onClick={() => toggleSave(selected)}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 ${selected.saved ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                <Star className="h-4 w-4" fill={selected.saved ? 'currentColor' : 'none'} /> {selected.saved ? t('list.unsave') : t('list.save')}
              </button>
              <button type="button" onClick={() => share(selected)} className="inline-flex items-center gap-2 rounded-xl bg-gray-100 px-4 py-2.5 text-gray-700 hover:bg-gray-200">
                <Share2 className="h-4 w-4" /> {t('list.share')}
              </button>
              {selected.posted_by_orcid && !selected.is_mine && (
                <button type="button" onClick={() => (requireLogin() ? navigate(`/messages?to=${encodeURIComponent(selected.posted_by_orcid)}`) : null)}
                  className="inline-flex items-center gap-2 rounded-xl bg-gray-100 px-4 py-2.5 text-gray-700 hover:bg-gray-200">
                  <Send className="h-4 w-4" /> {t('detail.ask')}
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Laporan kurasi */}
      {reporting && (
        <ReportForm opp={reporting} t={t} onClose={() => setReporting(null)} onSubmit={(reason, note) => vote(reporting, 'report', reason, note)} />
      )}

      {/* Formulir lamaran */}
      {applying && (
        <ApplyForm opp={applying} t={t} busy={busy} user={user} onClose={() => setApplying(null)}
          onSubmit={async (f) => {
            setBusy(true);
            try {
              await api({ action: 'apply', opportunity_id: applying.id, ...f });
              toast.success(t('toast.applied'));
              setApplying(null);
              await loadOpportunities();
              loadStats();
            } catch (e) { toast.error(e.message); }
            finally { setBusy(false); }
          }} />
      )}

      {/* Formulir pasang peluang */}
      {posting && (
        <PostForm t={t} busy={busy} curation={curation} locale={locale} categories={categories.filter((c) => c.id !== 'all').map((c) => c.name)} onClose={() => setPosting(false)}
          onSubmit={async (f) => {
            setBusy(true);
            try {
              const d = await api({ action: 'create', ...f });
              toast.success(d.curation_status === 'approved' ? t('toast.posted')
                : d.fee_source === 'membership' ? t('curation.toast_posted_member') : t('curation.toast_posted_review'), { duration: 6000 });
              setPosting(false);
              await loadOpportunities();
              loadStats();
              navigate(`/innovation-marketplace?opp=${d.opportunity_id}`);
            } catch (e) { toast.error(e.message); }
            finally { setBusy(false); }
          }} />
      )}
    </main>
  );
};

function ApplyForm({ opp, t, busy, user, onClose, onSubmit }) {
  const [text, setText] = useState('');
  const [attachment, setAttachment] = useState('');
  return (
    <Modal title={t('apply.title', { title: opp.title })} onClose={onClose}>
      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); onSubmit({ application_text: text, attachment_url: attachment }); }}>
        {opp.curation_status === 'review' && (
          <p className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" /> {t('curation.apply_warning')}
          </p>
        )}
        <p className="rounded-lg bg-gray-50 p-3 text-sm text-gray-600">{t('apply.as', { name: user?.name || user?.email, email: user?.email })}</p>
        <Field label={t('apply.text')} hint={t('apply.text_hint', { count: text.trim().length })}>
          <textarea className={inputCls} rows={7} value={text} onChange={(e) => setText(e.target.value)} required minLength={50} maxLength={10000} />
        </Field>
        <Field label={t('apply.attachment')} hint={t('apply.attachment_hint')}>
          <input type="url" className={inputCls} value={attachment} onChange={(e) => setAttachment(e.target.value)} placeholder="https://" />
        </Field>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-gray-200 px-4 py-2 text-gray-700">{t('common.cancel')}</button>
          <button type="submit" disabled={busy || text.trim().length < 50} className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-5 py-2 font-medium text-white hover:bg-orange-600 disabled:opacity-50">
            <Send className="h-4 w-4" /> {busy ? t('common.sending') : t('apply.submit')}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function PostForm({ t, busy, categories, curation = {}, locale, onClose, onSubmit }) {
  const [f, setF] = useState({ title: '', description: '', category: categories[0] || '', organization: '', org_type: 'industry',
    deadline: '', budget_range: '', skills: '', sdg_alignment: [] });
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));
  const today = new Date().toISOString().slice(0, 10);
  return (
    <Modal wide title={t('post.title')} onClose={onClose}>
      <form className="space-y-4" onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ ...f, required_skills: f.skills.split(',').map((s) => s.trim()).filter(Boolean) });
      }}>
        <Field label={t('post.f_title')}><input className={inputCls} value={f.title} onChange={set('title')} required minLength={10} maxLength={255} /></Field>
        <Field label={t('post.f_description')} hint={t('post.f_description_hint')}>
          <textarea className={inputCls} rows={5} value={f.description} onChange={set('description')} required minLength={50} />
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label={t('post.f_category')}>
            <input className={inputCls} list="mkt-categories" value={f.category} onChange={set('category')} required maxLength={100} />
            <datalist id="mkt-categories">{categories.map((c) => <option key={c} value={c} />)}</datalist>
          </Field>
          <Field label={t('post.f_deadline')}><input type="date" className={inputCls} value={f.deadline} onChange={set('deadline')} min={today} /></Field>
          <Field label={t('post.f_organization')}><input className={inputCls} value={f.organization} onChange={set('organization')} maxLength={255} /></Field>
          <Field label={t('post.f_org_type')}>
            <select className={inputCls} value={f.org_type} onChange={set('org_type')}>
              {ORG_TYPES.map((x) => <option key={x} value={x}>{t(`org_type.${x}`)}</option>)}
            </select>
          </Field>
          <Field label={t('post.f_budget')}><input className={inputCls} value={f.budget_range} onChange={set('budget_range')} maxLength={50} placeholder={t('post.f_budget_ph')} /></Field>
          <Field label={t('post.f_skills')} hint={t('post.f_skills_hint')}><input className={inputCls} value={f.skills} onChange={set('skills')} /></Field>
        </div>
        <Field label={t('post.f_sdgs')}>
          <div className="flex flex-wrap gap-1.5">
            {Array.from({ length: 17 }, (_, i) => i + 1).map((n) => {
              const on = f.sdg_alignment.includes(n);
              return (
                <button key={n} type="button" onClick={() => setF((x) => ({ ...x, sdg_alignment: on ? x.sdg_alignment.filter((y) => y !== n) : [...x.sdg_alignment, n] }))}
                  className={`h-8 w-8 rounded-full text-sm font-bold ${on ? 'text-white ring-2 ring-offset-1 ring-gray-300' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                  style={on ? { backgroundColor: SDG_HEX[n] } : undefined}>{n}</button>
              );
            })}
          </div>
        </Field>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <p className="flex items-center gap-2 font-semibold"><Hourglass className="h-4 w-4" /> {t('curation.post_title')}</p>
          <p className="mt-1">{t('curation.post_flow')}</p>
          {curation.fee_enabled ? (
            <p className="mt-1">{t('curation.post_fee', { amount: fmtMoney(curation.fee_amount, curation.fee_currency, locale) })}</p>
          ) : (
            <p className="mt-1">{t('curation.post_free')}</p>
          )}
        </div>
        <p className="text-xs text-gray-500">{t('post.notice')}</p>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-gray-200 px-4 py-2 text-gray-700">{t('common.cancel')}</button>
          <button type="submit" disabled={busy} className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-5 py-2 font-medium text-white hover:bg-orange-600 disabled:opacity-50">
            <Plus className="h-4 w-4" /> {busy ? t('common.sending') : t('post.submit')}
          </button>
        </div>
      </form>
    </Modal>
  );
}

/** Lencana kurasi + penilaian publik, atau panel status untuk pemasang. */
function CurationPanel({ opp, t, locale, curation, busy, onVote, onConfirmPayment }) {
  const [ref, setRef] = useState('');
  const status = opp.curation_status;

  if (opp.is_mine) {
    const fee = opp.fee || {};
    // Layanan premium mati → verifikasi gratis; tidak ada tagihan yang perlu dibayar.
    const feeDone = fee.status === 'paid' || fee.status === 'waived' || fee.free_now;
    return (
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-semibold text-gray-900">{t('curation.mine_title')}</span>
          <CurationBadge status={status} t={t} size="md" />
        </div>
        <p className="mt-2 text-gray-600">{status === 'review' && fee.free_now ? t('curation.mine_hint_free') : t(`curation.mine_hint.${status}`)}</p>
        {opp.curation_note && (status === 'on_hold' || fee.status === 'unpaid') && (
          <p className="mt-2 rounded-lg border border-gray-200 bg-white p-3 text-gray-700">
            <span className="font-medium">{t('curation.admin_note')}:</span> {opp.curation_note}
          </p>
        )}
        {status !== 'approved' && (
          <div className="mt-3 rounded-lg border border-gray-200 bg-white p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="inline-flex items-center gap-2 font-medium text-gray-900"><Wallet className="h-4 w-4" /> {t('curation.fee_title')}</span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${feeDone ? 'bg-emerald-100 text-emerald-800' : fee.status === 'pending' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'}`}>
                {fee.free_now && fee.status !== 'paid' ? t('curation.fee_free_now') : t(`curation.fee_status.${fee.status || 'unpaid'}`)}
              </span>
            </div>
            {!fee.free_now && fee.status !== 'waived' && fee.amount !== null && fee.amount !== undefined && (
              <p className="mt-2 text-lg font-bold text-gray-900">{fmtMoney(fee.amount, fee.currency, locale)}</p>
            )}
            {fee.status === 'unpaid' && !fee.free_now && (
              <>
                {curation.fee_instructions && <p className="mt-2 whitespace-pre-wrap text-gray-700">{curation.fee_instructions}</p>}
                <form className="mt-3 flex flex-col gap-2 sm:flex-row" onSubmit={(e) => { e.preventDefault(); onConfirmPayment(ref); }}>
                  <input className={inputCls} value={ref} onChange={(e) => setRef(e.target.value)} maxLength={255} required minLength={4}
                    placeholder={t('curation.fee_reference_ph')} />
                  <button type="submit" disabled={busy || ref.trim().length < 4}
                    className="whitespace-nowrap rounded-lg bg-orange-500 px-4 py-2 font-medium text-white hover:bg-orange-600 disabled:opacity-50">
                    {t('curation.fee_confirm')}
                  </button>
                </form>
              </>
            )}
            {fee.status === 'pending' && <p className="mt-2 text-gray-600">{t('curation.fee_pending', { ref: fee.reference || '' })}</p>}
          </div>
        )}
      </div>
    );
  }

  if (status === 'approved') {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
        <BadgeCheck className="h-5 w-5 shrink-0" /> {t('curation.verified_note')}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <CurationBadge status={status} t={t} size="md" />
        <span className="text-xs text-amber-700">{t('curation.counts', { endorse: opp.endorsements, report: opp.reports })}</span>
      </div>
      <p className="mt-2">{t('curation.public_hint')}</p>
      {curation.can_vote === false && curation.requires_orcid && <p className="mt-1 text-xs">{t('curation.need_orcid')}</p>}
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={() => onVote('endorse')} aria-pressed={opp.my_vote === 'endorse'}
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 font-medium ${opp.my_vote === 'endorse' ? 'bg-emerald-600 text-white' : 'bg-white text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-50'}`}>
          <ThumbsUp className="h-4 w-4" /> {t('curation.endorse')} ({opp.endorsements})
        </button>
        <button type="button" onClick={() => onVote('report')} aria-pressed={opp.my_vote === 'report'}
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 font-medium ${opp.my_vote === 'report' ? 'bg-red-600 text-white' : 'bg-white text-red-700 ring-1 ring-red-200 hover:bg-red-50'}`}>
          <Flag className="h-4 w-4" /> {opp.my_vote === 'report' ? t('curation.reported') : t('curation.report')} ({opp.reports})
        </button>
      </div>
    </div>
  );
}

function ReportForm({ opp, t, onClose, onSubmit }) {
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  return (
    <Modal title={t('curation.report_title')} onClose={onClose}>
      <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); if (reason) onSubmit(reason, note); }}>
        <p className="text-sm text-gray-600">{t('curation.report_intro', { title: opp.title })}</p>
        {REPORT_REASONS.map((r) => (
          <label key={r} className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-[15px] ${reason === r ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:bg-gray-50'}`}>
            <input type="radio" name="reason" value={r} checked={reason === r} onChange={() => setReason(r)} className="accent-red-600" />
            {t(`curation.reasons.${r}`)}
          </label>
        ))}
        <textarea className={inputCls} rows={3} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} placeholder={t('curation.report_note_ph')} />
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-gray-200 px-4 py-2 text-gray-700">{t('common.cancel')}</button>
          <button type="submit" disabled={!reason} className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2 font-medium text-white hover:bg-red-700 disabled:opacity-50">
            <Flag className="h-4 w-4" /> {t('curation.report_submit')}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default InnovationMarketplace;

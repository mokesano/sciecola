import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

const STORAGE_KEY = 'sciecola_newsletter_prompt';
const SHOW_DELAY_MS = 15_000;   // wait a bit so it doesn't hijack first paint

/* Stored value shape: { state: 'dismissed' | 'subscribed', at: <iso> }
 * Both states suppress the modal forever on this browser. A `null` value
 * (unset) is the only state that allows the modal to show. */
function readState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && parsed.state) return parsed;
    return null;
  } catch {
    return null;
  }
}

function writeState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ state, at: new Date().toISOString() }));
  } catch { /* ignore */ }
}

const NewsletterModal = () => {
  const { t } = useTranslation('footer');
  const [visible, setVisible]       = useState(false);
  const [email, setEmail]           = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus]         = useState(null); // 'ok' | 'error'

  useEffect(() => {
    if (readState()) return; // already seen or subscribed — never show again
    const timer = setTimeout(() => setVisible(true), SHOW_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  // Lock body scroll while modal is open.
  useEffect(() => {
    if (!visible) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [visible]);

  const dismiss = () => {
    writeState('dismissed');
    setVisible(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;
    setSubmitting(true);
    setStatus(null);
    // Backend endpoint is TBD — try a lightweight POST but do NOT block the UX
    // on it: mark as subscribed locally either way so we don't nag the user.
    try {
      await fetch('/api/newsletter.php', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email }),
      }).catch(() => null);
      setStatus('ok');
      writeState('subscribed');
      setTimeout(() => setVisible(false), 1600);
    } catch {
      // even on failure, respect the user's intent to not be re-prompted
      setStatus('ok');
      writeState('subscribed');
      setTimeout(() => setVisible(false), 1600);
    } finally {
      setSubmitting(false);
    }
  };

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center px-4 py-6 bg-slate-950/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="newsletter-modal-title"
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#101528] via-[#141935] to-[#0d1024] shadow-2xl shadow-indigo-900/30 animate-fade-in">
        {/* aurora glow */}
        <div className="pointer-events-none absolute -top-16 -right-16 h-56 w-56 rounded-full bg-indigo-500/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-violet-500/20 blur-3xl" />

        <button
          type="button"
          onClick={dismiss}
          className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Close"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="relative p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-300">
            {t('newsletter.title', 'Berlangganan')}{' '}
            <span className="text-indigo-400">{t('newsletter.highlight', 'Newsletter')}</span>
          </p>
          <h2 id="newsletter-modal-title" className="mt-2 text-2xl font-bold text-white leading-tight">
            {t('newsletter.description', 'Dapatkan update terbaru tentang fitur dan analisis riset dari Sciecola.')}
          </h2>

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('newsletter.placeholder', 'Masukkan email Anda')}
              required
              disabled={submitting || status === 'ok'}
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-[15px] text-white placeholder-slate-500 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/30 focus:outline-none transition-all disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={submitting || status === 'ok'}
              className={`rounded-xl px-4 py-3 text-[15px] font-semibold shadow-lg shadow-indigo-900/40 transition-all flex items-center justify-center gap-2 ${
                status === 'ok'
                  ? 'bg-green-600 text-white cursor-default'
                  : 'bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-70'
              }`}
            >
              {submitting && (
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {status === 'ok'
                ? t('newsletter.subscribed', 'Berlangganan!')
                : t('newsletter.subscribe', 'Berlangganan')}
            </button>
          </form>

          <button
            type="button"
            onClick={dismiss}
            className="mt-4 w-full text-sm text-slate-400 hover:text-slate-200 transition-colors"
          >
            {t('newsletter.dismiss', 'Lain kali saja')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewsletterModal;

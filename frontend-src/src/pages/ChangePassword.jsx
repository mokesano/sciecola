import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

/* ─── password strength scoring ─────────────────────────────────────────── */

function analyzePassword(pw) {
  const checks = {
    length: pw.length >= 8,
    upper:  /[A-Z]/.test(pw),
    lower:  /[a-z]/.test(pw),
    number: /[0-9]/.test(pw),
    symbol: /[^A-Za-z0-9]/.test(pw),
  };
  const score = Object.values(checks).filter(Boolean).length;
  return { checks, score };
}

const STRENGTH_META = [
  { key: 'weak',   width: '25%',  bar: 'bg-red-500',    text: 'text-red-600'    },
  { key: 'weak',   width: '25%',  bar: 'bg-red-500',    text: 'text-red-600'    },
  { key: 'fair',   width: '50%',  bar: 'bg-amber-500',  text: 'text-amber-600'  },
  { key: 'good',   width: '75%',  bar: 'bg-blue-500',   text: 'text-blue-600'   },
  { key: 'strong', width: '100%', bar: 'bg-green-500',  text: 'text-green-600'  },
  { key: 'strong', width: '100%', bar: 'bg-green-600',  text: 'text-green-700'  },
];

/* ─── password input with visibility toggle ─────────────────────────────── */

const PasswordField = ({ id, name, label, placeholder, value, onChange, error, t }) => {
  const [visible, setVisible] = useState(false);
  return (
    <div>
      <label htmlFor={id} className="block text-[15px] font-medium text-gray-700 mb-1.5">{label}</label>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={name === 'current' ? 'current-password' : 'new-password'}
          className={`w-full px-4 py-3 pr-10 bg-gray-50 border rounded-xl text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all ${
            error ? 'border-red-300 focus:ring-red-500' : 'border-gray-200'
          }`}
        />
        <button
          type="button"
          onClick={() => setVisible(v => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label={visible ? t('form.hide') : t('form.show')}
        >
          {visible ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          )}
        </button>
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

/* ─── requirement checklist row ─────────────────────────────────────────── */

const ReqRow = ({ ok, label }) => (
  <li className={`flex items-center gap-2 text-[15px] ${ok ? 'text-green-600' : 'text-gray-500'}`}>
    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      {ok ? (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
      ) : (
        <circle cx="12" cy="12" r="9" strokeWidth="2" />
      )}
    </svg>
    {label}
  </li>
);

/* ─── main page ─────────────────────────────────────────────────────────── */

const ChangePassword = () => {
  const { t } = useTranslation('change_password');
  const { user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ current: '', next: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const { checks, score } = useMemo(() => analyzePassword(form.next), [form.next]);
  const strength = STRENGTH_META[score] || STRENGTH_META[0];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const next = {};
    if (!form.current)                          next.current = t('errors.current_required');
    if (!form.next)                             next.next    = t('errors.new_required');
    else if (form.next.length < 8)              next.next    = t('errors.new_too_short');
    else if (form.next === form.current)        next.next    = t('errors.new_same');
    if (form.confirm !== form.next)             next.confirm = t('errors.confirm_mismatch');
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user?.token) {
      toast.error(t('errors.not_authenticated'));
      navigate('/login');
      return;
    }
    if (!validate()) return;

    setSaving(true);
    try {
      const res = await fetch('/api/auth.php', {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Token': user.token,
        },
        body: JSON.stringify({
          action:           'change_password',
          current_password: form.current,
          new_password:     form.next,
        }),
      });
      const json = await res.json();
      if (!res.ok || json.status !== 'success') {
        const msg = json.message || t('errors.server');
        if (json.field) setErrors({ [json.field]: msg });
        toast.error(msg);
        return;
      }
      toast.success(t('success'));
      setForm({ current: '', next: '', confirm: '' });
      setErrors({});
      // If the backend returned a fresh token (session rotated), stash it.
      if (json.token) {
        try {
          const stored = JSON.parse(localStorage.getItem('sciecola_user') || '{}');
          localStorage.setItem('sciecola_user', JSON.stringify({ ...stored, token: json.token }));
        } catch { /* ignore */ }
      }
    } catch {
      toast.error(t('errors.server'));
    } finally {
      setSaving(false);
    }
  };

  // Redirect unauthenticated users right away.
  if (!user) {
    return (
      <main className="pt-28 pb-16 px-4 sm:px-6 lg:px-8 max-w-lg mx-auto text-center">
        <p className="text-gray-600 mb-4">{t('errors.not_authenticated')}</p>
        <Link to="/login" className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-[15px] font-semibold hover:bg-indigo-700 transition-colors">
          {t('breadcrumb.home')}
        </Link>
      </main>
    );
  }

  return (
    <main className="pt-28 pb-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-[15px] text-gray-600 mb-6">
        <Link to="/"         className="hover:text-indigo-600 transition-colors">{t('breadcrumb.home')}</Link>
        <span className="text-gray-400">›</span>
        <Link to="/settings" className="hover:text-indigo-600 transition-colors">{t('breadcrumb.settings')}</Link>
        <span className="text-gray-400">›</span>
        <span className="text-gray-900 font-medium">{t('breadcrumb.current')}</span>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
        <p className="text-gray-600 mt-1 max-w-2xl">{t('subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <form onSubmit={handleSubmit}
          className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6"
          noValidate>

          <PasswordField
            id="current" name="current" label={t('form.current')} placeholder={t('form.current_ph')}
            value={form.current} onChange={handleChange} error={errors.current} t={t} />

          <div>
            <PasswordField
              id="next" name="next" label={t('form.new')} placeholder={t('form.new_ph')}
              value={form.next} onChange={handleChange} error={errors.next} t={t} />

            {/* Strength meter */}
            {form.next && (
              <div className="mt-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-500">{t('strength.label')}</span>
                  <span className={`text-sm font-semibold ${strength.text}`}>{t(`strength.${strength.key}`)}</span>
                </div>
                <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full ${strength.bar} transition-all`} style={{ width: strength.width }} />
                </div>
              </div>
            )}

            {/* Requirements */}
            <div className="mt-4 bg-gray-50 border border-gray-100 rounded-xl p-4">
              <p className="text-sm font-medium text-gray-600 mb-2">{t('requirements.title')}</p>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-y-1.5 gap-x-4">
                <ReqRow ok={checks.length} label={t('requirements.length')} />
                <ReqRow ok={checks.upper}  label={t('requirements.upper')} />
                <ReqRow ok={checks.lower}  label={t('requirements.lower')} />
                <ReqRow ok={checks.number} label={t('requirements.number')} />
                <ReqRow ok={checks.symbol} label={t('requirements.symbol')} />
              </ul>
            </div>
          </div>

          <PasswordField
            id="confirm" name="confirm" label={t('form.confirm')} placeholder={t('form.confirm_ph')}
            value={form.confirm} onChange={handleChange} error={errors.confirm} t={t} />

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => navigate('/settings')}
              className="px-5 py-2.5 text-gray-700 rounded-xl text-[15px] font-medium hover:bg-gray-100 transition-colors">
              {t('actions.cancel')}
            </button>
            <button
              type="submit"
              disabled={saving}
              className={`px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-[15px] font-semibold transition-colors flex items-center gap-2 ${
                saving ? 'opacity-70 cursor-not-allowed' : 'hover:bg-indigo-700'
              }`}>
              {saving && (
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {saving ? t('actions.saving') : t('actions.submit')}
            </button>
          </div>
        </form>

        {/* Tips */}
        <aside className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sticky top-24">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              {t('tips.title')}
            </h3>
            <ul className="space-y-2.5 text-[15px] text-gray-600">
              {['item1', 'item2', 'item3', 'item4'].map(k => (
                <li key={k} className="flex gap-2">
                  <svg className="w-4 h-4 text-green-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                  {t(`tips.${k}`)}
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </main>
  );
};

export default ChangePassword;

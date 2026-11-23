import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { authPost, getAuthConfig, oauthUrl } from '../utils/authApi';
import Turnstile from '../components/auth/Turnstile';
import { AuthShell, Alert, inputClass, SubmitButton, OAuthButtons } from '../components/auth/AuthShell';

/**
 * Masuk dengan email + kata sandi (diverifikasi server), lalu kode 2FA bila aktif.
 * Juga menangani kembalinya pengguna dari ORCID/Google (?challenge=, ?oauth_error=).
 */
const Login = () => {
  const { t } = useTranslation('auth');
  const { t: ta } = useTranslation('account');
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { login, user, loading: authLoading, refresh } = useAuth();

  const next = (() => {
    const n = params.get('next') || '';
    return n.startsWith('/') && !n.startsWith('//') ? n : '/dashboard';
  })();

  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [captcha, setCaptcha] = useState(null);
  const [captchaReset, setCaptchaReset] = useState(0);
  const [formData, setFormData] = useState({ email: '', password: '', rememberMe: false });
  const [errors, setErrors] = useState({});
  const [unverifiedEmail, setUnverifiedEmail] = useState(null);

  // Langkah 2FA
  const [challenge, setChallenge] = useState(params.get('challenge') || null);
  const [twofaMethod, setTwofaMethod] = useState('totp');
  const [twofaCode, setTwofaCode] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => { getAuthConfig().then(setConfig); }, []);

  useEffect(() => {
    if (!authLoading && user && !challenge) navigate(next, { replace: true });
  }, [authLoading, user, challenge, navigate, next]);

  // Kembali dari login ORCID/Google
  useEffect(() => {
    const err = params.get('oauth_error');
    if (err) setErrors({ submit: ta(`oauth_errors.${err}`, { defaultValue: ta('oauth_errors.generic') }) });
    if (params.get('login') === 'oauth') refresh();
  }, [params, ta, refresh]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const e = {};
    if (!formData.email.trim()) e.email = t('login.errors.email_required');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) e.email = t('login.errors.email_invalid');
    if (!formData.password) e.password = t('login.errors.password_required');
    if (config?.turnstile_site_key && !captcha) e.captcha = t('login.errors.captcha');
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const finish = useCallback((data) => {
    login(data.user);
    toast.success(t('login.toast_success'));
    if (data.recovery_codes_left !== undefined) {
      toast(ta('twofa.recovery_left', { count: data.recovery_codes_left }), { icon: '⚠️', duration: 8000 });
    }
    navigate(next, { replace: true });
  }, [login, navigate, next, t, ta]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    setUnverifiedEmail(null);
    try {
      const data = await authPost('login', {
        email: formData.email.trim(),
        password: formData.password,
        remember: formData.rememberMe,
        captcha_token: captcha,
      });
      if (data.status === 'two_factor_required') {
        setChallenge(data.challenge);
        setTwofaMethod('totp');
        setTwofaCode('');
        setErrors({});
        return;
      }
      finish(data);
    } catch (err) {
      if (err.code === 'EMAIL_NOT_VERIFIED') setUnverifiedEmail(err.data?.email || formData.email.trim());
      setErrors({ submit: err.message || t('login.errors.generic') });
      setCaptchaReset(n => n + 1);
    } finally {
      setLoading(false);
    }
  };

  const handleTwofa = async (e) => {
    e.preventDefault();
    if (!twofaCode.trim()) { setErrors({ code: ta('twofa.code_required') }); return; }
    setLoading(true);
    try {
      const data = await authPost('login_2fa', { challenge, code: twofaCode.trim(), method: twofaMethod });
      finish(data);
    } catch (err) {
      if (err.code === 'CHALLENGE_EXPIRED' || err.code === 'RATE_LIMITED') {
        setChallenge(null);
        setErrors({ submit: err.message });
      } else {
        setErrors({ code: err.message });
      }
    } finally {
      setLoading(false);
    }
  };

  const sendEmailCode = async () => {
    try {
      await authPost('send_2fa_email', { challenge });
      setEmailSent(true);
      setTwofaMethod('email');
      toast.success(ta('twofa.email_sent'));
    } catch (err) {
      toast.error(err.message);
    }
  };

  const topLink = (
    <Link to="/register" className="text-[15px] font-medium text-gray-600 hover:text-indigo-600 transition-colors">
      {t('login.top_link')}
    </Link>
  );

  // ── Langkah 2: kode 2FA ──
  if (challenge) {
    const placeholder = twofaMethod === 'recovery' ? 'xxxxx-xxxxx' : '123456';
    return (
      <AuthShell title={ta('twofa.login_title')} subtitle={ta(`twofa.login_subtitle_${twofaMethod}`)} topLink={topLink}>
        {errors.submit && <Alert>{errors.submit}</Alert>}
        <form onSubmit={handleTwofa} className="space-y-5" noValidate>
          <div>
            <label htmlFor="code" className="block text-[15px] font-medium text-gray-700 mb-1.5">{ta('twofa.code_label')}</label>
            <input id="code" name="code" value={twofaCode} autoFocus
              onChange={(e) => { setTwofaCode(e.target.value); setErrors({}); }}
              inputMode={twofaMethod === 'recovery' ? 'text' : 'numeric'}
              autoComplete="one-time-code" placeholder={placeholder}
              className={`${inputClass(errors.code)} tracking-widest text-center text-lg`} />
            {errors.code && <p className="mt-1 text-sm text-red-600">{errors.code}</p>}
          </div>
          <SubmitButton loading={loading} loadingText={t('login.submitting')}>{ta('twofa.verify')}</SubmitButton>
        </form>
        <div className="mt-6 space-y-2 text-center text-[15px]">
          {twofaMethod !== 'totp' && (
            <button type="button" onClick={() => setTwofaMethod('totp')} className="block w-full text-indigo-600 hover:underline">
              {ta('twofa.use_app')}
            </button>
          )}
          {twofaMethod !== 'recovery' && (
            <button type="button" onClick={() => setTwofaMethod('recovery')} className="block w-full text-indigo-600 hover:underline">
              {ta('twofa.use_recovery')}
            </button>
          )}
          <button type="button" onClick={sendEmailCode} className="block w-full text-indigo-600 hover:underline">
            {emailSent ? ta('twofa.resend_email') : ta('twofa.use_email')}
          </button>
          <button type="button" onClick={() => { setChallenge(null); setErrors({}); }} className="block w-full text-gray-500 hover:underline">
            {ta('common.back')}
          </button>
        </div>
      </AuthShell>
    );
  }

  // ── Langkah 1: email & kata sandi ──
  return (
    <AuthShell title={t('login.title')} subtitle={t('login.subtitle')} topLink={topLink}>
      {errors.submit && (
        <Alert>
          {errors.submit}
          {unverifiedEmail && (
            <div className="mt-2">
              <Link to={`/verify-email?email=${encodeURIComponent(unverifiedEmail)}`} className="font-semibold underline">
                {ta('verify.enter_code_link')}
              </Link>
            </div>
          )}
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <div>
          <label htmlFor="email" className="block text-[15px] font-medium text-gray-700 mb-1.5">{t('login.email')}</label>
          <input type="email" id="email" name="email" value={formData.email} onChange={handleChange}
            className={inputClass(errors.email)} placeholder={t('login.email_ph')} autoComplete="email" />
          {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="password" className="block text-[15px] font-medium text-gray-700">{t('login.password')}</label>
            <Link to="/forgot-password" className="text-sm text-indigo-600 font-medium hover:text-indigo-700 hover:underline">
              {t('login.forgot')}
            </Link>
          </div>
          <div className="relative">
            <input type={showPassword ? 'text' : 'password'} id="password" name="password"
              value={formData.password} onChange={handleChange}
              className={`${inputClass(errors.password)} pr-16`} placeholder={t('login.password_ph')}
              autoComplete="current-password" />
            <button type="button" onClick={() => setShowPassword(s => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 hover:text-gray-700"
              aria-label={showPassword ? t('login.hide') : t('login.show')}>
              {showPassword ? t('login.hide') : t('login.show')}
            </button>
          </div>
          {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" name="rememberMe" checked={formData.rememberMe} onChange={handleChange}
            className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" />
          <span className="text-[15px] text-gray-700">{t('login.remember')}</span>
        </label>

        {config?.turnstile_site_key && (
          <>
            <Turnstile siteKey={config.turnstile_site_key} onToken={setCaptcha} resetKey={captchaReset} />
            {errors.captcha && <p className="mt-1 text-sm text-red-600 text-center">{errors.captcha}</p>}
            <p className="text-xs text-gray-500 text-center -mt-1">{t('login.captcha_footer')}</p>
          </>
        )}

        <SubmitButton loading={loading} disabled={!config || (config.turnstile_site_key && !captcha)} loadingText={t('login.submitting')}>
          {t('login.submit')}
        </SubmitButton>
      </form>

      <OAuthButtons oauth={config?.oauth} dividerText={t('login.divider')}
        hrefFor={(p) => oauthUrl(p, { next, remember: formData.rememberMe })} />

      <p className="text-center text-[15px] text-gray-600 mt-6">
        {t('login.footer_link')} <Link to="/register" className="text-indigo-600 font-semibold hover:underline">{t('login.footer_link_cta')}</Link>
      </p>
    </AuthShell>
  );
};

export default Login;

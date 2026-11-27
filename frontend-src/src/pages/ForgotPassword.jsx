import React, { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { authPost, getAuthConfig } from '../utils/authApi';
import Turnstile from '../components/auth/Turnstile';
import { AuthShell, Alert, inputClass, SubmitButton } from '../components/auth/AuthShell';

/** Meminta tautan reset kata sandi. Respons selalu sama agar keberadaan akun tidak bocor. */
const ForgotPassword = () => {
  const { t } = useTranslation('account');
  const [config, setConfig] = useState(null);
  const [email, setEmail] = useState('');
  const [captcha, setCaptcha] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState('');

  useEffect(() => { getAuthConfig().then(setConfig); }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError(t('forgot.invalid_email')); return; }
    setLoading(true);
    try {
      const data = await authPost('forgot_password', { email: email.trim(), captcha_token: captcha });
      setDone(data.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title={t('forgot.title')} subtitle={t('forgot.subtitle')}>
      {error && <Alert>{error}</Alert>}
      {done ? (
        <Alert type="success">{done}</Alert>
      ) : (
        <form onSubmit={submit} className="space-y-5" noValidate>
          <div>
            <label htmlFor="email" className="block text-[15px] font-medium text-gray-700 mb-1.5">{t('common.email')}</label>
            <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)}
              className={inputClass(false)} autoComplete="email" />
          </div>
          {config?.turnstile_site_key && <Turnstile siteKey={config.turnstile_site_key} onToken={setCaptcha} />}
          <SubmitButton loading={loading} disabled={!config || (config.turnstile_site_key && !captcha)} loadingText={t('common.processing')}>
            {t('forgot.submit')}
          </SubmitButton>
        </form>
      )}
      <p className="mt-6 text-center text-[15px]">
        <Link to="/login" className="text-indigo-600 hover:underline">{t('common.back_to_login')}</Link>
      </p>
    </AuthShell>
  );
};

export default ForgotPassword;

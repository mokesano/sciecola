import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { authPost } from '../utils/authApi';
import { AuthShell, Alert, inputClass, SubmitButton } from '../components/auth/AuthShell';

/**
 * Verifikasi email: lewat tautan di email (?token=…) atau kode 6 digit.
 * Setelah berhasil pengguna langsung masuk (atau diminta kode 2FA bila aktif).
 */
const VerifyEmail = () => {
  const { t } = useTranslation('account');
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { login } = useAuth();
  const token = params.get('token') || '';

  const [email, setEmail] = useState(params.get('email') || '');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const tried = useRef(false);

  const onVerified = (data) => {
    if (data.status === 'two_factor_required') {
      navigate(`/login?challenge=${encodeURIComponent(data.challenge)}`, { replace: true });
      return;
    }
    login(data.user);
    toast.success(t('verify.success'));
    navigate('/dashboard', { replace: true });
  };

  useEffect(() => {
    if (!token || tried.current) return;
    tried.current = true;
    setLoading(true);
    authPost('verify_email', { token })
      .then(onVerified)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !/^\d{6}$/.test(code.trim())) { setError(t('verify.invalid_input')); return; }
    setLoading(true);
    try {
      onVerified(await authPost('verify_email', { email: email.trim(), code: code.trim() }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    setError(''); setInfo('');
    if (!email.trim()) { setError(t('verify.email_required')); return; }
    try {
      const data = await authPost('resend_verification', { email: email.trim() });
      setInfo(data.message);
    } catch (err) {
      setError(err.message);
    }
  };

  if (token && loading) {
    return (
      <AuthShell title={t('verify.title')} subtitle={t('verify.checking')}>
        <div className="flex justify-center py-6">
          <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title={t('verify.title')} subtitle={t('verify.subtitle')}>
      {error && <Alert>{error}</Alert>}
      {info && <Alert type="success">{info}</Alert>}
      <form onSubmit={submit} className="space-y-5" noValidate>
        <div>
          <label htmlFor="email" className="block text-[15px] font-medium text-gray-700 mb-1.5">{t('common.email')}</label>
          <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)}
            className={inputClass(false)} autoComplete="email" />
        </div>
        <div>
          <label htmlFor="code" className="block text-[15px] font-medium text-gray-700 mb-1.5">{t('verify.code_label')}</label>
          <input id="code" value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            inputMode="numeric" autoComplete="one-time-code" placeholder="123456"
            className={`${inputClass(false)} tracking-[0.5em] text-center text-lg`} />
        </div>
        <SubmitButton loading={loading} loadingText={t('common.processing')}>{t('verify.submit')}</SubmitButton>
      </form>
      <div className="mt-6 text-center text-[15px] space-y-2">
        <button type="button" onClick={resend} className="text-indigo-600 hover:underline">{t('verify.resend')}</button>
        <p><Link to="/login" className="text-gray-500 hover:underline">{t('common.back_to_login')}</Link></p>
      </div>
    </AuthShell>
  );
};

export default VerifyEmail;

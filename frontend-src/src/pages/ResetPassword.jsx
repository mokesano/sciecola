import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { authPost } from '../utils/authApi';
import { AuthShell, Alert, inputClass, SubmitButton } from '../components/auth/AuthShell';

/** Menetapkan kata sandi baru dari tautan reset (?token=…). Semua sesi lama dicabut. */
const ResetPassword = () => {
  const { t } = useTranslation('account');
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) { setError(t('reset.too_short')); return; }
    if (password !== confirm) { setError(t('reset.mismatch')); return; }
    setLoading(true);
    try {
      await authPost('reset_password', { token, password });
      toast.success(t('reset.success'));
      navigate('/login', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <AuthShell title={t('reset.title')}>
        <Alert>{t('reset.missing_token')}</Alert>
        <p className="text-center"><Link to="/forgot-password" className="text-indigo-600 hover:underline">{t('reset.request_new')}</Link></p>
      </AuthShell>
    );
  }

  return (
    <AuthShell title={t('reset.title')} subtitle={t('reset.subtitle')}>
      {error && <Alert>{error}</Alert>}
      <form onSubmit={submit} className="space-y-5" noValidate>
        <div>
          <label htmlFor="pw" className="block text-[15px] font-medium text-gray-700 mb-1.5">{t('reset.new')}</label>
          <input id="pw" type="password" value={password} onChange={e => setPassword(e.target.value)}
            className={inputClass(false)} autoComplete="new-password" />
        </div>
        <div>
          <label htmlFor="pw2" className="block text-[15px] font-medium text-gray-700 mb-1.5">{t('reset.confirm')}</label>
          <input id="pw2" type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
            className={inputClass(false)} autoComplete="new-password" />
        </div>
        <SubmitButton loading={loading} loadingText={t('common.processing')}>{t('reset.submit')}</SubmitButton>
      </form>
      <p className="mt-6 text-center text-[15px]">
        <Link to="/forgot-password" className="text-indigo-600 hover:underline">{t('reset.request_new')}</Link>
      </p>
    </AuthShell>
  );
};

export default ResetPassword;

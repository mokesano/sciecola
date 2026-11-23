import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { authPost, getAuthConfig, oauthUrl } from '../utils/authApi';
import Turnstile from '../components/auth/Turnstile';
import { AuthShell, Alert, inputClass, SubmitButton, OAuthButtons } from '../components/auth/AuthShell';

const STRENGTH_META = [
  { color: 'bg-red-500',    width: '20%'  },
  { color: 'bg-orange-500', width: '40%'  },
  { color: 'bg-yellow-500', width: '60%'  },
  { color: 'bg-blue-500',   width: '80%'  },
  { color: 'bg-green-500',  width: '100%' },
];

/**
 * Pendaftaran akun. Server membuat akun (sandi di-hash bcrypt) lalu mengirim kode
 * verifikasi ke email. Versi lama hanya menunggu 1,5 detik lalu pindah ke halaman
 * verifikasi yang tidak ada, tanpa menyimpan apa pun.
 *
 * ?orcid_claim=…&orcid=…&name=… datang dari "Masuk dengan ORCID" untuk iD yang belum
 * punya akun: ORCID itu sudah dibuktikan pemiliknya dan ikut ditautkan.
 */
const Register = () => {
  const { t } = useTranslation('auth');
  const { t: ta } = useTranslation('account');
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { user, login } = useAuth();

  const orcidClaim = params.get('orcid_claim') || '';
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [captcha, setCaptcha] = useState(null);
  const [captchaReset, setCaptchaReset] = useState(0);
  const [formData, setFormData] = useState({
    fullName: params.get('name') || '',
    email: '',
    orcid: params.get('orcid') || '',
    password: '',
    confirmPassword: '',
    agreeTerms: false,
  });
  const [errors, setErrors] = useState({});

  useEffect(() => { getAuthConfig().then(setConfig); }, []);
  useEffect(() => { if (user) navigate('/dashboard', { replace: true }); }, [user, navigate]);

  let strength = 0;
  if (formData.password.length >= 8) strength++;
  if (/[A-Z]/.test(formData.password)) strength++;
  if (/[0-9]/.test(formData.password)) strength++;
  if (/[^A-Za-z0-9]/.test(formData.password)) strength++;
  const strengthIndex = Math.min(strength, STRENGTH_META.length - 1);
  const strengthInfo  = STRENGTH_META[strengthIndex];

  // Bila login ORCID tersedia, ORCID ditautkan lewat ORCID (bukti kepemilikan), bukan diketik.
  const orcidLocked = Boolean(orcidClaim);
  const orcidTypable = !orcidLocked && config && !config.oauth?.orcid;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const e = {};
    const min = config?.password_min_length || 8;
    if (!formData.fullName.trim()) e.fullName = t('register.errors.full_name_required');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) e.email = t('register.errors.email_invalid');
    if (orcidTypable && formData.orcid && !/^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/i.test(formData.orcid)) {
      e.orcid = t('register.errors.orcid_invalid');
    }
    if (formData.password.length < min) e.password = t('register.errors.password_short');
    if (formData.password !== formData.confirmPassword) e.confirmPassword = t('register.errors.confirm_mismatch');
    if (!formData.agreeTerms) e.agreeTerms = t('register.errors.terms_required');
    if (config?.turnstile_site_key && !captcha) e.captcha = t('register.errors.captcha');
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    try {
      const data = await authPost('register', {
        name: formData.fullName.trim(),
        email: formData.email.trim(),
        password: formData.password,
        orcid: orcidTypable ? formData.orcid.trim().toUpperCase() : '',
        orcid_claim: orcidClaim || undefined,
        captcha_token: captcha,
      });
      if (data.status === 'success' && data.user) {
        // Verifikasi email dimatikan di server: langsung masuk.
        login(data.user);
        navigate('/dashboard', { replace: true });
        return;
      }
      toast.success(t('register.toast_success'));
      navigate(`/verify-email?email=${encodeURIComponent(data.email || formData.email.trim())}`, { replace: true });
    } catch (err) {
      const fieldMap = { fullName: 'fullName', email: 'email', password: 'password', orcid: 'orcid', captcha: 'captcha' };
      if (err.field && fieldMap[err.field]) setErrors({ [fieldMap[err.field]]: err.message });
      else setErrors({ submit: err.message || t('register.errors.submit') });
      setCaptchaReset(n => n + 1);
    } finally {
      setLoading(false);
    }
  };

  const topLink = (
    <Link to="/login" className="text-[15px] font-medium text-gray-600 hover:text-indigo-600 transition-colors">
      {t('register.top_link')}
    </Link>
  );

  return (
    <AuthShell title={t('register.title')} subtitle={t('register.subtitle')} topLink={topLink}>
      {config?.registration_open === false && <Alert type="info">{ta('register.closed')}</Alert>}
      {errors.submit && <Alert>{errors.submit}</Alert>}
      {orcidLocked && <Alert type="info">{ta('register.orcid_verified', { orcid: formData.orcid })}</Alert>}

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <div>
          <label htmlFor="fullName" className="block text-[15px] font-medium text-gray-700 mb-1.5">{t('register.full_name')}</label>
          <input type="text" id="fullName" name="fullName" value={formData.fullName} onChange={handleChange}
            className={inputClass(errors.fullName)} placeholder={t('register.full_name_ph')} autoComplete="name" />
          {errors.fullName && <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>}
        </div>

        <div>
          <label htmlFor="email" className="block text-[15px] font-medium text-gray-700 mb-1.5">{t('register.email')}</label>
          <input type="email" id="email" name="email" value={formData.email} onChange={handleChange}
            className={inputClass(errors.email)} placeholder={t('register.email_ph')} autoComplete="email" />
          {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
        </div>

        {(orcidLocked || orcidTypable) && (
          <div>
            <label htmlFor="orcid" className="block text-[15px] font-medium text-gray-700 mb-1.5">
              {t('register.orcid')} {!orcidLocked && <span className="text-gray-400 font-normal">{t('register.orcid_optional')}</span>}
            </label>
            <input type="text" id="orcid" name="orcid" value={formData.orcid} onChange={handleChange}
              readOnly={orcidLocked}
              className={`${inputClass(errors.orcid)} ${orcidLocked ? 'bg-gray-100 text-gray-600' : ''}`}
              placeholder={t('register.orcid_ph')} />
            {errors.orcid && <p className="mt-1 text-sm text-red-600">{errors.orcid}</p>}
            {orcidTypable && <p className="mt-1 text-sm text-gray-500">{ta('register.orcid_unverified_note')}</p>}
          </div>
        )}

        <div>
          <label htmlFor="password" className="block text-[15px] font-medium text-gray-700 mb-1.5">{t('register.password')}</label>
          <div className="relative">
            <input type={showPassword ? 'text' : 'password'} id="password" name="password" value={formData.password}
              onChange={handleChange} className={`${inputClass(errors.password)} pr-16`}
              placeholder={t('register.password_ph')} autoComplete="new-password" />
            <button type="button" onClick={() => setShowPassword(s => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 hover:text-gray-700">
              {showPassword ? t('login.hide') : t('login.show')}
            </button>
          </div>
          {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
          {formData.password && (
            <div className="mt-2">
              <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div className={`h-full ${strengthInfo.color} transition-all duration-300`} style={{ width: strengthInfo.width }} />
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {t('register.strength')} <span className="font-medium">{t(`register.strength_labels.${strengthIndex}`)}</span>
              </p>
            </div>
          )}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-[15px] font-medium text-gray-700 mb-1.5">{t('register.confirm')}</label>
          <input type={showPassword ? 'text' : 'password'} id="confirmPassword" name="confirmPassword"
            value={formData.confirmPassword} onChange={handleChange}
            className={inputClass(errors.confirmPassword)} placeholder={t('register.confirm_ph')} autoComplete="new-password" />
          {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
        </div>

        {config?.turnstile_site_key && (
          <div>
            <Turnstile siteKey={config.turnstile_site_key} onToken={setCaptcha} resetKey={captchaReset} />
            {errors.captcha && <p className="mt-1 text-sm text-red-600 text-center">{errors.captcha}</p>}
            <p className="text-xs text-gray-500 text-center mt-1">{t('register.captcha_footer')}</p>
          </div>
        )}

        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" name="agreeTerms" checked={formData.agreeTerms} onChange={handleChange}
            className="mt-1 w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" />
          <span className="text-[15px] text-gray-700">
            {t('register.terms')}{' '}
            <Link to="/terms" className="text-indigo-600 hover:underline font-medium">{t('register.terms_link')}</Link>
            {' '}{t('register.terms_and')}{' '}
            <Link to="/privacy" className="text-indigo-600 hover:underline font-medium">{t('register.privacy_link')}</Link>
            {' '}{t('register.terms_suffix')}
          </span>
        </label>
        {errors.agreeTerms && <p className="text-sm text-red-600 -mt-3">{errors.agreeTerms}</p>}

        <SubmitButton loading={loading} disabled={!config || config.registration_open === false || (config.turnstile_site_key && !captcha)} loadingText={t('register.submitting')}>
          {t('register.submit')}
        </SubmitButton>
      </form>

      {!orcidLocked && (
        <OAuthButtons oauth={config?.oauth} dividerText={t('register.divider')} hrefFor={(p) => oauthUrl(p)} />
      )}

      <p className="text-center text-[15px] text-gray-600 mt-6">
        {t('register.footer_link')} <Link to="/login" className="text-indigo-600 font-semibold hover:underline">{t('register.footer_link_cta')}</Link>
      </p>
    </AuthShell>
  );
};

export default Register;

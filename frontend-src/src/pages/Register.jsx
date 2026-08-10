import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

const STRENGTH_META = [
  { color: 'bg-red-500',    width: '20%'  },
  { color: 'bg-orange-500', width: '40%'  },
  { color: 'bg-yellow-500', width: '60%'  },
  { color: 'bg-blue-500',   width: '80%'  },
  { color: 'bg-green-500',  width: '100%' },
];

const Register = () => {
  const { t } = useTranslation('auth');
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState(null);
  const [, setTurnstileLoaded] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    orcid: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false
  });

  const [errors, setErrors] = useState({});
  const [passwordStrength, setPasswordStrength] = useState(0);

  const turnstileContainerRef = useRef(null);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad&render=explicit';
    script.async = true;
    script.defer = true;
    script.onload = () => { if (window.turnstile) setTurnstileLoaded(true); };
    document.head.appendChild(script);

    window.onTurnstileLoad = () => {
      if (window.turnstile && turnstileContainerRef.current) {
        window.turnstile.render(turnstileContainerRef.current, {
          sitekey: 'YOUR_CLOUDFLARE_TURNSTILE_SITE_KEY',
          theme: 'light',
          size: 'normal',
          callback: (token) => setTurnstileToken(token),
          'error-callback': () => setTurnstileToken(null)
        });
      }
    };

    return () => {
      if (window.turnstile) window.turnstile.reset();
      if (document.head.contains(script)) document.head.removeChild(script);
    };
  }, []);

  useEffect(() => {
    const { password } = formData;
    let strength = 0;
    if (password.length >= 8)         strength++;
    if (/[A-Z]/.test(password))       strength++;
    if (/[0-9]/.test(password))       strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    setPasswordStrength(strength);
  }, [formData.password]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.fullName.trim())                                       newErrors.fullName        = t('register.errors.full_name_required');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))              newErrors.email           = t('register.errors.email_invalid');
    if (formData.orcid && !/^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/.test(formData.orcid)) {
      newErrors.orcid = t('register.errors.orcid_invalid');
    }
    if (formData.password.length < 8)                                    newErrors.password        = t('register.errors.password_short');
    if (formData.password !== formData.confirmPassword)                  newErrors.confirmPassword = t('register.errors.confirm_mismatch');
    if (!formData.agreeTerms)                                            newErrors.agreeTerms      = t('register.errors.terms_required');
    if (!turnstileToken)                                                 newErrors.captcha         = t('register.errors.captcha');
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);

    try {
      const recaptchaToken = await window.grecaptcha.execute('YOUR_RECAPTCHA_V3_SITE_KEY', { action: 'register' });
      // eslint-disable-next-line no-unused-vars
      const payload = {
        ...formData,
        turnstileToken,
        recaptchaToken,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString()
      };

      await new Promise(resolve => setTimeout(resolve, 1500));
      // TODO: swap with real fetch to /api/auth/register

      window.turnstile?.reset();
      toast.success(t('register.toast_success'));
      navigate('/auth/verify-email', { state: { email: formData.email } });
    } catch (error) {
      console.error('Registration failed:', error);
      toast.error(t('register.toast_error'));
      setErrors({ submit: t('register.errors.submit') });
    } finally {
      setLoading(false);
    }
  };

  const strengthIndex = Math.min(passwordStrength, STRENGTH_META.length - 1);
  const strengthInfo  = STRENGTH_META[strengthIndex];
  const strengthLabel = t(`register.strength_labels.${strengthIndex}`);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold text-indigo-600">{t('brand')}</Link>
          <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors">
            {t('register.top_link')}
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg bg-white rounded-2xl border border-gray-200 shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900">{t('register.title')}</h1>
            <p className="text-gray-600 mt-2">{t('register.subtitle')}</p>
          </div>

          {errors.submit && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center gap-2">
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {errors.submit}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* Full Name */}
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1.5">{t('register.full_name')}</label>
              <input
                type="text" id="fullName" name="fullName" value={formData.fullName} onChange={handleChange}
                className={`w-full px-4 py-3 bg-gray-50 border rounded-xl text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all ${errors.fullName ? 'border-red-300 focus:ring-red-500' : 'border-gray-200'}`}
                placeholder={t('register.full_name_ph')}
              />
              {errors.fullName && <p className="mt-1 text-xs text-red-600">{errors.fullName}</p>}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">{t('register.email')}</label>
              <input
                type="email" id="email" name="email" value={formData.email} onChange={handleChange}
                className={`w-full px-4 py-3 bg-gray-50 border rounded-xl text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all ${errors.email ? 'border-red-300 focus:ring-red-500' : 'border-gray-200'}`}
                placeholder={t('register.email_ph')}
              />
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
            </div>

            {/* ORCID */}
            <div>
              <label htmlFor="orcid" className="block text-sm font-medium text-gray-700 mb-1.5">
                {t('register.orcid')} <span className="text-gray-400 font-normal">{t('register.orcid_optional')}</span>
              </label>
              <input
                type="text" id="orcid" name="orcid" value={formData.orcid} onChange={handleChange}
                className={`w-full px-4 py-3 bg-gray-50 border rounded-xl text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all ${errors.orcid ? 'border-red-300 focus:ring-red-500' : 'border-gray-200'}`}
                placeholder={t('register.orcid_ph')}
              />
              {errors.orcid && <p className="mt-1 text-xs text-red-600">{errors.orcid}</p>}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">{t('register.password')}</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'} id="password" name="password" value={formData.password} onChange={handleChange}
                  className={`w-full px-4 py-3 bg-gray-50 border rounded-xl text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all pr-10 ${errors.password ? 'border-red-300 focus:ring-red-500' : 'border-gray-200'}`}
                  placeholder={t('register.password_ph')}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}

              {/* Strength Meter */}
              {formData.password && (
                <div className="mt-2">
                  <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div className={`h-full ${strengthInfo.color} transition-all duration-300`} style={{ width: strengthInfo.width }}></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{t('register.strength')} <span className="font-medium">{strengthLabel}</span></p>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1.5">{t('register.confirm')}</label>
              <input
                type={showPassword ? 'text' : 'password'} id="confirmPassword" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange}
                className={`w-full px-4 py-3 bg-gray-50 border rounded-xl text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all ${errors.confirmPassword ? 'border-red-300 focus:ring-red-500' : 'border-gray-200'}`}
                placeholder={t('register.confirm_ph')}
              />
              {errors.confirmPassword && <p className="mt-1 text-xs text-red-600">{errors.confirmPassword}</p>}
            </div>

            {/* Cloudflare Turnstile */}
            <div>
              <div id="turnstile-container" ref={turnstileContainerRef} className="flex justify-center"></div>
              {errors.captcha && <p className="mt-1 text-xs text-red-600 text-center">{errors.captcha}</p>}
              <p className="text-[10px] text-gray-500 text-center mt-1">{t('register.captcha_footer')}</p>
            </div>

            {/* Terms & Privacy */}
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox" name="agreeTerms" checked={formData.agreeTerms} onChange={handleChange}
                className="mt-1 w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700">
                {t('register.terms')}{' '}
                <Link to="/terms" className="text-indigo-600 hover:underline font-medium">{t('register.terms_link')}</Link>
                {' '}{t('register.terms_and')}{' '}
                <Link to="/privacy" className="text-indigo-600 hover:underline font-medium">{t('register.privacy_link')}</Link>
                {' '}{t('register.terms_suffix')}
              </span>
            </label>
            {errors.agreeTerms && <p className="text-xs text-red-600 -mt-3">{errors.agreeTerms}</p>}

            {/* Submit Button */}
            <button
              type="submit" disabled={loading || !turnstileToken}
              className="w-full py-3.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-md flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {t('register.submitting')}
                </>
              ) : (
                t('register.submit')
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
            <div className="relative flex justify-center text-xs"><span className="px-2 bg-white text-gray-500">{t('register.divider')}</span></div>
          </div>

          {/* Social Login Placeholder */}
          <div className="grid grid-cols-2 gap-3">
            <button className="flex items-center justify-center gap-2 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4" />
              Google
            </button>
            <button className="flex items-center justify-center gap-2 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              <img src="https://orcid.org/sites/default/files/images/orcid_16x16.png" alt="ORCID" className="w-4 h-4" />
              ORCID
            </button>
          </div>

          {/* Footer Link */}
          <p className="text-center text-sm text-gray-600 mt-6">
            {t('register.footer_link')} <Link to="/login" className="text-indigo-600 font-semibold hover:underline">{t('register.footer_link_cta')}</Link>
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-gray-500">
          {t('footer', { year: new Date().getFullYear() })}
        </div>
      </footer>
    </div>
  );
};

export default Register;

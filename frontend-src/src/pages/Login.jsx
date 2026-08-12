import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const { t } = useTranslation('auth');
  const navigate = useNavigate();
  const { login, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState(null);
  const [, setTurnstileLoaded] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });

  const [errors, setErrors] = useState({});

  const turnstileContainerRef = useRef(null);

  useEffect(() => {
    if (user?.orcid) navigate('/dashboard');
  }, [user, navigate]);

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
    const script = document.createElement('script');
    script.src = 'https://www.google.com/recaptcha/api.js?render=YOUR_RECAPTCHA_V3_SITE_KEY';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
    return () => { if (document.head.contains(script)) document.head.removeChild(script); };
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email.trim())                                     newErrors.email    = t('login.errors.email_required');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))    newErrors.email    = t('login.errors.email_invalid');
    if (!formData.password)                                         newErrors.password = t('login.errors.password_required');
    if (!turnstileToken)                                            newErrors.captcha  = t('login.errors.captcha');
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);

    try {
      const recaptchaToken = await new Promise((resolve) => {
        if (window.grecaptcha) {
          window.grecaptcha.ready(() => {
            window.grecaptcha.execute('YOUR_RECAPTCHA_V3_SITE_KEY', { action: 'login' })
              .then(resolve).catch(() => resolve(''));
          });
        } else {
          resolve('');
        }
      });

      const payload = new FormData();
      payload.append('action', 'login');
      payload.append('email', formData.email);
      payload.append('password', formData.password);
      payload.append('turnstileToken', turnstileToken);
      payload.append('recaptchaToken', recaptchaToken);

      const response = await fetch('/api/auth.php', { method: 'POST', body: payload });
      const data = await response.json();

      if (!data.status || data.status !== 'success') {
        throw new Error(data.message || t('login.errors.login_failed'));
      }

      const { token, user: authedUser } = data;
      login(authedUser, token);

      window.turnstile?.reset();
      toast.success(t('login.toast_success'));
      navigate('/dashboard');
    } catch (error) {
      console.error('Login failed:', error);
      const errorMsg = error.message || t('login.errors.generic');
      toast.error(errorMsg);
      setErrors({ submit: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => navigate('/auth/forgot-password');

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold text-indigo-600">{t('brand')}</Link>
          <Link to="/register" className="text-[15px] font-medium text-gray-600 hover:text-indigo-600 transition-colors">
            {t('login.top_link')}
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg bg-white rounded-2xl border border-gray-200 shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900">{t('login.title')}</h1>
            <p className="text-gray-600 mt-2">{t('login.subtitle')}</p>
          </div>

          {errors.submit && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-[15px] text-red-700 flex items-center gap-2">
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {errors.submit}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-[15px] font-medium text-gray-700 mb-1.5">{t('login.email')}</label>
              <input
                type="email" id="email" name="email" value={formData.email} onChange={handleChange}
                className={`w-full px-4 py-3 bg-gray-50 border rounded-xl text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all ${errors.email ? 'border-red-300 focus:ring-red-500' : 'border-gray-200'}`}
                placeholder={t('login.email_ph')}
                autoComplete="email"
              />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-[15px] font-medium text-gray-700">{t('login.password')}</label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-sm text-indigo-600 font-medium hover:text-indigo-700 hover:underline"
                >
                  {t('login.forgot')}
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 bg-gray-50 border rounded-xl text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all pr-10 ${errors.password ? 'border-red-300 focus:ring-red-500' : 'border-gray-200'}`}
                  placeholder={t('login.password_ph')}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label={showPassword ? t('login.hide') : t('login.show')}
                >
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
              {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
            </div>

            {/* Remember Me */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleChange}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <span className="text-[15px] text-gray-700">{t('login.remember')}</span>
            </label>

            {/* Cloudflare Turnstile */}
            <div className="flex justify-center">
              <div id="turnstile-container" ref={turnstileContainerRef} className="flex justify-center"></div>
            </div>
            {errors.captcha && <p className="mt-1 text-sm text-red-600 text-center">{errors.captcha}</p>}
            <p className="text-xs text-gray-500 text-center -mt-1">{t('login.captcha_footer')}</p>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !turnstileToken}
              className="w-full py-3.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-md flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {t('login.submitting')}
                </>
              ) : (
                t('login.submit')
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
            <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-gray-500">{t('login.divider')}</span></div>
          </div>

          {/* Social Login Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => navigate('/auth/orcid-login')}
              className="flex items-center justify-center gap-2 py-2.5 border border-gray-200 rounded-xl text-[15px] font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors"
            >
              <img src="https://orcid.org/sites/default/files/images/orcid_16x16.png" alt="ORCID" className="w-4 h-4" />
              ORCID
            </button>
            <button
              onClick={() => navigate('/auth/google-login')}
              className="flex items-center justify-center gap-2 py-2.5 border border-gray-200 rounded-xl text-[15px] font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors"
            >
              <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4" />
              Google
            </button>
          </div>

          {/* Footer Link */}
          <p className="text-center text-[15px] text-gray-600 mt-6">
            {t('login.footer_link')} <Link to="/register" className="text-indigo-600 font-semibold hover:underline">{t('login.footer_link_cta')}</Link>
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-500">
          {t('footer', { year: new Date().getFullYear() })}
        </div>
      </footer>
    </div>
  );
};

export default Login;
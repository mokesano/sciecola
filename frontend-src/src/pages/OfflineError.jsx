import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const OfflineError = () => {
  const { t } = useTranslation();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastChecked, setLastChecked] = useState(new Date());

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setLastChecked(new Date());
    };

    const handleOffline = () => {
      setIsOnline(false);
      setLastChecked(new Date());
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check connection periodically
    const checkInterval = setInterval(() => {
      setIsOnline(navigator.onLine);
      setLastChecked(new Date());
    }, 5000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(checkInterval);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full text-center">
        {/* Animated Icon */}
        <div className="mb-8 relative">
          <div className="absolute inset-0 blur-3xl opacity-30 bg-gradient-to-r from-gray-400 to-blue-400 rounded-full animate-pulse"></div>
          <svg
            className={`w-32 h-32 mx-auto relative z-10 transition-colors duration-500 ${
              isOnline ? 'text-green-600' : 'text-gray-400'
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {isOnline ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            ) : (
              <>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M1 1l22 22"
                />
              </>
            )}
          </svg>
        </div>

        {/* Status Badge */}
        <div className="mb-6">
          <span
            className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${
              isOnline
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            <span
              className={`w-2 h-2 mr-2 rounded-full ${
                isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'
              }`}
            ></span>
            {isOnline
              ? t('error.statusOnline', 'Online')
              : t('error.statusOffline', 'Offline')}
          </span>
        </div>

        {/* Main Message */}
        {isOnline ? (
          <>
            <h1 className="text-4xl font-extrabold text-gray-900 mb-4">
              {t('error.connectionRestored', 'Koneksi Terpulihkan!')}
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              {t(
                'error.connectionRestoredDescription',
                'Koneksi internet Anda telah kembali. Halaman akan dimuat ulang secara otomatis.'
              )}
            </p>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8">
              <div className="flex items-center justify-center space-x-2">
                <svg
                  className="w-6 h-6 text-green-600 animate-spin"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                <span className="text-green-800 font-medium">
                  {t('error.reloading', 'Memuat ulang...')}
                </span>
              </div>
            </div>
          </>
        ) : (
          <>
            <h1 className="text-4xl font-extrabold text-gray-900 mb-4">
              {t('error.noConnection', 'Tidak Ada Koneksi Internet')}
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              {t(
                'error.noConnectionDescription',
                'Sepertinya Anda kehilangan koneksi internet. Periksa pengaturan jaringan Anda dan coba lagi.'
              )}
            </p>

            {/* Troubleshooting Tips */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-100">
              <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">
                {t('error.troubleshootingTips', 'Tips Troubleshooting')}
              </h3>
              <ul className="text-left text-gray-600 space-y-3">
                <li className="flex items-start">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold mr-3">
                    1
                  </span>
                  <span>{t('error.tip1', 'Periksa kabel WiFi atau Ethernet Anda')}</span>
                </li>
                <li className="flex items-start">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold mr-3">
                    2
                  </span>
                  <span>{t('error.tip2', 'Restart router/modem Anda')}</span>
                </li>
                <li className="flex items-start">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold mr-3">
                    3
                  </span>
                  <span>{t('error.tip3', 'Aktifkan mode pesawat selama 10 detik, lalu matikan')}</span>
                </li>
                <li className="flex items-start">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold mr-3">
                    4
                  </span>
                  <span>{t('error.tip4', 'Hubungi penyedia internet jika masalah berlanjut')}</span>
                </li>
              </ul>
            </div>

            {/* Retry Button */}
            <button
              onClick={() => {
                setIsOnline(navigator.onLine);
                setLastChecked(new Date());
                if (navigator.onLine) {
                  window.location.reload();
                }
              }}
              className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-gradient-to-r from-gray-600 to-blue-600 hover:from-gray-700 hover:to-blue-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl mb-6"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              {t('error.retryConnection', 'Coba Lagi')}
            </button>
          </>
        )}

        {/* Last Checked */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            {t('error.lastChecked', 'Terakhir diperiksa:')}{' '}
            <span className="font-mono">
              {lastChecked.toLocaleTimeString()}
            </span>
          </p>
        </div>

        {/* Quick Links */}
        <div className="mt-6 flex flex-wrap justify-center gap-4">
          <Link
            to="/help"
            className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors flex items-center"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {t('menu.help', 'Bantuan')}
          </Link>
          <Link
            to="/contact"
            className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors flex items-center"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            {t('menu.contact', 'Kontak')}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OfflineError;

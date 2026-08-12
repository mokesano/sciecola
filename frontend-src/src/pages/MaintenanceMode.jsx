import React from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';

const MaintenanceMode = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl w-full text-center">
        {/* Animated Icon */}
        <div className="mb-8 relative">
          <div className="absolute inset-0 blur-3xl opacity-30 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full animate-pulse"></div>
          <svg
            className="w-32 h-32 mx-auto text-indigo-600 relative z-10"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </div>

        {/* Main Message */}
        <h1 className="text-4xl font-extrabold text-gray-900 mb-4">
          {t('error.maintenanceMode', 'Sedang Dalam Pemeliharaan')}
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          {t(
            'error.maintenanceDescription',
            'Kami sedang melakukan peningkatan sistem untuk memberikan pengalaman yang lebih baik.'
          )}
        </p>

        {/* Progress/Status Box */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8 border border-gray-100">
          <div className="flex items-center justify-center space-x-4 mb-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <span className="text-lg font-semibold text-indigo-600">
              {t('error.maintenanceInProgress', 'Pemeliharaan Sedang Berlangsung')}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-4 mb-4 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 h-4 rounded-full animate-pulse w-3/4"></div>
          </div>

          <p className="text-[15px] text-gray-600">
            {t('error.expectedCompletion', 'Perkiraan selesai:')}{' '}
            <span className="font-semibold text-indigo-600">
              {t('error.soon', 'Segera')}
            </span>
          </p>
        </div>

        {/* Information Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 mb-2 flex items-center justify-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {t('error.whatsBeingDone', 'Apa yang Dikerjakan?')}
            </h3>
            <ul className="text-[15px] text-blue-700 text-left space-y-1">
              <li>• {t('error.upgradeServer', 'Peningkatan kapasitas server')}</li>
              <li>• {t('error.improveSecurity', 'Peningkatan keamanan sistem')}</li>
              <li>• {t('error.optimizePerformance', 'Optimasi performa')}</li>
            </ul>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-800 mb-2 flex items-center justify-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {t('error.willBeAvailable', 'Akan Tersedia')}
            </h3>
            <ul className="text-[15px] text-green-700 text-left space-y-1">
              <li>• {t('error.fasterLoading', 'Waktu muat lebih cepat')}</li>
              <li>• {t('error.betterFeatures', 'Fitur yang lebih baik')}</li>
              <li>• {t('error.enhancedSecurity', 'Keamanan yang ditingkatkan')}</li>
            </ul>
          </div>
        </div>

        {/* Stay Updated */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-lg p-6 mb-8 text-white">
          <h3 className="text-lg font-semibold mb-4">{t('error.stayUpdated', 'Tetap Terupdate')}</h3>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/contact"
              className="inline-flex items-center justify-center px-6 py-3 border-2 border-white text-base font-medium rounded-lg text-white hover:bg-white hover:text-indigo-600 transition-all duration-200"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              {t('error.contactUs', 'Hubungi Kami')}
            </Link>
            <a
              href="https://twitter.com/sciecola"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-6 py-3 border-2 border-white text-base font-medium rounded-lg text-white hover:bg-white hover:text-indigo-600 transition-all duration-200"
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
              </svg>
              Twitter
            </a>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <p className="text-[15px] text-gray-600 mb-2">
            {t('error.needUrgentHelp', 'Butuh bantuan mendesak?')}
          </p>
          <a
            href="mailto:support@sciecola.com"
            className="text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
          >
            support@sciecola.com
          </a>
        </div>

        {/* Auto Refresh Notice */}
        <div className="mt-6 flex items-center justify-center space-x-2 text-[15px] text-gray-500">
          <div className="animate-pulse w-2 h-2 bg-green-500 rounded-full"></div>
          <span>{t('error.autoRefresh', 'Halaman akan refresh otomatis ketika selesai')}</span>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceMode;

import React from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';

const ServerError500 = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full text-center">
        {/* Animated 500 Number */}
        <div className="relative mb-8">
          <h1 className="text-9xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-orange-600 animate-pulse">
            500
          </h1>
          <div className="absolute inset-0 blur-3xl opacity-30 bg-gradient-to-r from-red-600 to-orange-600 rounded-full"></div>
        </div>

        {/* Icon */}
        <div className="mb-6">
          <svg
            className="w-24 h-24 mx-auto text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        {/* Message */}
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          {t('error.serverError', 'Kesalahan Server Internal')}
        </h2>
        <p className="text-lg text-gray-600 mb-8">
          {t(
            'error.serverErrorDescription',
            'Maaf, terjadi kesalahan pada server kami. Tim teknis kami telah diberitahu dan sedang bekerja untuk memperbaiki masalah ini.'
          )}
        </p>

        {/* Error Details Box */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-100">
          <h3 className="text-[15px] font-semibold text-gray-700 mb-3 uppercase tracking-wide">
            {t('error.whatHappened', 'Apa yang Terjadi?')}
          </h3>
          <p className="text-gray-600 text-left mb-4">
            {t(
              'error.serverOverloaded',
              'Server mengalami kesulitan memproses permintaan Anda. Ini bisa disebabkan oleh:'
            )}
          </p>
          <ul className="text-left text-gray-600 space-y-2">
            <li className="flex items-start">
              <span className="text-orange-500 mr-2">•</span>
              {t('error.reasonHighTraffic', 'Traffic yang sangat tinggi')}
            </li>
            <li className="flex items-start">
              <span className="text-orange-500 mr-2">•</span>
              {t('error.reasonMaintenance', 'Pemeliharaan server sedang berlangsung')}
            </li>
            <li className="flex items-start">
              <span className="text-orange-500 mr-2">•</span>
              {t('error.reasonTechnicalIssue', 'Masalah teknis sementara')}
            </li>
          </ul>
        </div>

        {/* Status Indicator */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <span className="text-blue-800 font-medium">
              {t('error.workingOnIt', 'Kami sedang bekerja untuk memperbaikinya...')}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
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
            {t('error.tryAgain', 'Coba Lagi')}
          </Link>

          <Link
            to="/system-status"
            className="inline-flex items-center justify-center px-8 py-3 border border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transform hover:scale-105 transition-all duration-200 shadow-md hover:shadow-lg"
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
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            {t('error.checkStatus', 'Cek Status Sistem')}
          </Link>

          <Link
            to="/contact"
            className="inline-flex items-center justify-center px-8 py-3 border border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transform hover:scale-105 transition-all duration-200 shadow-md hover:shadow-lg"
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
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            {t('error.contactSupport', 'Hubungi Support')}
          </Link>
        </div>

        {/* Reference ID */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-[15px] text-gray-500">
            {t('error.referenceId', 'ID Referensi:')}{' '}
            <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
              ERR-500-{Math.random().toString(36).substr(2, 9).toUpperCase()}
            </code>
          </p>
          <p className="text-sm text-gray-400 mt-2">
            {t('error.saveReference', 'Simpan ID ini untuk referensi saat menghubungi support.')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ServerError500;
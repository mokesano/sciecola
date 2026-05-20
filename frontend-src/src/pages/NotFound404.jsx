import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const NotFound404 = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full text-center">
        {/* Animated 404 Number */}
        <div className="relative mb-8">
          <h1 className="text-9xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 animate-pulse">
            404
          </h1>
          <div className="absolute inset-0 blur-3xl opacity-30 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full"></div>
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
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        {/* Message */}
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          {t('error.pageNotFound', 'Halaman Tidak Ditemukan')}
        </h2>
        <p className="text-lg text-gray-600 mb-8">
          {t(
            'error.pageNotFoundDescription',
            'Maaf, halaman yang Anda cari tidak dapat ditemukan. Mungkin halaman telah dipindahkan atau dihapus.'
          )}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
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
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            {t('error.backToHome', 'Kembali ke Beranda')}
          </Link>

          <Link
            to="/help"
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
                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {t('error.getHelp', 'Bantuan')}
          </Link>
        </div>

        {/* Search Suggestion */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-4">
            {t('error.searchSuggestion', 'Cari yang Anda butuhkan:')}
          </p>
          <div className="flex justify-center space-x-4 flex-wrap gap-2">
            <Link
              to="/researchers"
              className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
            >
              {t('menu.researchers', 'Peneliti')}
            </Link>
            <span className="text-gray-300">|</span>
            <Link
              to="/articles"
              className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
            >
              {t('menu.articles', 'Artikel')}
            </Link>
            <span className="text-gray-300">|</span>
            <Link
              to="/institutions"
              className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
            >
              {t('menu.institutions', 'Institusi')}
            </Link>
            <span className="text-gray-300">|</span>
            <Link
              to="/sdgs"
              className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
            >
              SDGs
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound404;

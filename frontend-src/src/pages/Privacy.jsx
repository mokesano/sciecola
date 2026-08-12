import React, { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';

const SECTION_KEYS = [
  'pendahuluan', 'data_dikumpulkan', 'penggunaan_data', 'berbagi_data',
  'keamanan_data', 'hak_pengguna', 'cookie', 'retensi',
  'perubahan_kebijakan', 'kontak',
];

// Trusted body strings from our own JSON, so dangerouslySetInnerHTML is safe.
const Section = ({ id, index, section }) => {
  const listTag = section.list_type === 'decimal' ? 'ol' : 'ul';
  const listCls = section.list_type === 'decimal' ? 'list-decimal pl-5 space-y-2' : 'list-disc pl-5 space-y-2';
  return (
    <section id={id}>
      <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
        <span className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center text-[15px]">{index}</span>
        {section.title}
      </h2>
      {(section.paragraphs ?? []).map((p, i) => (
        <p key={i} className={i < (section.paragraphs.length - 1) ? 'mb-4' : ''}
          dangerouslySetInnerHTML={{ __html: p }} />
      ))}
      {section.intro && (
        <p className="mb-4" dangerouslySetInnerHTML={{ __html: section.intro }} />
      )}
      {(section.items ?? []).length > 0 &&
        React.createElement(listTag, { className: listCls },
          section.items.map((it, i) => (
            <li key={i} dangerouslySetInnerHTML={{ __html: it }} />
          ))
        )
      }
      {section.contact_box && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 space-y-2 mt-4">
          <p dangerouslySetInnerHTML={{ __html: section.contact_box.email }} />
          <p dangerouslySetInnerHTML={{ __html: section.contact_box.address }} />
          <p dangerouslySetInnerHTML={{ __html: section.contact_box.phone }} />
        </div>
      )}
      {section.outro && (
        <p className="mt-4" dangerouslySetInnerHTML={{ __html: section.outro }} />
      )}
    </section>
  );
};

const Privacy = () => {
  const { t } = useTranslation('privacy');
  const [activeSection, setActiveSection] = useState('');

  useEffect(() => {
    const handleScroll = () => {
      const sections = document.querySelectorAll('section[id]');
      let current = '';
      sections.forEach((section) => {
        const sectionTop = section.offsetTop - 120;
        if (window.scrollY >= sectionTop) current = section.getAttribute('id');
      });
      setActiveSection(current);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) window.scrollTo({ top: element.offsetTop - 100, behavior: 'smooth' });
  };

  return (
    <main className="pt-28 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

        {/* Sidebar */}
        <aside className="hidden lg:block col-span-1">
          <div className="sticky top-24 bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h3 className="font-bold text-gray-900 mb-4 text-[15px] uppercase tracking-wider">{t('toc')}</h3>
            <nav className="space-y-1 max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
              {SECTION_KEYS.map((id) => (
                <button
                  key={id}
                  onClick={() => scrollToSection(id)}
                  className={`block w-full text-left text-[15px] px-3 py-2 rounded-lg transition-colors ${
                    activeSection === id
                      ? 'bg-indigo-50 text-indigo-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  {t(`section_labels.${id}`)}
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* Content Area */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-gray-200 shadow-sm p-6 sm:p-10">
          <div className="mb-8 border-b border-gray-100 pb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('title')}</h1>
            <div className="flex items-center gap-4 text-[15px] text-gray-500">
              <span>{t('updated')}</span>
              <span>•</span>
              <span>{t('read_time')}</span>
            </div>
          </div>

          <div className="prose prose-indigo max-w-none text-gray-600 leading-relaxed space-y-8">
            {SECTION_KEYS.map((id, i) => {
              const section = t(`sections.${id}`, { returnObjects: true });
              return <Section key={id} id={id} index={i + 1} section={section} />;
            })}
          </div>

          {/* Action Buttons */}
          <div className="mt-12 pt-8 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-m text-gray-500">{t('footer_note')}</p>
            <div className="flex gap-3">
              <Link to="/settings#privacy" className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors shadow-sm">
                {t('cta_settings')}
              </Link>
              <Link to="/contact" className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors">
                {t('cta_contact')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Privacy;

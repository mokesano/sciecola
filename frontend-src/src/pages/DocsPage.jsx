import React, { Suspense, lazy } from 'react';
import { useParams, Link, Navigate } from 'react-router';
import { useTranslation } from 'react-i18next';

// Lazy-load each MDX document
const DOC_MODULES = {
  help:          lazy(() => import('../docs/help.mdx')),
  faq:           lazy(() => import('../docs/faq.mdx')),
  'api-reference': lazy(() => import('../docs/api-reference.mdx')),
  documentation: lazy(() => import('../docs/documentation.mdx')),
};

// Tailwind prose-like MDX component overrides
const MDX_COMPONENTS = {
  h1: (props) => <h1 className="text-3xl font-bold text-gray-900 mt-8 mb-4 first:mt-0" {...props} />,
  h2: (props) => <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-3 border-b border-gray-200 pb-2" {...props} />,
  h3: (props) => <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-2" {...props} />,
  h4: (props) => <h4 className="text-lg font-semibold text-gray-700 mt-4 mb-2" {...props} />,
  p:  (props) => <p className="text-gray-600 leading-relaxed mb-4" {...props} />,
  a:  ({ href, ...props }) => {
    const isInternal = href && href.startsWith('/');
    return isInternal
      ? <Link to={href} className="text-indigo-600 hover:text-indigo-800 underline" {...props} />
      : <a href={href} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800 underline" {...props} />;
  },
  ul: (props) => <ul className="list-disc list-inside text-gray-600 mb-4 space-y-1" {...props} />,
  ol: (props) => <ol className="list-decimal list-inside text-gray-600 mb-4 space-y-1" {...props} />,
  li: (props) => <li className="leading-relaxed" {...props} />,
  blockquote: (props) => (
    <blockquote className="border-l-4 border-indigo-300 bg-indigo-50 text-gray-700 px-4 py-3 my-4 rounded-r-lg italic" {...props} />
  ),
  code: ({ className, children, ...props }) => {
    const isBlock = className?.includes('language-');
    return isBlock ? (
      <code className={`block bg-gray-900 text-gray-100 rounded-lg p-4 text-[15px] font-mono overflow-x-auto mb-4 ${className}`} {...props}>
        {children}
      </code>
    ) : (
      <code className="bg-gray-100 text-indigo-700 px-1.5 py-0.5 rounded text-[15px] font-mono" {...props}>
        {children}
      </code>
    );
  },
  pre: (props) => <pre className="bg-gray-900 rounded-lg overflow-x-auto mb-4" {...props} />,
  table: (props) => (
    <div className="overflow-x-auto mb-6">
      <table className="w-full text-[15px] text-left border-collapse border border-gray-200 rounded-lg overflow-hidden" {...props} />
    </div>
  ),
  thead: (props) => <thead className="bg-indigo-50 text-indigo-700" {...props} />,
  th: (props) => <th className="px-4 py-3 font-semibold border border-gray-200" {...props} />,
  td: (props) => <td className="px-4 py-3 border border-gray-200 text-gray-700" {...props} />,
  tr: (props) => <tr className="even:bg-gray-50 hover:bg-indigo-50/30 transition-colors" {...props} />,
  hr: () => <hr className="border-gray-200 my-8" />,
  strong: (props) => <strong className="font-semibold text-gray-900" {...props} />,
};

export default function DocsPage() {
  const { slug } = useParams();
  const { t } = useTranslation('docs_page');
  const Doc = DOC_MODULES[slug];

  if (!Doc) return <Navigate to="/docs/documentation" replace />;

  // Fallback to the humanized slug if no translation exists for a slug.
  const slugLabel = (key) => t(`sidebar.${key}`, { defaultValue: key.replace(/-/g, ' ') });

  return (
    <main className="pt-[68px] pb-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-[15px] text-gray-600 mb-8">
        <Link to="/" className="hover:text-indigo-600 transition-colors">{t('breadcrumb.home')}</Link>
        <span className="text-gray-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
        </span>
        <Link to="/docs/documentation" className="hover:text-indigo-600 transition-colors">{t('breadcrumb.docs')}</Link>
        <span className="text-gray-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
        </span>
        <span className="text-gray-900 font-medium">{slugLabel(slug)}</span>
      </nav>

      {/* Sidebar navigation */}
      <div className="flex gap-8">
        <aside className="hidden lg:block w-52 shrink-0">
          <nav className="sticky top-28 space-y-1">
            {Object.keys(DOC_MODULES).map((key) => (
              <Link
                key={key}
                to={`/docs/${key}`}
                className={`block px-3 py-2 rounded-lg text-[15px] font-medium transition-colors ${
                  key === slug
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                {slugLabel(key)}
              </Link>
            ))}
          </nav>
        </aside>

        {/* MDX content */}
        <article className="flex-1 min-w-0">
          <Suspense
            fallback={
              <div className="flex items-center justify-center py-24">
                <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              </div>
            }
          >
            <Doc components={MDX_COMPONENTS} />
          </Suspense>
        </article>
      </div>
    </main>
  );
}

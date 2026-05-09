import React from 'react';
import { Link } from 'react-router-dom';
import { IconChevronRight } from './icons';

export default function Breadcrumb({ items = [] }) {
  return (
    <nav className="flex items-center gap-1.5 text-sm text-gray-500 mb-6" aria-label="breadcrumb">
      <Link to="/" className="hover:text-indigo-600 transition-colors">Beranda</Link>
      {items.map((item, idx) => (
        <React.Fragment key={idx}>
          <IconChevronRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          {item.href ? (
            <Link to={item.href} className="hover:text-indigo-600 transition-colors">{item.label}</Link>
          ) : (
            <span className="text-gray-900 font-medium">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}

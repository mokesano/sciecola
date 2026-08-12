import React from 'react';

const VARIANTS = {
  default:  'bg-gray-100 text-gray-700',
  indigo:   'bg-indigo-100 text-indigo-700',
  green:    'bg-green-100 text-green-700',
  red:      'bg-red-100 text-red-700',
  yellow:   'bg-yellow-100 text-yellow-700',
  blue:     'bg-blue-100 text-blue-700',
  purple:   'bg-purple-100 text-purple-700',
  pink:     'bg-pink-100 text-pink-700',
  teal:     'bg-teal-100 text-teal-700',
  orange:   'bg-orange-100 text-orange-700',
};

export default function Badge({ children, variant = 'default', dot, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-sm font-semibold ${VARIANTS[variant] || VARIANTS.default} ${className}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full bg-current`} />}
      {children}
    </span>
  );
}

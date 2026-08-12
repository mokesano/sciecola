import React from 'react';

const SIZES = { xs: 'w-6 h-6 text-sm', sm: 'w-8 h-8 text-[15px]', md: 'w-10 h-10 text-base', lg: 'w-12 h-12 text-lg', xl: 'w-16 h-16 text-xl' };

const initials = (name = '') =>
  name.split(' ').slice(0, 2).map(w => w[0] || '').join('').toUpperCase() || '?';

const colorHash = (name = '') => {
  const colors = ['bg-indigo-500', 'bg-purple-500', 'bg-blue-500', 'bg-teal-500', 'bg-green-500', 'bg-orange-500', 'bg-pink-500', 'bg-rose-500'];
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffffffff;
  return colors[Math.abs(h) % colors.length];
};

export default function Avatar({ src, name, size = 'md', className = '' }) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`rounded-full object-cover ${SIZES[size]} ${className}`}
      />
    );
  }
  return (
    <div className={`rounded-full flex items-center justify-center text-white font-bold shrink-0 ${SIZES[size]} ${colorHash(name)} ${className}`}>
      {initials(name)}
    </div>
  );
}

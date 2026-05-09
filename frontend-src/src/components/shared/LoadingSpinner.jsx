import React from 'react';

export default function LoadingSpinner({ size = 'md', text, fullPage }) {
  const sizeMap = { sm: 'w-5 h-5 border-2', md: 'w-8 h-8 border-4', lg: 'w-12 h-12 border-4' };
  const spinner = (
    <div className={`${sizeMap[size] || sizeMap.md} border-indigo-500 border-t-transparent rounded-full animate-spin`} />
  );
  if (fullPage) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        {spinner}
        {text && <p className="text-sm text-gray-500">{text}</p>}
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2">
      {spinner}
      {text && <span className="text-sm text-gray-500">{text}</span>}
    </div>
  );
}

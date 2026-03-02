import React from 'react';

export default function Logo({ size = 'default' }) {
  const sizeClasses = {
    small: 'text-lg',
    default: 'text-2xl',
    large: 'text-4xl'
  };

  return (
    <div className="flex flex-col items-center">
      <span className={`font-serif font-semibold tracking-wider text-[#C9943A] ${sizeClasses[size]}`}>
        THE EMPATHY ENIGMA
      </span>
    </div>
  );
}
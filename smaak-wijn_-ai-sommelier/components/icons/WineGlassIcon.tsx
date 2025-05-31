
import React from 'react';

interface IconProps {
  className?: string;
}

export const WineGlassIcon: React.FC<IconProps> = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    fill="none" 
    viewBox="0 0 24 24" 
    strokeWidth={1.5} 
    stroke="currentColor" 
    className={className}
    aria-hidden="true"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 10.5H9.75m4.5 0V9a2.25 2.25 0 00-2.25-2.25H12A2.25 2.25 0 009.75 9v1.5m4.5 0v4.5A2.25 2.25 0 0112 17.25h0A2.25 2.25 0 019.75 15v-4.5m4.5 0M12 6.75v.008v-.008Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12.75c0-1.036.84-1.875 1.875-1.875h12.75c1.035 0 1.875.84 1.875 1.875v4.5a1.875 1.875 0 01-1.875 1.875H5.625a1.875 1.875 0 01-1.875-1.875v-4.5Z" />
  </svg>
);

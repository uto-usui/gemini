import React from 'react';

interface IconProps {
  className?: string;
}

export const LightBulbIcon: React.FC<IconProps> = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    fill="none" 
    viewBox="0 0 24 24" 
    strokeWidth={1.5} 
    stroke="currentColor" 
    className={className}
    aria-hidden="true"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.355a7.5 7.5 0 01-7.5 0" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6.75 6.75 0 006.75-6.75H5.25A6.75 6.75 0 0012 18.75z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75A2.25 2.25 0 0114.25 9v1.5H9.75V9A2.25 2.25 0 0112 6.75z" />
     <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5a.75.75 0 00-.75.75v-.008c0 .414.336.75.75.75s.75-.336.75-.75v.008a.75.75 0 00-.75-.75z" /> {/* Light ray top */}
     <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6a.75.75 0 00-.53.22l-.008.007a.75.75 0 00.538 1.28H8.25a.75.75 0 00.53-.22l.008-.007a.75.75 0 00-.538-1.28H8.25z" /> {/* Light ray left */}
     <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a.75.75 0 00.53.22l.008.007a.75.75 0 00-.538 1.28h.008a.75.75 0 00-.53-.22l-.008-.007a.75.75 0 00.538-1.28h-.008z" /> {/* Light ray right */}
  </svg>
);

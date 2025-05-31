
import React from 'react';

interface IconProps {
  className?: string;
}

// Use the Heroicons 'arrow-top-right-on-square' path as the standard
export const ExternalLinkIcon: React.FC<IconProps> = ({ className }) => (
 <svg 
    xmlns="http://www.w3.org/2000/svg" 
    fill="none" 
    viewBox="0 0 24 24" 
    strokeWidth={1.5} 
    stroke="currentColor" 
    className={className}
    aria-hidden="true"
  >
  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5M13.5 6L21 3m0 0h-5.25M21 3v5.25" />
</svg>
);

// All other commented out SVGs and duplicate definitions have been removed.
// The comments below were part of the thought process in the original file but are not needed for the component itself.
/*
  Heroicons 'arrow-top-right-on-square'
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
    <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
  </svg>
*/

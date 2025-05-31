
import React from 'react';

interface LoadingSpinnerProps {
  small?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ small = false }) => {
  const sizeClasses = small ? 'h-5 w-5' : 'h-10 w-10';
  const borderClasses = small ? 'border-2' : 'border-4';

  return (
    <div className={`animate-spin rounded-full ${sizeClasses} ${borderClasses} border-amber-600 border-t-transparent`} role="status">
      <span className="sr-only">読み込み中...</span>
    </div>
  );
};

export default LoadingSpinner;

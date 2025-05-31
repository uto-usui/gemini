
import React from 'react';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center space-y-2 my-8">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sky-400"></div>
      <p className="text-sky-300 text-center">星々の声を聴いています...</p>
    </div>
  );
};

export default LoadingSpinner;

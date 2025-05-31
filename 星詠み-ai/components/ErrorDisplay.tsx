
import React from 'react';

interface ErrorDisplayProps {
  message: string;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ message }) => {
  return (
    <div className="bg-red-500/20 border border-red-700 text-red-300 p-4 rounded-lg my-6 animate-fadeIn" role="alert">
      <p className="font-semibold">問題が発生しました</p>
      <p>{message}</p>
    </div>
  );
};

export default ErrorDisplay;

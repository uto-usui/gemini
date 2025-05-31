
import React, { useState, useCallback } from 'react';
import HoroscopeForm from './components/HoroscopeForm';
import FortuneDisplay from './components/FortuneDisplay';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorDisplay from './components/ErrorDisplay';
import type { FormData } from './types';
import { generateFortune } from './services/geminiService';

const App: React.FC = () => {
  const [fortune, setFortune] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedName, setSubmittedName] = useState<string>('');


  const handleFormSubmit = useCallback(async (data: FormData) => {
    setIsLoading(true);
    setError(null);
    setFortune(null);
    setSubmittedName(data.name); 

    try {
      const generatedFortune = await generateFortune(data.name, data.dob);
      setFortune(generatedFortune);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('予期せぬエラーが発生しました。');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleTryAgain = () => {
    setFortune(null);
    setError(null);
    setSubmittedName('');
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center text-left p-4">
      <main className="w-full max-w-2xl bg-slate-800/50 backdrop-blur-lg p-6 sm:p-10 rounded-2xl shadow-2xl border border-slate-700/50">
        <header className="mb-8">
          <h1 className="title-font text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-purple-400 to-pink-500 text-center">
            星詠み AI
          </h1>
          <p className="text-slate-400 mt-2 text-sm sm:text-base">
            あなたの情報を入力して、星々からの今日の導きを受け取りましょう。
          </p>
        </header>

        {!fortune && !isLoading && (
             <HoroscopeForm onSubmit={handleFormSubmit} isLoading={isLoading} />
        )}
       
        {isLoading && <LoadingSpinner />}
        
        {error && !isLoading && (
          <>
            <ErrorDisplay message={error} />
            <button
              onClick={handleTryAgain}
              className="mt-4 px-6 py-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-sky-400 transition-all duration-150 ease-in-out block mx-auto"
            >
              もう一度試す
            </button>
          </>
        )}
        
        {fortune && !isLoading && !error && (
          <>
            <FortuneDisplay fortune={fortune} name={submittedName} />
             <button
              onClick={handleTryAgain}
              className="mt-6 px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all duration-150 ease-in-out block mx-auto"
            >
              もう一度メッセージを受け取る
            </button>
          </>
        )}
      </main>
      <footer className="mt-12 w-full max-w-2xl text-sm text-slate-500 px-6 sm:px-10">
        <p>&copy; {new Date().getFullYear()} 星詠み AI. すべてのメッセージは娯楽を目的としています。</p>
      </footer>
    </div>
  );
};

export default App;

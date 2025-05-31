
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { WinePairing, SuggestedDish } from './types';
import { fetchWinePairings, fetchDishSuggestionAndPairingsFromIngredients } from './services/geminiService';
import WineCard from './components/WineCard';
import LoadingSpinner from './components/LoadingSpinner';
import { WineGlassIcon } from './components/icons/WineGlassIcon';
import { SearchIcon } from './components/icons/SearchIcon';
import { LightBulbIcon } from './components/icons/LightBulbIcon'; // New Icon

type SearchMode = 'dish' | 'ingredients';
const WINE_TYPES_TO_FILTER = ["赤ワイン", "白ワイン", "ロゼワイン"];

const App: React.FC = () => {
  const [searchMode, setSearchMode] = useState<SearchMode>('dish');
  const [inputValue, setInputValue] = useState<string>(''); // Unified input for dish name or ingredients
  
  const [winePairings, setWinePairings] = useState<WinePairing[]>([]);
  const [suggestedDish, setSuggestedDish] = useState<SuggestedDish | null>(null);
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [apiKeyMissing, setApiKeyMissing] = useState<boolean>(false);
  
  const [previousQuery, setPreviousQuery] = useState<string>(''); // What was last searched
  const [currentDisplayTitle, setCurrentDisplayTitle] = useState<string>('');

  const [selectedWineTypeFilter, setSelectedWineTypeFilter] = useState<string | null>(null);

  useEffect(() => {
    if (!process.env.API_KEY) {
      setApiKeyMissing(true);
    }
  }, []);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
  };

  const handleModeChange = (newMode: SearchMode) => {
    setSearchMode(newMode);
    setInputValue('');
    setWinePairings([]);
    setSuggestedDish(null);
    setError(null);
    setPreviousQuery('');
    setCurrentDisplayTitle('');
    setSelectedWineTypeFilter(null);
  };

  const handleSubmit = useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (apiKeyMissing) {
      setError('APIキーが設定されていません。アプリケーションを利用するには、環境変数 API_KEY を設定してください。');
      return;
    }
    if (!inputValue.trim()) {
      setError(searchMode === 'dish' ? '料理名を入力してください。' : '食材を入力してください。');
      setWinePairings([]);
      setSuggestedDish(null);
      setPreviousQuery('');
      setCurrentDisplayTitle('');
      return;
    }

    setIsLoading(true);
    setError(null);
    setWinePairings([]);
    setSuggestedDish(null);
    setSelectedWineTypeFilter(null); // Reset filter on new search

    try {
      if (searchMode === 'dish') {
        const pairings = await fetchWinePairings(inputValue);
        if (pairings.length === 0) {
          setError('この料理に適したワインのペアリングが見つかりませんでした。別の料理名でお試しください。');
        }
        setWinePairings(pairings);
        setPreviousQuery(inputValue);
        setCurrentDisplayTitle(`「${inputValue}」`);
      } else { // ingredients mode
        const result = await fetchDishSuggestionAndPairingsFromIngredients(inputValue);
        if (!result.suggestedDish || !result.suggestedDish.dishName) {
           setError('食材から適切な料理を提案できませんでした。別の食材でお試しください。');
           setWinePairings([]); // Ensure pairings are cleared
        } else {
          setSuggestedDish(result.suggestedDish);
          if (result.pairings.length === 0) {
             setError(`料理「${result.suggestedDish.dishName}」に適したワインのペアリングが見つかりませんでした。`);
          }
          setWinePairings(result.pairings);
          setCurrentDisplayTitle(`「${result.suggestedDish.dishName}」`);
        }
        setPreviousQuery(inputValue); // Store original ingredients query
      }
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : '処理中にエラーが発生しました。';
      setError(errorMessage.startsWith("APIキーが設定されていません") || errorMessage.startsWith("APIキーが無効です") ? errorMessage : `処理中にエラーが発生しました。しばらくしてからもう一度お試しください。詳細: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, [inputValue, searchMode, apiKeyMissing]);

  const filteredWinePairings = useMemo(() => {
    if (!selectedWineTypeFilter) {
      return winePairings;
    }
    return winePairings.filter(p => p.wineType === selectedWineTypeFilter);
  }, [winePairings, selectedWineTypeFilter]);

  const inputLabel = searchMode === 'dish' 
    ? "料理名を入力 (例: 仔羊の香草焼き)" 
    : "主要な食材を入力 (例: 鶏肉、トマト、玉ねぎ)";
  const inputPlaceholder = searchMode === 'dish' 
    ? "例: ビーフブルギニヨン" 
    : "例: サーモン、ほうれん草、レモン";
  const submitButtonText = searchMode === 'dish' ? "ペアリング検索" : "料理提案 & ペアリング";


  return (
    <div className="min-h-screen bg-stone-50 text-stone-800 flex flex-col items-center p-4 sm:p-6 md:p-8">
      <header className="w-full max-w-4xl text-center my-8 sm:my-12">
        <div className="flex items-center justify-center mb-3">
          <WineGlassIcon className="h-10 w-10 sm:h-12 sm:w-12 text-amber-700 mr-2 sm:mr-3" />
          <h1 className="text-4xl sm:text-5xl font-bold text-stone-900 tracking-tight font-playfair">Smaak & Wijn</h1>
        </div>
        <p className="text-md sm:text-lg text-stone-600">AIソムリエが選ぶ、あなたの一皿に最適なワイン</p>
      </header>

      <main className="w-full max-w-xl bg-white shadow-lg rounded-lg p-6 sm:p-8 mb-8"> {/* Shadow changed from shadow-xl */}
        <div className="mb-6 sm:mb-8">
          <div className="flex border border-stone-300 rounded-md p-1 bg-stone-100 space-x-1">
            <button
              onClick={() => handleModeChange('dish')}
              className={`w-1/2 py-2 px-3 rounded-md text-sm font-medium transition-colors duration-150 ease-in-out
                          ${searchMode === 'dish' ? 'bg-amber-700 text-white shadow' : 'bg-transparent text-stone-700 hover:bg-stone-200/70'}`}
              aria-pressed={searchMode === 'dish'}
            >
              料理名で検索
            </button>
            <button
              onClick={() => handleModeChange('ingredients')}
              className={`w-1/2 py-2 px-3 rounded-md text-sm font-medium transition-colors duration-150 ease-in-out
                          ${searchMode === 'ingredients' ? 'bg-amber-700 text-white shadow' : 'bg-transparent text-stone-700 hover:bg-stone-200/70'}`}
              aria-pressed={searchMode === 'ingredients'}
            >
              食材からおまかせ
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mb-6 sm:mb-8">
          <label htmlFor="searchInput" className="block text-sm font-medium text-stone-700 mb-2">
            {inputLabel}
          </label>
          <div className="flex items-center space-x-2 sm:space-x-3">
            <input
              type="text"
              id="searchInput"
              value={inputValue}
              onChange={handleInputChange}
              placeholder={inputPlaceholder}
              className="flex-grow p-3 bg-white border border-stone-300 rounded-md shadow-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition duration-150 ease-in-out disabled:opacity-60 text-stone-900 placeholder-stone-500 text-base"
              disabled={apiKeyMissing || isLoading}
              aria-describedby="error-message api-key-message"
            />
            <button
              type="submit"
              disabled={isLoading || apiKeyMissing}
              className="flex items-center justify-center bg-amber-700 hover:bg-amber-800 text-white font-semibold py-3 px-4 sm:px-5 rounded-md shadow-sm transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:bg-stone-300 disabled:cursor-not-allowed"
              aria-label={submitButtonText}
            >
              {isLoading ? <LoadingSpinner small /> : (searchMode === 'dish' ? <SearchIcon className="h-5 w-5 sm:mr-2" /> : <LightBulbIcon className="h-5 w-5 sm:mr-2" />)}
              <span className="hidden sm:inline">{submitButtonText}</span>
            </button>
          </div>
        </form>

        {apiKeyMissing && !isLoading && (
           <div id="api-key-message" className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-r-md" role="alert">
             <p className="font-bold text-red-800">APIキーが必要です</p>
             <p className="text-sm">環境変数 <code className="bg-red-200 text-red-900 px-1 py-0.5 rounded text-xs">API_KEY</code> が設定されていません。</p>
           </div>
        )}

        {error && (
          <div id="error-message" className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-r-md" role="alert">
            <p className="font-bold text-red-800">エラーが発生しました</p>
            <p className="text-sm">{error}</p>
          </div>
        )}
        
        <div aria-live="polite">
          {isLoading && <div className="flex justify-center py-8"><LoadingSpinner /></div>}
        </div>
        
        {!isLoading && (suggestedDish?.dishName && searchMode === 'ingredients') && (
          <div className="bg-amber-50 border-l-4 border-amber-600 text-amber-800 p-4 my-6 rounded-r-md">
            <p className="font-semibold text-md">AIが提案する料理:</p>
            <p className="text-xl font-bold">{suggestedDish.dishName}</p>
            <p className="text-xs mt-1">（もとの食材: {previousQuery}）</p>
          </div>
        )}

        {!isLoading && winePairings.length > 0 && (
          <>
            <div className="flex flex-wrap gap-2 mb-4 items-center">
              <span className="text-sm text-stone-600 mr-2">絞り込み:</span>
              <button
                onClick={() => setSelectedWineTypeFilter(null)}
                className={`px-3 py-1 text-xs rounded-full border transition-colors ${!selectedWineTypeFilter ? 'bg-amber-700 text-white border-amber-700' : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'}`}
              >
                すべて ({winePairings.length})
              </button>
              {WINE_TYPES_TO_FILTER.map(type => {
                const count = winePairings.filter(p => p.wineType === type).length;
                if (count === 0) return null; // Don't show filter if no wines of this type
                return (
                  <button
                    key={type}
                    onClick={() => setSelectedWineTypeFilter(type)}
                    className={`px-3 py-1 text-xs rounded-full border transition-colors ${selectedWineTypeFilter === type ? 'bg-amber-700 text-white border-amber-700' : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'}`}
                  >
                    {type} ({count})
                  </button>
                );
              })}
            </div>
            <div className="space-y-6 sm:space-y-8">
               <h2 className="text-xl sm:text-2xl font-semibold text-stone-700 border-b-2 border-amber-600 pb-2 mb-6"> {/* Underline color updated */}
                {currentDisplayTitle} に合うおすすめワイン
                {selectedWineTypeFilter && ` (${selectedWineTypeFilter})`}
              </h2>
              {filteredWinePairings.length > 0 ? (
                filteredWinePairings.map((pairing, index) => (
                  <WineCard key={index} wine={pairing} />
                ))
              ) : (
                <p className="text-stone-600 text-center py-4">
                  選択されたフィルターに一致するワインはありません。
                </p>
              )}
            </div>
          </>
        )}
         {!isLoading && !error && winePairings.length === 0 && currentDisplayTitle && !suggestedDish?.dishName && searchMode === 'dish' && (
            <div className="text-center py-6 text-stone-600">
                <p>{currentDisplayTitle}に合うワインは見つかりませんでした。</p>
                <p className="text-sm">別の料理名でお試しいただくか、料理名の表現を変えてみてください。</p>
            </div>
        )}
         {!isLoading && !error && suggestedDish?.dishName && winePairings.length === 0 && searchMode === 'ingredients' && (
             <div className="text-center py-6 text-stone-600">
                <p>料理「<span className="font-bold text-amber-700">{suggestedDish.dishName}</span>」に合うワインは見つかりませんでした。</p>
             </div>
         )}
      </main>

      <footer className="w-full max-w-4xl text-center py-6 sm:py-8 mt-auto border-t border-stone-200">
        <p className="text-xs sm:text-sm text-stone-500">Smaak & Wijn &copy; {new Date().getFullYear()} - Crafted by Studio Stijlvol, Amsterdam</p>
      </footer>
    </div>
  );
};

export default App;
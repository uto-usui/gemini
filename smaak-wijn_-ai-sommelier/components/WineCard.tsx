
import React from 'react';
import { WinePairing } from '../types';
import { WineGlassIcon } from './icons/WineGlassIcon';
import { ExternalLinkIcon } from './icons/ExternalLinkIcon'; // New Icon

interface WineCardProps {
  wine: WinePairing;
}

const WineCard: React.FC<WineCardProps> = ({ wine }) => {
  const handleSearchWineOnGoogle = () => {
    const query = encodeURIComponent(wine.wineName);
    window.open(`https://www.google.com/search?q=${query}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <article className="bg-stone-50 p-5 sm:p-6 rounded-lg shadow-md border border-stone-200/80 transition-all duration-300 hover:shadow-lg hover:border-stone-300"> {/* Shadow changed */}
      <header className="flex items-start mb-4 pb-3 border-b border-stone-200">
        <WineGlassIcon className="h-7 w-7 sm:h-8 sm:w-8 text-amber-600 mr-3 sm:mr-4 flex-shrink-0 mt-1" />
        <h3 className="text-xl sm:text-2xl font-semibold text-amber-700 leading-tight">{wine.wineName || "ワイン名未提供"}</h3>
      </header>
      
      <section className="mb-4">
        <h4 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">ワインの特徴</h4>
        <p className="text-stone-700 text-sm sm:text-base leading-relaxed whitespace-pre-line">{wine.characteristics || "特徴に関する情報はありません。"}</p>
      </section>
      
      <section className="mb-3"> {/* Reduced bottom margin to accommodate the button */}
        <h4 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">ペアリングのポイント</h4>
        <p className="text-stone-700 text-sm sm:text-base leading-relaxed whitespace-pre-line">{wine.pairingExplanation || "ペアリングに関する情報はありません。"}</p>
      </section>

      <footer className="mt-5 pt-4 border-t border-stone-200/60 flex justify-end">
        <button
          onClick={handleSearchWineOnGoogle}
          className="inline-flex items-center text-xs sm:text-sm font-medium text-amber-700 hover:text-amber-800 hover:bg-amber-100/60 py-1.5 px-3 rounded-md transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-stone-50"
          aria-label={`「${wine.wineName}」をGoogleで検索`}
        >
          <ExternalLinkIcon className="h-4 w-4 mr-1.5" />
          Googleで探す
        </button>
      </footer>
    </article>
  );
};

export default WineCard;
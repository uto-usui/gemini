
import React from 'react';

interface FortuneDisplayProps {
  fortune: string;
  name: string;
}

const FortuneDisplay: React.FC<FortuneDisplayProps> = ({ fortune, name }) => {
  return (
    <div className="w-full max-w-xl bg-slate-800/70 backdrop-blur-md p-6 sm:p-8 rounded-xl shadow-2xl border border-slate-700 my-8 animate-fadeIn">
      <h3 className="title-font text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-400 to-orange-500 text-center">
        {name}様への今日の導き
      </h3>
      <div className="h-px bg-gradient-to-r from-transparent via-sky-500 to-transparent mb-6"></div>
      <p className="text-slate-200 text-lg leading-relaxed whitespace-pre-wrap" lang="ja">
        {fortune}
      </p>
      <div className="mt-6 pt-4 border-t border-slate-700 text-xs text-slate-500">
        これは今日一日のためのメッセージです。星は道を照らしますが、歩むのはあなた自身です。
      </div>
    </div>
  );
};

export default FortuneDisplay;

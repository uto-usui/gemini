
import React, { useState }from 'react';
import type { FormData } from '../types';

interface HoroscopeFormProps {
  onSubmit: (data: FormData) => void;
  isLoading: boolean;
}

const HoroscopeForm: React.FC<HoroscopeFormProps> = ({ onSubmit, isLoading }) => {
  const [name, setName] = useState<string>('');
  const [dob, setDob] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!name.trim() || !dob) {
        setFormError('お名前と生年月日を両方入力してください。');
        return;
    }
    // Basic validation for DOB format (YYYY-MM-DD), can be more robust
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
        setFormError('生年月日を正しい形式 (YYYY-MM-DD) で入力してください。');
        return;
    }
    const birthDate = new Date(dob);
    const today = new Date();
    today.setHours(0,0,0,0); // Compare dates only

    if (birthDate > today) {
        setFormError('未来の日付は入力できません。');
        return;
    }

    setFormError(null);
    onSubmit({ name, dob });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 w-full max-w-md">
      {formError && (
        <div className="bg-yellow-500/20 border border-yellow-700 text-yellow-300 p-3 rounded-md text-sm">
          {formError}
        </div>
      )}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-sky-300 mb-1">
          お名前
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="例：星野 ひかり"
          className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-colors"
          disabled={isLoading}
          aria-label="お名前"
        />
      </div>
      <div>
        <label htmlFor="dob" className="block text-sm font-medium text-sky-300 mb-1">
          生年月日
        </label>
        <input
          type="date"
          id="dob"
          value={dob}
          onChange={(e) => setDob(e.target.value)}
          className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-colors [color-scheme:dark]"
          disabled={isLoading}
          max={new Date().toISOString().split("T")[0]} // Prevent future dates
          aria-label="生年月日"
        />
         <p className="text-xs text-slate-500 mt-1">YYYY-MM-DD形式で選択または入力してください。</p>
      </div>
      <button
        type="submit"
        disabled={isLoading}
        className="w-full px-6 py-3 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-opacity-75 transition-all duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? '今日の導きを探しています...' : '今日のメッセージを受け取る'}
      </button>
    </form>
  );
};

export default HoroscopeForm;

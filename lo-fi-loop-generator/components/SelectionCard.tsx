
import React from 'react';

interface SelectionCardProps<T> {
  item: { id: T; label: string; description: string };
  isSelected: boolean;
  onSelect: (id: T) => void;
}

const SelectionCard = <T extends string,>({ item, isSelected, onSelect }: SelectionCardProps<T>): React.ReactNode => {
  return (
    <button
      onClick={() => onSelect(item.id)}
      className={`
        p-6 rounded-xl border-2 transition-all duration-200 w-full text-left
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-neutral-800
        ${isSelected 
          ? 'bg-sky-600 border-sky-500 shadow-lg transform scale-105' 
          : 'bg-neutral-800 border-neutral-700 hover:border-neutral-600 hover:bg-neutral-750'
        }
      `}
    >
      <h3 className={`text-xl font-semibold ${isSelected ? 'text-white' : 'text-neutral-100'}`}>{item.label}</h3>
      <p className={`mt-1 text-sm ${isSelected ? 'text-sky-100' : 'text-neutral-400'}`}>{item.description}</p>
    </button>
  );
};

export default SelectionCard;

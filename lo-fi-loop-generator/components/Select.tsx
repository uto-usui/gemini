
import React from 'react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  id: string;
  label: string;
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

const Select: React.FC<SelectProps> = ({ id, label, options, value, onChange, className }) => {
  return (
    <div className={`mb-4 ${className || ''}`}>
      <label htmlFor={id} className="block text-sm font-medium text-neutral-300 mb-1 select-none">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-neutral-700 border border-neutral-600 text-neutral-100 text-sm rounded-lg 
                   focus:ring-sky-500 focus:border-sky-500 block p-2.5
                   focus:outline-none"
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default Select;


import React from 'react';

interface SliderProps {
  id: string;
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
  unit?: string;
  className?: string;
}

const Slider: React.FC<SliderProps> = ({ id, label, min, max, step, value, onChange, unit, className }) => {
  return (
    <div className={`mb-4 ${className || ''}`}>
      <div className="flex justify-between items-center mb-1">
        <label htmlFor={id} className="block text-sm font-medium text-neutral-300 select-none">
          {label}
        </label>
        <span className="text-xs text-sky-400 font-mono bg-neutral-700 px-1.5 py-0.5 rounded">
          {value.toFixed(unit === "Hz" || unit === "Q" ? 0 : 2)}{unit && `${unit}`}
        </span>
      </div>
      <input
        type="range"
        id={id}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-2 bg-neutral-600 rounded-lg appearance-none cursor-pointer 
                   focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-1 focus:ring-offset-neutral-800
                   [&::-webkit-slider-thumb]:appearance-none
                   [&::-webkit-slider-thumb]:w-4
                   [&::-webkit-slider-thumb]:h-4
                   [&::-webkit-slider-thumb]:bg-sky-500
                   [&::-webkit-slider-thumb]:rounded-full
                   [&::-webkit-slider-thumb]:cursor-pointer
                   [&::-moz-range-thumb]:w-4
                   [&::-moz-range-thumb]:h-4
                   [&::-moz-range-thumb]:bg-sky-500
                   [&::-moz-range-thumb]:rounded-full
                   [&::-moz-range-thumb]:cursor-pointer
                   [&::-moz-range-thumb]:border-none"
      />
    </div>
  );
};

export default Slider;

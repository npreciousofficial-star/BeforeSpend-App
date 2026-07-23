/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface CustomSelectOption {
  value: string;
  label: string;
  sublabel?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

interface CustomSelectProps {
  options: CustomSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
  disabled?: boolean;
  id?: string;
}

export function CustomSelect({
  options,
  value,
  onChange,
  placeholder = 'Select option...',
  label,
  className = '',
  disabled = false,
  id,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative w-full ${className}`} ref={containerRef} id={id}>
      {label && (
        <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
          isOpen
            ? 'border-[#00A896] ring-2 ring-[#00A896]/20 bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-50'
            : 'border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-100 hover:border-[#00A896]/50'
        } ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-100 dark:bg-zinc-900' : ''}`}
      >
        <div className="flex items-center gap-2 min-w-0">
          {selectedOption?.icon}
          <span className="truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          {selectedOption?.sublabel && (
            <span className="text-[10px] text-gray-400 dark:text-zinc-500 font-semibold truncate">
              ({selectedOption.sublabel})
            </span>
          )}
        </div>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 dark:text-zinc-500 transition-transform duration-200 flex-shrink-0 ${
            isOpen ? 'rotate-180 text-[#00A896]' : ''
          }`}
        />
      </button>

      {/* Floating Options Menu */}
      {isOpen && (
        <div className="absolute z-50 mt-1.5 w-full rounded-2xl bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 shadow-2xl py-1 max-h-60 overflow-y-auto animate-in fade-in-50 zoom-in-95 duration-100">
          {options.length === 0 ? (
            <div className="px-4 py-3 text-xs text-gray-400 text-center">No options available</div>
          ) : (
            options.map((option) => {
              const isSelected = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  disabled={option.disabled}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs text-left font-bold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#00A896]/10 text-[#00A896] dark:bg-[#00A896]/20 dark:text-teal-400'
                      : 'text-gray-700 dark:text-zinc-200 hover:bg-gray-50 dark:hover:bg-zinc-900'
                  } ${option.disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {option.icon}
                    <div className="truncate">
                      <span>{option.label}</span>
                      {option.sublabel && (
                        <span className="block text-[10px] font-normal text-gray-400 dark:text-zinc-500">
                          {option.sublabel}
                        </span>
                      )}
                    </div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-[#00A896] flex-shrink-0" />}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

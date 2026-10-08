import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';

interface SearchableComboboxProps {
  value: string;
  onChange: (val: string) => void;
  options: string[];
  placeholder?: string;
  error?: boolean;
  className?: string;
}

export const SearchableCombobox: React.FC<SearchableComboboxProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Buscar o ingresar...',
  error = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter options based on typed value
  const filteredOptions = options.filter((op) =>
    op.toLowerCase().includes((value || '').toLowerCase())
  );

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <div className="relative flex items-center">
        <input
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className={`w-full bg-slate-50 dark:bg-slate-800 border ${
            error ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'
          } p-2.5 pr-14 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all`}
        />
        <div className="absolute right-2 flex items-center gap-1 text-slate-400">
          {value && (
            <button
              type="button"
              onClick={() => {
                onChange('');
                setIsOpen(true);
              }}
              className="p-1 hover:text-slate-600 dark:hover:text-slate-200"
              title="Limpiar"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 hover:text-slate-600 dark:hover:text-slate-200"
            title="Ver opciones"
          >
            <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-40 left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl divide-y divide-slate-100 dark:divide-slate-700/50">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((op, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  onChange(op);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-sm transition-colors hover:bg-indigo-50 dark:hover:bg-slate-700/80 ${
                  op.toUpperCase() === (value || '').toUpperCase()
                    ? 'font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-slate-700/40'
                    : 'text-slate-700 dark:text-slate-200'
                }`}
              >
                {op}
              </button>
            ))
          ) : (
            <div className="px-3 py-2 text-xs text-slate-400 dark:text-slate-500 italic">
              No se encontraron coincidencias. Puedes usar lo escrito como nuevo valor.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

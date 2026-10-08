import React from 'react';
import { CompanyLogo } from './CompanyLogo';
import { Receipt, FileSpreadsheet } from 'lucide-react';

interface HeaderProps {
  darkMode?: boolean;
  onToggleDarkMode?: () => void;
  onOpenSheetsModal?: () => void;
  sheetsConnected?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSheetsModal,
  sheetsConnected,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left Side: App Title */}
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 dark:bg-indigo-500 p-2.5 rounded-xl text-white shadow-md shadow-indigo-500/20 flex-shrink-0">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              REGISTRO DE FACTURAS O GASTOS
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Sistema de gestión y control presupuestario por bloques
            </p>
          </div>
        </div>

        {/* Right Side: Google Sheets Sync & Enterprise Logo */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-200 dark:border-slate-800">
          {/* Google Sheets Connection Button */}
          {onOpenSheetsModal && (
            <button
              onClick={onOpenSheetsModal}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border shadow-xs ${
                sheetsConnected
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100'
                  : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100'
              }`}
              title="Configurar conexión con tu archivo de Google Sheets"
            >
              <FileSpreadsheet className={`w-4 h-4 ${sheetsConnected ? 'text-emerald-600 dark:text-emerald-400' : 'text-indigo-600 dark:text-indigo-400'}`} />
              <span>{sheetsConnected ? 'Google Sheets Conectado' : 'Conectar Google Sheets'}</span>
            </button>
          )}

          {/* Enterprise Logo Replica */}
          <div className="border-l border-slate-200 dark:border-slate-800 pl-3">
            <CompanyLogo size="md" />
          </div>
        </div>
      </div>
    </header>
  );
};


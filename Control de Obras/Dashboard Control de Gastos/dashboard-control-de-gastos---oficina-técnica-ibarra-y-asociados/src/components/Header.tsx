import React from 'react';
import { Logo } from './Logo';
import { FileText, RefreshCw, BarChart2, Table, Database, ShieldCheck, Download } from 'lucide-react';

interface Props {
  activeTab: 'table' | 'charts';
  onTabChange: (tab: 'table' | 'charts') => void;
  onExportPdf: () => void;
  onOpenSyncModal: () => void;
  onRefreshData: () => void;
  isSyncing: boolean;
}

export const Header: React.FC<Props> = ({
  activeTab,
  onTabChange,
  onExportPdf,
  onOpenSyncModal,
  onRefreshData,
  isSyncing,
}) => {
  return (
    <header className="bg-slate-950 text-white border-b border-emerald-900/50 sticky top-0 z-40 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Logo & Corporate Tagline */}
          <div className="flex items-center justify-between">
            <Logo variant="full" className="h-12" />

            {/* Mobile quick actions */}
            <div className="flex md:hidden items-center gap-1.5">
              <button
                onClick={onExportPdf}
                className="p-2 bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1"
                title="Exportar Reporte a PDF"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Controls & Sync Badges */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* View Mode Toggle */}
            <div className="bg-slate-900 p-1 rounded-xl border border-slate-800 flex items-center">
              <button
                onClick={() => onTabChange('table')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'table'
                    ? 'bg-emerald-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Table className="w-3.5 h-3.5" />
                Tabla & Audit
              </button>
              <button
                onClick={() => onTabChange('charts')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'charts'
                    ? 'bg-emerald-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <BarChart2 className="w-3.5 h-3.5" />
                Análisis Gráfico
              </button>
            </div>

            {/* Google Sheets Live Status */}
            <button
              onClick={onOpenSyncModal}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-emerald-700/50 rounded-xl text-xs text-emerald-300 font-semibold flex items-center gap-2 transition-colors"
              title="Configurar o Ver Conexión con Google Sheets"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Sheets Sync: Live</span>
            </button>

            {/* Export to PDF Button */}
            <button
              onClick={onExportPdf}
              className="px-4 py-2 bg-gradient-to-r from-emerald-700 to-emerald-800 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 border border-emerald-500/30 active:scale-95"
            >
              <Download className="w-4 h-4 text-emerald-200" />
              Exportar a PDF
            </button>
          </div>
        </div>

        {/* Read-only Security Banner */}
        <div className="mt-2 pt-2 border-t border-slate-900/80 flex flex-wrap items-center justify-between text-[11px] text-slate-400 gap-2">
          <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Acceso de Solo Lectura: Archivo original protegido contra modificaciones accidentales</span>
          </div>
          <div className="text-slate-400">
            Control de Gastos en Obras - Pestañas <strong className="text-slate-200">'CONTROL_GASTOS'</strong> y <strong className="text-slate-200">'RESUMEN'</strong>
          </div>
        </div>
      </div>
    </header>
  );
};

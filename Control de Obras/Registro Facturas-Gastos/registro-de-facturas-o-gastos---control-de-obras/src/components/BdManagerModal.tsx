import React, { useState } from 'react';
import { BdOptions } from '../types';
import { Database, Plus, X, Tag, Building2, MapPin, Layers, Briefcase, FileText, UserCheck, RefreshCw, Trash2 } from 'lucide-react';

interface BdManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  bdOptions: BdOptions;
  onAddOption: (category: keyof BdOptions, value: string) => Promise<void>;
  onDeleteOption?: (category: keyof BdOptions, value: string) => Promise<void>;
  onSyncBd?: () => Promise<void>;
  onClearBd?: () => Promise<void>;
}

export const BdManagerModal: React.FC<BdManagerModalProps> = ({
  isOpen,
  onClose,
  bdOptions,
  onAddOption,
  onDeleteOption,
  onSyncBd,
  onClearBd,
}) => {
  const [activeTab, setActiveTab] = useState<keyof BdOptions>('obras');
  const [newValue, setNewValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  if (!isOpen) return null;

  const categories: { key: keyof BdOptions; label: string; icon: React.ReactNode }[] = [
    { key: 'obras', label: 'Obras', icon: <Building2 className="w-4 h-4" /> },
    { key: 'sectores', label: 'Sectores', icon: <MapPin className="w-4 h-4" /> },
    { key: 'agrupaciones', label: 'Agrupaciones', icon: <Layers className="w-4 h-4" /> },
    { key: 'disciplinas', label: 'Disciplinas', icon: <Briefcase className="w-4 h-4" /> },
    { key: 'razonesSociales', label: 'Razones Sociales (Proveedores)', icon: <FileText className="w-4 h-4" /> },
    { key: 'metricas', label: 'Métricas (Unidades)', icon: <Tag className="w-4 h-4" /> },
    { key: 'registradores', label: 'Registrado Por', icon: <UserCheck className="w-4 h-4" /> },
  ];

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newValue.trim()) return;

    setLoading(true);
    try {
      await onAddOption(activeTab, newValue.trim());
      setNewValue('');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (val: string) => {
    if (!onDeleteOption) return;
    if (confirm(`¿Desea eliminar "${val}" de la categoría ${activeTab}?`)) {
      try {
        await onDeleteOption(activeTab, val);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleSync = async () => {
    if (!onSyncBd) return;
    setSyncing(true);
    try {
      await onSyncBd();
    } catch (err) {
      console.error(err);
    } finally {
      setSyncing(false);
    }
  };

  const handleClearAll = async () => {
    if (!onClearBd) return;
    if (confirm('¿Está seguro de que desea limpiar todas las opciones guardadas en la base local?')) {
      try {
        await onClearBd();
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-fadeIn font-sans">
      <div className="w-full max-w-2xl bg-slate-900 rounded-lg shadow-2xl border border-slate-700 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-950 text-white px-5 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <Database className="w-5 h-5 text-orange-500" />
            <div>
              <h3 className="font-bold text-base font-mono uppercase tracking-wider text-white">Base de Datos de Listas (Hoja BD)</h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Valores maestros sincronizados con la pestaña "BD" en Google Sheets
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onSyncBd && (
              <button
                type="button"
                onClick={handleSync}
                disabled={syncing}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                title="Cargar y reemplazar opciones desde la pestaña BD de Google Sheets"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                <span>{syncing ? 'Cargando...' : 'Reemplazar desde Sheets'}</span>
              </button>
            )}
            {onClearBd && (
              <button
                type="button"
                onClick={handleClearAll}
                className="px-2.5 py-1.5 rounded-lg bg-red-900/60 hover:bg-red-800 text-red-200 text-xs font-bold transition-colors flex items-center gap-1 border border-red-700/50"
                title="Limpiar opciones de la base local"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Limpiar Local</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Tabs */}
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          {/* Side categories navigation */}
          <div className="w-full md:w-64 bg-slate-950 p-3 border-r border-slate-800 flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-y-auto">
            {categories.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setActiveTab(cat.key)}
                className={`flex items-center justify-between gap-2 px-3 py-2.5 rounded text-xs font-mono font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                  activeTab === cat.key
                    ? 'bg-orange-600 text-white shadow-md'
                    : 'text-slate-300 hover:bg-slate-850'
                }`}
              >
                <div className="flex items-center gap-2">
                  {cat.icon}
                  <span>{cat.label}</span>
                </div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${activeTab === cat.key ? 'bg-orange-700 text-white' : 'bg-slate-800 text-slate-400'}`}>
                  {bdOptions[cat.key]?.length || 0}
                </span>
              </button>
            ))}
          </div>

          {/* Active category details and Add form */}
          <div className="flex-1 p-5 overflow-y-auto flex flex-col gap-4 bg-slate-900">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div>
                <h4 className="font-bold text-sm font-mono uppercase text-white flex items-center gap-2">
                  {categories.find((c) => c.key === activeTab)?.label}
                </h4>
              </div>
            </div>

            {/* Form to add new value */}
            <form onSubmit={handleAdd} className="flex gap-2">
              <input
                type="text"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder={`Nuevo registro en ${categories.find((c) => c.key === activeTab)?.label}...`}
                className="flex-1 px-3.5 py-2 rounded text-sm font-mono border border-slate-700 bg-slate-950 text-white focus:outline-none focus:border-orange-500"
              />
              <button
                type="submit"
                disabled={loading || !newValue.trim()}
                className="px-4 py-2 rounded bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white text-xs font-bold font-mono uppercase tracking-wider flex items-center gap-1.5 transition-colors shadow-md"
              >
                <Plus className="w-4 h-4" />
                Agregar
              </button>
            </form>

            {/* List of current values */}
            <div className="flex flex-col gap-1.5 mt-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                Registros existentes ({bdOptions[activeTab]?.length || 0}):
              </span>
              <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1 font-mono">
                {bdOptions[activeTab]?.map((val, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between px-3 py-2 rounded bg-slate-800/80 border border-slate-700/80 text-xs text-slate-200 group hover:border-slate-600"
                  >
                    <span>{val}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-500">#{idx + 1}</span>
                      {onDeleteOption && (
                        <button
                          type="button"
                          onClick={() => handleDelete(val)}
                          className="p-1 text-slate-500 hover:text-red-400 transition-colors rounded"
                          title="Eliminar opción"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {(!bdOptions[activeTab] || bdOptions[activeTab].length === 0) && (
                  <p className="text-xs text-slate-500 italic py-4 text-center font-mono">
                    No hay registros en esta categoría.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

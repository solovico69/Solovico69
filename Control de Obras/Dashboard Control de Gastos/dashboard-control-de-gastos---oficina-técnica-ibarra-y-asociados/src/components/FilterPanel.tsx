import React, { useMemo } from 'react';

import { ExpenseRecord, FilterState } from '../types';
import { Search, Filter, RefreshCw, UserCheck, Building2, Layers, Wrench, Calendar } from 'lucide-react';

interface Props {
  allRecords: ExpenseRecord[];
  filters: FilterState;
  onFilterChange: (newFilters: FilterState) => void;
  onResetFilters: () => void;
  onRefreshData?: () => void;
  isSyncing?: boolean;
}

export const FilterPanel: React.FC<Props> = ({
  allRecords,
  filters,
  onFilterChange,
  onResetFilters,
  onRefreshData,
  isSyncing,
}) => {
  // 1. Unique Obras
  const obras = useMemo(() => {
    const set = new Set(allRecords.map((r) => r.obra).filter(Boolean));
    return Array.from(set).sort();
  }, [allRecords]);

  // 2. Chained Sectors based on selected Obra
  const availableSectors = useMemo(() => {
    let list = allRecords;
    if (filters.obra) {
      list = list.filter((r) => r.obra === filters.obra);
    }
    const set = new Set(list.map((r) => r.sector).filter(Boolean));
    return Array.from(set).sort();
  }, [allRecords, filters.obra]);

  // 3. Chained Disciplines based on selected Obra and Sector
  const availableDisciplines = useMemo(() => {
    let list = allRecords;
    if (filters.obra) {
      list = list.filter((r) => r.obra === filters.obra);
    }
    if (filters.sector) {
      list = list.filter((r) => r.sector === filters.sector);
    }
    const set = new Set(list.map((r) => r.disciplina).filter(Boolean));
    return Array.from(set).sort();
  }, [allRecords, filters.obra, filters.sector]);

  // 4. Registrado Por List
  const registradores = useMemo(() => {
    const set = new Set(allRecords.map((r) => r.registradoPor).filter(Boolean));
    return Array.from(set).sort();
  }, [allRecords]);

  // 5. Agrupaciones
  const agrupaciones = useMemo(() => {
    const set = new Set(allRecords.map((r) => r.agrupacion).filter(Boolean));
    return Array.from(set).sort();
  }, [allRecords]);

  // 6. Meses & Anos
  const meses = useMemo(() => {
    const set = new Set(allRecords.map((r) => r.mes).filter(Boolean));
    return Array.from(set).sort();
  }, [allRecords]);

  const handleChange = (key: keyof FilterState, value: string) => {
    const nextFilters = { ...filters, [key]: value };

    // Reset child filters if parent changes for hierarchy
    if (key === 'obra') {
      nextFilters.sector = '';
      nextFilters.disciplina = '';
    } else if (key === 'sector') {
      nextFilters.disciplina = '';
    }

    onFilterChange(nextFilters);
  };

  const hasActiveFilters = Boolean(
    filters.obra ||
      filters.sector ||
      filters.disciplina ||
      filters.registradoPor ||
      filters.searchQuery ||
      filters.mes ||
      filters.agrupacion
  );

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm mb-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg">
            <Filter className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-sm tracking-wide">
              FILTROS JERÁRQUICOS Y DE AUDITORÍA
            </h3>
            <p className="text-xs text-slate-500">
              Encadenamiento: OBRA &gt; SECTOR &gt; DISCIPLINA + Auditoría por Usuario
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={onResetFilters}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Limpiar Filtros
            </button>
          )}

          {onRefreshData && (
            <button
              onClick={onRefreshData}
              disabled={isSyncing}
              className="text-xs font-semibold px-3.5 py-1.5 rounded-lg bg-emerald-800 text-white hover:bg-emerald-900 transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50"
              title="Sincronizar directamente con Google Sheets sin almacenamiento local"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Sincronizando...' : 'Sincronizar Sheets'}
            </button>
          )}
        </div>
      </div>

      {/* Filter Selects Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* 1. OBRA */}
        <div>
          <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1 flex items-center gap-1">
            <Building2 className="w-3 h-3 text-emerald-700" />
            1. OBRA
          </label>
          <select
            value={filters.obra}
            onChange={(e) => handleChange('obra', e.target.value)}
            className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
          >
            <option value="">-- TODAS LAS OBRAS --</option>
            {obras.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>

        {/* 2. SECTOR */}
        <div>
          <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1 flex items-center gap-1">
            <Layers className="w-3 h-3 text-emerald-700" />
            2. SECTOR
          </label>
          <select
            value={filters.sector}
            onChange={(e) => handleChange('sector', e.target.value)}
            disabled={!availableSectors.length}
            className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white disabled:opacity-50"
          >
            <option value="">-- TODOS LOS SECTORES --</option>
            {availableSectors.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* 3. DISCIPLINA */}
        <div>
          <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1 flex items-center gap-1">
            <Wrench className="w-3 h-3 text-emerald-700" />
            3. DISCIPLINA
          </label>
          <select
            value={filters.disciplina}
            onChange={(e) => handleChange('disciplina', e.target.value)}
            disabled={!availableDisciplines.length}
            className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white disabled:opacity-50"
          >
            <option value="">-- TODAS LAS DISCIPLINAS --</option>
            {availableDisciplines.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        {/* 4. REGISTRADO POR (Auditoría) */}
        <div>
          <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1 flex items-center gap-1">
            <UserCheck className="w-3 h-3 text-emerald-700" />
            REGISTRADO POR
          </label>
          <select
            value={filters.registradoPor}
            onChange={(e) => handleChange('registradoPor', e.target.value)}
            className="w-full text-xs bg-emerald-50/60 border border-emerald-300 rounded-lg px-2.5 py-2 font-semibold text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
          >
            <option value="">-- TODOS LOS USUARIOS --</option>
            {registradores.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        {/* 5. AGRUPACIÓN */}
        <div>
          <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1 flex items-center gap-1">
            AGRUPACIÓN
          </label>
          <select
            value={filters.agrupacion}
            onChange={(e) => handleChange('agrupacion', e.target.value)}
            className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
          >
            <option value="">-- TODAS --</option>
            {agrupaciones.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>

        {/* 6. MES */}
        <div>
          <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1 flex items-center gap-1">
            <Calendar className="w-3 h-3 text-emerald-700" />
            MES
          </label>
          <select
            value={filters.mes}
            onChange={(e) => handleChange('mes', e.target.value)}
            className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
          >
            <option value="">-- TODOS LOS MESES --</option>
            {meses.map((m) => (
              <option key={m} value={m}>
                {m.toUpperCase()}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Global Search Bar */}
      <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={filters.searchQuery}
            onChange={(e) => handleChange('searchQuery', e.target.value)}
            placeholder="Buscar por Descripción, N° Factura, Proveedor / Razón Social o # Orden (ej: GTO-000001, VENYESA, Drywall)..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white font-medium text-slate-800 placeholder-slate-400"
          />
        </div>
        {filters.searchQuery && (
          <button
            onClick={() => handleChange('searchQuery', '')}
            className="text-xs text-slate-500 hover:text-slate-800 font-medium px-2 py-1"
          >
            Limpiar
          </button>
        )}
      </div>
    </div>
  );
};

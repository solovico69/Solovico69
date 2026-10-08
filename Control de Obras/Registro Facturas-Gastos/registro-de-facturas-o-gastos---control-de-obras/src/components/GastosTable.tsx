import React, { useState, useMemo } from 'react';
import { GastoRecord } from '../types';
import { formatCurrencyUsd, formatCurrencyBs } from '../utils/calculations';
import {
  Search,
  Filter,
  Download,
  Trash2,
  Table as TableIcon,
  ChevronLeft,
  ChevronRight,
  Layers,
  Building2,
  DollarSign,
  FileSpreadsheet,
} from 'lucide-react';

interface GastosTableProps {
  records: GastoRecord[];
  onDeleteRecord: (id: string) => Promise<void>;
  onRefresh: () => void;
}

export const GastosTable: React.FC<GastosTableProps> = ({
  records,
  onDeleteRecord,
  onRefresh,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterObra, setFilterObra] = useState('ALL');
  const [filterSector, setFilterSector] = useState('ALL');
  const [filterDisciplina, setFilterDisciplina] = useState('ALL');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // Extract unique filter options
  const uniqueObras = useMemo(() => Array.from(new Set(records.map((r) => r.obra))).filter(Boolean), [records]);
  const uniqueSectores = useMemo(() => Array.from(new Set(records.map((r) => r.sector))).filter(Boolean), [records]);
  const uniqueDisciplinas = useMemo(() => Array.from(new Set(records.map((r) => r.disciplina))).filter(Boolean), [records]);

  // Filtered records
  const filteredRecords = useMemo(() => {
    return records.filter((item) => {
      const matchesSearch =
        !searchTerm.trim() ||
        item.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.razonSocial.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.nFactura.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.obra.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sector.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesObra = filterObra === 'ALL' || item.obra === filterObra;
      const matchesSector = filterSector === 'ALL' || item.sector === filterSector;
      const matchesDisciplina = filterDisciplina === 'ALL' || item.disciplina === filterDisciplina;

      return matchesSearch && matchesObra && matchesSector && matchesDisciplina;
    });
  }, [records, searchTerm, filterObra, filterSector, filterDisciplina]);

  // Calculate totals for filtered dataset
  const totals = useMemo(() => {
    return filteredRecords.reduce(
      (acc, curr) => {
        acc.sinIva += curr.totalSinIva || 0;
        acc.iva += curr.ivaUsd || 0;
        acc.conIva += curr.totalConIva || 0;
        return acc;
      },
      { sinIva: 0, iva: 0, conIva: 0 }
    );
  }, [filteredRecords]);

  // Paginated records
  const totalPages = Math.ceil(filteredRecords.length / pageSize) || 1;
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRecords.slice(start, start + pageSize);
  }, [filteredRecords, currentPage]);

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6 animate-fadeIn text-slate-200">
      {/* Metrics Header */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg bg-slate-800/80 border border-slate-700 shadow-xl flex items-center gap-3">
          <div className="p-3 bg-orange-600/20 text-orange-400 rounded border border-orange-500/30">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">Total Registros</span>
            <div className="text-xl font-bold font-mono text-white">
              {filteredRecords.length}
            </div>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-slate-800/80 border border-slate-700 shadow-xl flex items-center gap-3">
          <div className="p-3 bg-slate-700/60 text-slate-300 rounded border border-slate-600">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">Total $ Sin IVA</span>
            <div className="text-xl font-bold font-mono text-slate-200">
              {formatCurrencyUsd(totals.sinIva)}
            </div>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-slate-800/80 border border-slate-700 shadow-xl flex items-center gap-3">
          <div className="p-3 bg-orange-950/40 text-orange-400 rounded border border-orange-800/60">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">Total IVA $$</span>
            <div className="text-xl font-bold font-mono text-orange-400">
              {formatCurrencyUsd(totals.iva)}
            </div>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-slate-900 border-l-4 border-orange-600 border-y border-r border-slate-700 shadow-xl flex items-center gap-3">
          <div className="p-3 bg-orange-600 text-white rounded">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-orange-400 font-bold uppercase tracking-wider font-mono">Total $ Con IVA</span>
            <div className="text-2xl font-black font-mono text-white">
              {formatCurrencyUsd(totals.conIva)}
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-lg bg-slate-800/90 border border-slate-700 shadow-xl flex flex-col lg:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full lg:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por descripción, proveedor, N° factura..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-3.5 py-2 rounded text-xs border border-slate-700 bg-slate-900 text-slate-100 focus:border-orange-500 outline-none transition-colors"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <select
            value={filterObra}
            onChange={(e) => {
              setFilterObra(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 rounded text-xs font-bold font-mono border border-slate-700 bg-slate-900 text-slate-200 outline-none focus:border-orange-500"
          >
            <option value="ALL">Todas las Obras</option>
            {uniqueObras.map((ob, idx) => (
              <option key={idx} value={ob}>{ob}</option>
            ))}
          </select>

          <select
            value={filterSector}
            onChange={(e) => {
              setFilterSector(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 rounded text-xs font-bold font-mono border border-slate-700 bg-slate-900 text-slate-200 outline-none focus:border-orange-500"
          >
            <option value="ALL">Todos los Sectores</option>
            {uniqueSectores.map((sc, idx) => (
              <option key={idx} value={sc}>{sc}</option>
            ))}
          </select>

          <select
            value={filterDisciplina}
            onChange={(e) => {
              setFilterDisciplina(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 rounded text-xs font-bold font-mono border border-slate-700 bg-slate-900 text-slate-200 outline-none focus:border-orange-500"
          >
            <option value="ALL">Todas las Disciplinas</option>
            {uniqueDisciplinas.map((dc, idx) => (
              <option key={idx} value={dc}>{dc}</option>
            ))}
          </select>

          <a
            href="/api/export/csv"
            download
            className="px-3.5 py-2 rounded bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 transition-colors ml-auto shadow-md"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Descargar CSV</span>
          </a>
        </div>
      </div>

      {/* Spreadsheet Table View */}
      <div className="bg-slate-900/90 rounded-lg border border-slate-700 shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950 text-orange-400 font-bold font-mono uppercase tracking-wider text-[10px] border-b border-slate-700">
                <th className="p-3">Obra / Sector</th>
                <th className="p-3">Agrupación / Disciplina</th>
                <th className="p-3">Fecha / N° Factura</th>
                <th className="p-3">Razón Social</th>
                <th className="p-3">Descripción</th>
                <th className="p-3">Métrica / Cant.</th>
                <th className="p-3 text-right">Precio Bs</th>
                <th className="p-3 text-right">Total $ Sin IVA</th>
                <th className="p-3 text-center">IVA</th>
                <th className="p-3 text-right">Total $ Con IVA</th>
                <th className="p-3 text-center">Registrado Por</th>
                <th className="p-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-medium text-slate-200">
              {paginatedRecords.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-slate-800/80 transition-colors border-b border-slate-800/60"
                >
                  <td className="p-3 max-w-[160px]">
                    <div className="font-bold text-white truncate" title={item.obra}>
                      {item.obra}
                    </div>
                    <div className="text-[10px] text-orange-400 font-mono font-bold uppercase">{item.sector}</div>
                  </td>

                  <td className="p-3 max-w-[140px]">
                    <div className="font-semibold text-slate-200">{item.agrupacion}</div>
                    <div className="text-[10px] text-slate-400 truncate font-mono">{item.disciplina}</div>
                  </td>

                  <td className="p-3 whitespace-nowrap font-mono text-slate-300">
                    <div>{item.fechaFactura}</div>
                    <div className="text-[10px] text-slate-500">Fact: {item.nFactura || 'S/C'}</div>
                  </td>

                  <td className="p-3 max-w-[160px] truncate font-semibold text-slate-200" title={item.razonSocial}>
                    {item.razonSocial}
                  </td>

                  <td className="p-3 max-w-[220px]" title={item.descripcion}>
                    <div className="line-clamp-2 text-slate-100">{item.descripcion}</div>
                  </td>

                  <td className="p-3 whitespace-nowrap font-mono">
                    <span className="font-bold text-white">{item.cantidad}</span> <span className="text-[10px] text-slate-400">{item.metrica}</span>
                  </td>

                  <td className="p-3 text-right font-mono text-slate-300 whitespace-nowrap">
                    {item.preciosUnitariosBs !== undefined ? formatCurrencyBs(item.preciosUnitariosBs) : '-'}
                  </td>

                  <td className="p-3 text-right font-mono font-bold text-slate-200 whitespace-nowrap">
                    {formatCurrencyUsd(item.totalSinIva)}
                  </td>

                  <td className="p-3 text-center font-mono">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${item.ivaSiNo ? 'bg-orange-950/80 border border-orange-700/80 text-orange-300' : 'bg-slate-800 text-slate-400'}`}>
                      {item.ivaSiNo ? 'SÍ (16%)' : 'NO'}
                    </span>
                  </td>

                  <td className="p-3 text-right font-mono font-extrabold text-orange-400 text-sm whitespace-nowrap">
                    {formatCurrencyUsd(item.totalConIva)}
                  </td>

                  <td className="p-3 text-center text-[10px] font-mono font-bold text-slate-400 whitespace-nowrap">
                    {item.registradoPor}
                  </td>

                  <td className="p-3 text-center">
                    <button
                      onClick={() => onDeleteRecord(item.id)}
                      className="p-1.5 rounded text-slate-500 hover:text-red-400 hover:bg-red-950/40 transition-colors"
                      title="Eliminar este registro"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}

              {filteredRecords.length === 0 && (
                <tr>
                  <td colSpan={12} className="p-8 text-center text-slate-500 italic font-mono">
                    No se encontraron registros de gastos que coincidan con la búsqueda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between font-mono">
          <span className="text-xs text-slate-400 font-medium">
            Mostrando {paginatedRecords.length} de {filteredRecords.length} registros (Página {currentPage} de {totalPages})
          </span>

          <div className="flex items-center gap-1">
            <button
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-2 rounded bg-slate-800 border border-slate-700 disabled:opacity-40 text-slate-300 hover:bg-slate-700 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-2 rounded bg-slate-800 border border-slate-700 disabled:opacity-40 text-slate-300 hover:bg-slate-700 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { GastoRecord } from '../types';
import { formatCurrencyUsd } from '../utils/calculations';
import {
  History,
  FileText,
  ExternalLink,
  X,
  Building2,
  Calendar,
  DollarSign,
  User,
  Package,
  Layers,
  Hash,
  Tag,
  Receipt,
  Info,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';

export function formatDateString(val?: string): string {
  if (!val || val === 'N/A' || val === '-') return '-';
  const trimmed = val.trim();
  if (trimmed.includes('T')) {
    const datePart = trimmed.split('T')[0];
    if (datePart.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [y, m, d] = datePart.split('-');
      return `${d}/${m}/${y}`;
    }
    return datePart;
  }
  if (trimmed.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const [y, m, d] = trimmed.split('-');
    return `${d}/${m}/${y}`;
  }
  return trimmed;
}

export interface ConsolidatedOrder {
  nOrden: string;
  fechaFactura: string;
  razonSocial: string;
  obra: string;
  sector: string;
  agrupacion: string;
  disciplina: string;
  nFactura: string;
  registradoPor: string;
  montoTotalConIva: number;
  montoTotalSinIva: number;
  montoIva: number;
  items: GastoRecord[];
}

/**
 * Extracts and consolidates the last 5 unique orders from the CONTROL_GASTOS dataset,
 * searching from the most recent rows upwards.
 */
export function getUltimasCincoOrdenes(gastos: GastoRecord[]): ConsolidatedOrder[] {
  if (!gastos || gastos.length === 0) return [];

  // 1. Recorrer desde la última fila hacia arriba para encontrar los primeros 5 códigos de orden únicos
  const last5Codes: string[] = [];
  const seen = new Set<string>();

  for (let i = gastos.length - 1; i >= 0; i--) {
    const code = gastos[i].nOrden?.trim();
    if (code && !seen.has(code)) {
      seen.add(code);
      last5Codes.push(code);
      if (last5Codes.length === 5) break;
    }
  }

  // 2. Para cada código identificado, buscar ÚNICAMENTE las filas con ese ID exacto
  return last5Codes.map((code) => {
    const items = gastos.filter((g) => g.nOrden?.trim() === code);
    const first = items[0] || ({} as GastoRecord);

    const montoTotalConIva = items.reduce((acc, curr) => acc + (Number(curr.totalConIva) || 0), 0);
    const montoTotalSinIva = items.reduce((acc, curr) => acc + (Number(curr.totalSinIva) || 0), 0);
    const montoIva = items.reduce((acc, curr) => acc + (Number(curr.ivaUsd) || 0), 0);

    return {
      nOrden: code,
      fechaFactura: first.fechaFactura || '',
      razonSocial: first.razonSocial || 'N/A',
      obra: first.obra || 'N/A',
      sector: first.sector || 'N/A',
      agrupacion: first.agrupacion || 'N/A',
      disciplina: first.disciplina || 'N/A',
      nFactura: first.nFactura || 'S/C',
      registradoPor: first.registradoPor || 'N/A',
      montoTotalConIva,
      montoTotalSinIva,
      montoIva,
      items,
    };
  });
}

interface HistorialOrdenesProps {
  gastos: GastoRecord[];
  onRefreshData?: () => Promise<void> | void;
}

export const HistorialOrdenes: React.FC<HistorialOrdenesProps> = ({ gastos, onRefreshData }) => {
  const [selectedOrder, setSelectedOrder] = useState<ConsolidatedOrder | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncedTime, setLastSyncedTime] = useState<string | null>(null);

  const ultimasOrdenes = getUltimasCincoOrdenes(gastos);

  const handleManualSync = async () => {
    setSyncing(true);
    try {
      if (onRefreshData) {
        await onRefreshData();
      }
      const now = new Date();
      setLastSyncedTime(now.toLocaleTimeString());
    } catch (err) {
      console.error('Error al sincronizar historial:', err);
    } finally {
      setTimeout(() => {
        setSyncing(false);
      }, 600);
    }
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-6 animate-fadeIn">
      {/* Container Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md overflow-hidden">
        {/* Card Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 rounded-xl border border-indigo-200 dark:border-indigo-800/60 shadow-2xs">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                  Historial de las Últimas 5 Órdenes
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                  Solo Lectura
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Datos consolidados en tiempo real desde la pestaña CONTROL_GASTOS
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
            {/* Botón de Sincronización Manual */}
            <button
              type="button"
              onClick={handleManualSync}
              disabled={syncing}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-all duration-200 disabled:opacity-60 cursor-pointer active:scale-95"
              title="Haga clic para actualizar y sincronizar la tabla con la base de datos real"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
              <span>{syncing ? 'Sincronizando...' : 'Sincronizar'}</span>
            </button>

            {lastSyncedTime && (
              <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="w-3 h-3" />
                <span>Act. {lastSyncedTime}</span>
              </span>
            )}

            <div className="text-xs text-slate-500 dark:text-slate-400 font-mono bg-slate-100 dark:bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700/60">
              {ultimasOrdenes.length} órdenes
            </div>
          </div>
        </div>

        {/* Tabla de Historial (4 Columnas) */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 font-bold font-mono uppercase tracking-wider text-[11px] border-b border-slate-200 dark:border-slate-800">
                <th className="p-4 sm:pl-6"># ORDEN</th>
                <th className="p-4">FECHA</th>
                <th className="p-4">RAZÓN SOCIAL</th>
                <th className="p-4 sm:pr-6 text-right">MONTO TOTAL ($)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium text-slate-800 dark:text-slate-200">
              {ultimasOrdenes.map((ord) => (
                <tr
                  key={ord.nOrden}
                  className="hover:bg-indigo-50/50 dark:hover:bg-slate-800/60 transition-colors"
                >
                  {/* # ORDEN (con hipervínculo / click) */}
                  <td className="p-4 sm:pl-6 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => setSelectedOrder(ord)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 text-indigo-600 dark:text-indigo-400 font-mono font-extrabold text-xs border border-indigo-200 dark:border-indigo-800/60 transition-all cursor-pointer group shadow-2xs"
                      title="Haga clic para ver el detalle de esta orden"
                    >
                      <span>{ord.nOrden}</span>
                      <ExternalLink className="w-3.5 h-3.5 opacity-70 group-hover:opacity-100 transition-opacity" />
                    </button>
                  </td>

                  {/* FECHA */}
                  <td className="p-4 whitespace-nowrap font-mono text-slate-600 dark:text-slate-300">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{formatDateString(ord.fechaFactura)}</span>
                    </div>
                  </td>

                  {/* RAZÓN SOCIAL */}
                  <td className="p-4 font-semibold text-slate-900 dark:text-slate-100">
                    <div className="line-clamp-1 max-w-[280px]" title={ord.razonSocial}>
                      {ord.razonSocial}
                    </div>
                    {ord.items.length > 1 && (
                      <span className="text-[10px] text-slate-400 font-mono font-normal">
                        ({ord.items.length} ítems registrados)
                      </span>
                    )}
                  </td>

                  {/* MONTO TOTAL ($) */}
                  <td className="p-4 sm:pr-6 text-right whitespace-nowrap font-mono">
                    <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">
                      {formatCurrencyUsd(ord.montoTotalConIva)}
                    </span>
                  </td>
                </tr>
              ))}

              {ultimasOrdenes.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-500 italic font-mono">
                    No se encontraron órdenes registradas en CONTROL_GASTOS.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Interactivo de Detalle de la Orden */}
      {selectedOrder && (
        <div
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-6 animate-fadeIn"
          onClick={() => setSelectedOrder(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 sm:p-6 bg-slate-900 text-white border-b border-slate-800 flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-600 rounded-xl text-white shadow-md">
                  <Receipt className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-indigo-300 font-bold">
                      Detalle General de Compra
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-800">
                      Solo Lectura
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black font-mono tracking-tight text-white mt-0.5">
                    {selectedOrder.nOrden}
                  </h2>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Cerrar ventana"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Content */}
            <div className="p-5 sm:p-6 space-y-6 overflow-y-auto">
              {/* Cabecera: Datos generales de la factura */}
              <div>
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  Cabecera: Datos Generales de la Factura
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-xs">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block font-mono">Razón Social</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">{selectedOrder.razonSocial}</span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block font-mono">Fecha Factura</span>
                    <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{formatDateString(selectedOrder.fechaFactura)}</span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block font-mono">N° Factura</span>
                    <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{selectedOrder.nFactura}</span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block font-mono">Obra</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">{selectedOrder.obra}</span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block font-mono">Sector</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">{selectedOrder.sector}</span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block font-mono">Agrupación / Disciplina</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {selectedOrder.agrupacion} {selectedOrder.disciplina ? `(${selectedOrder.disciplina})` : ''}
                    </span>
                  </div>

                  <div className="sm:col-span-2 lg:col-span-3 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex justify-between items-center">
                    <span className="text-[10px] font-bold uppercase text-slate-400 font-mono">Registrado Por</span>
                    <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{selectedOrder.registradoPor}</span>
                  </div>
                </div>
              </div>

              {/* Cuerpo: Lista detallada de DESCRIPCIÓN y CANTIDAD */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    Cuerpo: Lista Detallada de Ítems
                  </h4>
                  <span className="text-[10px] font-mono text-slate-400">
                    {selectedOrder.items.length} ítem(s) en este código
                  </span>
                </div>

                <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 font-bold font-mono uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800">
                        <th className="p-3">#</th>
                        <th className="p-3">DISCIPLINA</th>
                        <th className="p-3">DESCRIPCIÓN</th>
                        <th className="p-3 text-center">CANTIDAD</th>
                        <th className="p-3 text-center">MÉTRICA</th>
                        <th className="p-3 text-right">TOTAL $ CON IVA</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium text-slate-800 dark:text-slate-200">
                      {selectedOrder.items.map((item, idx) => (
                        <tr key={item.id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="p-3 font-mono text-slate-400 text-[10px]">{idx + 1}</td>
                          <td className="p-3 font-mono text-xs text-indigo-600 dark:text-indigo-400 font-medium">{item.disciplina || '-'}</td>
                          <td className="p-3 font-semibold text-slate-900 dark:text-slate-100">{item.descripcion}</td>
                          <td className="p-3 text-center font-mono font-bold text-indigo-600 dark:text-indigo-400">{item.cantidad}</td>
                          <td className="p-3 text-center font-mono text-slate-500 text-[11px]">{item.metrica}</td>
                          <td className="p-3 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                            {formatCurrencyUsd(item.totalConIva)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Consolidación Financiera Footer inside Modal */}
              <div className="p-4 rounded-xl bg-indigo-50 dark:bg-slate-800/80 border border-indigo-100 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs text-slate-600 dark:text-slate-300">
                  <span className="font-bold text-slate-800 dark:text-slate-100 block">Consolidación Financiera de Compra</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Suma total consolidada de todos los ítems asociados al orden {selectedOrder.nOrden}</span>
                </div>

                <div className="text-right font-mono">
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400 uppercase font-bold block">
                    Costo Real de Compra Completa
                  </span>
                  <span className="text-2xl font-black text-indigo-700 dark:text-indigo-300">
                    {formatCurrencyUsd(selectedOrder.montoTotalConIva)}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="px-5 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold uppercase tracking-wider transition-colors"
              >
                Cerrar Detalle
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

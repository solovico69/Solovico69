import React, { useState } from 'react';
import { ExpenseRecord } from '../types';
import { formatCurrency, formatDisplayDate } from '../utils/csvParser';
import { Image, ExternalLink, ChevronRight, Eye } from 'lucide-react';

interface Props {
  records: ExpenseRecord[];
  onSelectRecord: (record: ExpenseRecord) => void;
  onOpenPhotoLightbox: (photos: string[], initialIndex?: number) => void;
}

export const ExpenseTable: React.FC<Props> = ({
  records,
  onSelectRecord,
  onOpenPhotoLightbox,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const totalPages = Math.ceil(records.length / itemsPerPage);
  const paginatedRecords = records.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-6">
      {/* Header bar */}
      <div className="px-5 py-3.5 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <h3 className="font-bold text-sm tracking-wide">
            REGISTROS DE 'CONTROL_GASTOS' ({records.length} ENCONTRADOS)
          </h3>
        </div>
        <span className="text-xs text-slate-300 font-medium">
          Haz clic en cualquier registro para desplegar el desglose completo de auditoría
        </span>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-100 text-slate-700 text-[11px] font-extrabold uppercase tracking-wider border-b border-slate-200">
              <th className="py-3 px-3"># Orden</th>
              <th className="py-3 px-3">Fecha</th>
              <th className="py-3 px-[#10b981]">Obra / Sector</th>
              <th className="py-3 px-3">Disciplina</th>
              <th className="py-3 px-3">Proveedor / Razón Social</th>
              <th className="py-3 px-3">Descripción del Gasto</th>
              <th className="py-3 px-3 text-center">Cant.</th>
              <th className="py-3 px-3 text-right">Total Sin IVA ($)</th>
              <th className="py-3 px-3 text-right">IVA ($)</th>
              <th className="py-3 px-3 text-right bg-emerald-50/70 text-emerald-950 font-black">
                Total Con IVA ($)
              </th>
              <th className="py-3 px-3 text-center">Fotos</th>
              <th className="py-3 px-3">Registrado Por</th>
              <th className="py-3 px-2 text-center">Detalle</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {paginatedRecords.length === 0 ? (
              <tr>
                <td colSpan={13} className="py-12 text-center text-slate-500 font-medium">
                  No se encontraron gastos que coincidan con los filtros seleccionados.
                </td>
              </tr>
            ) : (
              paginatedRecords.map((r) => (
                <tr
                  key={r.id}
                  className="hover:bg-emerald-50/40 transition-colors cursor-pointer group"
                  onClick={() => onSelectRecord(r)}
                >
                  {/* # ORDEN */}
                  <td className="py-3 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                    <span className="bg-slate-100 text-slate-800 border border-slate-300 px-2 py-0.5 rounded font-mono text-[11px]">
                      {r.numOrden || 'GTO'}
                    </span>
                  </td>

                  {/* FECHA */}
                  <td className="py-3 px-3 text-slate-700 whitespace-nowrap font-medium">
                    <span className="font-mono text-[11px] font-semibold bg-slate-50 text-slate-800 border border-slate-200/80 px-2 py-0.5 rounded-md inline-block shadow-2xs">
                      {formatDisplayDate(r.fechaFactura || r.fechaCorte)}
                    </span>
                  </td>

                  {/* OBRA & SECTOR */}
                  <td className="py-3 px-3">
                    <div className="font-bold text-slate-900 leading-snug">{r.obra}</div>
                    <div className="text-[11px] text-emerald-700 font-semibold">{r.sector}</div>
                  </td>

                  {/* DISCIPLINA */}
                  <td className="py-3 px-3 font-semibold text-slate-700">
                    <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px]">
                      {r.disciplina}
                    </span>
                  </td>

                  {/* RAZÓN SOCIAL */}
                  <td className="py-3 px-3 text-slate-800 max-w-[160px] truncate font-medium" title={r.razonSocial}>
                    {r.razonSocial}
                  </td>

                  {/* DESCRIPCIÓN */}
                  <td className="py-3 px-3 text-slate-900 max-w-[220px] font-normal" title={r.descripcion}>
                    <p className="line-clamp-2">{r.descripcion}</p>
                  </td>

                  {/* CANTIDAD & METRICA */}
                  <td className="py-3 px-3 text-center whitespace-nowrap font-semibold text-slate-700">
                    {r.cantidad} <span className="text-[10px] text-slate-500 font-normal">{r.metrica}</span>
                  </td>

                  {/* TOTAL SIN IVA */}
                  <td className="py-3 px-3 text-right font-medium text-slate-700 whitespace-nowrap">
                    {formatCurrency(r.totalSinIva, 'USD')}
                  </td>

                  {/* IVA $$ */}
                  <td className="py-3 px-3 text-right font-medium text-slate-500 whitespace-nowrap">
                    {r.ivaMonto > 0 ? formatCurrency(r.ivaMonto, 'USD') : '-'}
                  </td>

                  {/* TOTAL CON IVA (Highlight) */}
                  <td className="py-3 px-3 text-right font-black text-emerald-900 bg-emerald-50/50 group-hover:bg-emerald-100/60 whitespace-nowrap">
                    {formatCurrency(r.totalConIva, 'USD')}
                  </td>

                  {/* FOTOS THUMBNAILS */}
                  <td
                    className="py-3 px-3 text-center whitespace-nowrap"
                    onClick={(e) => {
                      if (r.fotos && r.fotos.length > 0) {
                        e.stopPropagation();
                        onOpenPhotoLightbox(r.fotos, 0);
                      }
                    }}
                  >
                    {r.fotos && r.fotos.length > 0 ? (
                      <div className="flex items-center justify-center -space-x-1 hover:scale-105 transition-transform">
                        {r.fotos.slice(0, 2).map((photoUrl, idx) => (
                          <div
                            key={idx}
                            className="w-8 h-8 rounded-lg overflow-hidden border-2 border-white shadow-sm bg-slate-100 relative group/photo"
                          >
                            <img
                              src={photoUrl}
                              alt={`Evidencia ${idx + 1}`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                // Fallback icon on broken image
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.parentElement!.classList.add('flex', 'items-center', 'justify-center');
                              }}
                            />
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/photo:opacity-100 flex items-center justify-center transition-opacity">
                              <Eye className="w-3.5 h-3.5 text-white" />
                            </div>
                          </div>
                        ))}
                        {r.fotos.length > 2 && (
                          <span className="w-6 h-6 rounded-full bg-slate-800 text-white text-[10px] font-bold flex items-center justify-center border border-white">
                            +{r.fotos.length - 2}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-400 italic">Sin foto</span>
                    )}
                  </td>

                  {/* REGISTRADO POR */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    <span className="text-[11px] font-semibold text-slate-800 bg-slate-100 px-2 py-1 rounded-md border border-slate-200">
                      {r.registradoPor}
                    </span>
                  </td>

                  {/* DETALLE ACTION */}
                  <td className="py-3 px-2 text-center whitespace-nowrap">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectRecord(r);
                      }}
                      className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-100 rounded-lg transition-colors"
                      title="Ver Modal de Orden Completa"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <div>
            Mostrando página <strong className="text-slate-900">{currentPage}</strong> de{' '}
            <strong className="text-slate-900">{totalPages}</strong> ({records.length} total)
          </div>
          <div className="flex items-center gap-1.5">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1 rounded bg-white border border-slate-300 font-semibold hover:bg-slate-100 disabled:opacity-40"
            >
              Anterior
            </button>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1 rounded bg-white border border-slate-300 font-semibold hover:bg-slate-100 disabled:opacity-40"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

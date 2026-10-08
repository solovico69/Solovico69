import React from 'react';
import { ExpenseRecord } from '../types';
import { formatCurrency, formatDisplayDate } from '../utils/csvParser';
import { X, FileText, UserCheck, Calendar, Building, DollarSign, Image, ExternalLink, ShieldCheck } from 'lucide-react';

interface Props {
  record: ExpenseRecord | null;
  onClose: () => void;
  onOpenPhotos: (photos: string[]) => void;
}

export const ExpenseDetailModal: React.FC<Props> = ({
  record,
  onClose,
  onOpenPhotos,
}) => {
  if (!record) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-800/80 rounded-xl border border-emerald-600/40">
              <FileText className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-emerald-600/90 text-white font-mono text-xs px-2.5 py-0.5 rounded-full font-bold">
                  {record.numOrden || 'ORDEN SIN NÚMERO'}
                </span>
                <span className="text-xs text-emerald-300 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Auditado Solo Lectura
                </span>
              </div>
              <h3 className="text-lg font-bold text-white mt-1">
                Desglose Completo de la Orden de Gasto
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content Scrollable */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Main Financial Badge Card */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Total Registrado Con IVA
              </span>
              <span className="text-3xl font-black text-emerald-900">
                {formatCurrency(record.totalConIva, 'USD')}
              </span>
            </div>

            <div className="flex flex-wrap gap-4 text-xs font-semibold">
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="text-slate-500 block text-[10px] uppercase">Base Sin IVA</span>
                <span className="text-slate-900 font-bold">{formatCurrency(record.totalSinIva, 'USD')}</span>
              </div>

              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="text-slate-500 block text-[10px] uppercase">Monto IVA</span>
                <span className="text-slate-900 font-bold">{formatCurrency(record.ivaMonto, 'USD')}</span>
              </div>

              {record.preciosUnitariosBs && (
                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block text-[10px] uppercase">P.U. Bolívares</span>
                  <span className="text-slate-900 font-bold">{formatCurrency(record.preciosUnitariosBs, 'VES')}</span>
                </div>
              )}
            </div>
          </div>

          {/* Grid Info Columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Obra & Ubicación */}
            <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
              <h4 className="font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-100 text-[11px]">
                <Building className="w-4 h-4 text-emerald-700" />
                Ubicación y Clasificación de Obra
              </h4>

              <div>
                <span className="text-slate-500 block text-[11px]">Obra Principal:</span>
                <span className="font-bold text-slate-900 text-sm">{record.obra}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <span className="text-slate-500 block text-[10px]">Sector:</span>
                  <span className="font-bold text-emerald-800">{record.sector}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Disciplina:</span>
                  <span className="font-bold text-slate-800">{record.disciplina}</span>
                </div>
              </div>

              <div>
                <span className="text-slate-500 block text-[10px]">Agrupación:</span>
                <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                  {record.agrupacion}
                </span>
              </div>
            </div>

            {/* Facturación y Datos Fiscales */}
            <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
              <h4 className="font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-100 text-[11px]">
                <FileText className="w-4 h-4 text-emerald-700" />
                Documento y Datos Fiscales
              </h4>

              <div>
                <span className="text-slate-500 block text-[11px]">Proveedor / Razón Social:</span>
                <span className="font-bold text-slate-900">{record.razonSocial}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <span className="text-slate-500 block text-[10px]">N° Factura:</span>
                  <span className="font-mono font-bold text-slate-900">{record.numFactura || 'S/N'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Fecha Factura:</span>
                  <span className="font-semibold text-slate-800">{formatDisplayDate(record.fechaFactura)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-500 block text-[10px]">Aplica IVA:</span>
                  <span className={`font-bold ${record.ivaSiNo ? 'text-emerald-700' : 'text-slate-500'}`}>
                    {record.ivaSiNo ? 'SÍ (Aplica IVA)' : 'NO (Exento/Sin IVA)'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Tasa BCV:</span>
                  <span className="font-semibold text-slate-800">{record.bcv ? `${record.bcv} Bs/$` : 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Description Block */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-xs mb-2">
              Descripción Detallada del Gasto
            </h4>
            <p className="text-slate-900 font-medium leading-relaxed text-sm bg-white p-3 rounded-lg border border-slate-200">
              {record.descripcion}
            </p>
            <div className="mt-2 text-xs text-slate-600 flex items-center gap-4">
              <span>Cantidad: <strong className="text-slate-900">{record.cantidad}</strong></span>
              <span>Métrica: <strong className="text-slate-900">{record.metrica}</strong></span>
              {record.preciosUnitariosUsd && (
                <span>Precio Unitario USD: <strong className="text-slate-900">{formatCurrency(record.preciosUnitariosUsd, 'USD')}</strong></span>
              )}
            </div>
          </div>

          {/* Audit & Photos section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Audit User */}
            <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 flex items-center gap-3">
              <div className="p-2 bg-emerald-200 text-emerald-900 rounded-lg">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-emerald-800 uppercase block">
                  Cargado y Auditado Por
                </span>
                <span className="font-extrabold text-slate-900 text-base">
                  {record.registradoPor}
                </span>
                <span className="text-[10px] text-emerald-700 block mt-0.5">
                  Corte: {formatDisplayDate(record.fechaCorte)} ({record.mes} {record.ano})
                </span>
              </div>
            </div>

            {/* Evidencias Fotográficas */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-bold text-slate-700 uppercase block mb-2 flex items-center gap-1.5">
                <Image className="w-4 h-4 text-emerald-700" />
                Evidencias Fotográficas ({record.fotos.length})
              </span>

              {record.fotos.length > 0 ? (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => onOpenPhotos(record.fotos)}
                    className="px-3 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg font-semibold text-xs transition-colors flex items-center gap-2 shadow-sm"
                  >
                    <Image className="w-4 h-4" />
                    Abrir en Visor Lightbox ({record.fotos.length})
                  </button>
                  {record.fotos.map((url, idx) => (
                    <a
                      key={idx}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg text-slate-700 transition-colors inline-flex items-center gap-1 text-xs"
                      title="Abrir enlace original de Google Drive"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-emerald-700" />
                      Foto {idx + 1}
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">No hay enlaces de fotos adjuntos a esta orden.</p>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 text-white font-bold text-xs rounded-xl hover:bg-slate-900 transition-colors"
          >
            Cerrar Modal
          </button>
        </div>
      </div>
    </div>
  );
};

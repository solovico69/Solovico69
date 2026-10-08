import React from 'react';
import { FinancialResumenCalculations } from '../types';
import { formatCurrency } from '../utils/csvParser';
import {
  Calculator,
  DollarSign,
  TrendingUp,
  Percent,
  FileText,
  Scale,
  Building2,
  PieChart,
} from 'lucide-react';

interface Props {
  calculations: FinancialResumenCalculations;
  filteredCount: number;
  totalCount: number;
}

export const FinancialSummaryCard: React.FC<Props> = ({
  calculations,
  filteredCount,
  totalCount,
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-6">
      {/* 1. Header Title Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-slate-900 text-white px-6 py-4 flex flex-wrap items-center justify-between gap-4 border-b border-emerald-800/50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-800/60 rounded-xl border border-emerald-600/40 shadow-inner">
            <Calculator className="w-6 h-6 text-emerald-300" />
          </div>
          <div>
            <h2 className="font-extrabold text-lg tracking-wide flex items-center gap-2.5">
              RESUMEN ADMINISTRATIVO DE OBRA
              <span className="text-xs bg-emerald-800 text-emerald-100 font-semibold px-2.5 py-0.5 rounded-full border border-emerald-600/40">
                Sincronizado en Tiempo Real
              </span>
            </h2>
            <p className="text-xs text-emerald-200/90 font-medium">
              Cálculos financieros automáticos por disciplina y desglose operativo de factores
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 bg-emerald-950/80 px-3.5 py-2 rounded-xl border border-emerald-700/40 text-xs shadow-sm">
          <FileText className="w-4 h-4 text-emerald-400" />
          <span className="text-slate-200">
            Registros Auditados: <strong className="text-white font-bold">{filteredCount}</strong> / {totalCount}
          </span>
        </div>
      </div>

      {/* 2. Structured Executive 3-Column Matrix (BD $$, Ganancia $$, Ganancia BCV) */}
      <div className="p-5 bg-slate-50/60 space-y-4">
        {/* Subtitle indicator */}
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-800" />
            Matriz de Costos, Factores de Ganancia y Conversión BCV
          </h3>
          <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
            Fórmula de la pestaña RESUMEN (Desglose de arriba hacia abajo)
          </span>
        </div>

        {/* 3 Columns Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* COLUMN 1: BD $$ (Costo Base BD - Total $ Con IVA) */}
          <div className="bg-white rounded-2xl border-2 border-emerald-200 shadow-sm overflow-hidden flex flex-col justify-between">
            {/* Column Title Header */}
            <div className="bg-emerald-900 text-white p-3.5 border-b border-emerald-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-300" />
                <span className="font-extrabold text-sm uppercase tracking-wide">BD $$</span>
              </div>
              <span className="text-[10px] font-bold bg-emerald-800 text-emerald-200 px-2 py-0.5 rounded-md border border-emerald-600/40">
                COSTO BASE
              </span>
            </div>

            <div className="p-4 space-y-3.5 flex-1">
              {/* SUBTOTAL GENERAL $$ */}
              <div className="bg-emerald-50/80 rounded-xl p-3 border border-emerald-200">
                <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider block">
                  SUBTOTAL GENERAL $$
                </span>
                <span className="text-2xl font-black text-emerald-950 font-mono block mt-0.5">
                  {formatCurrency(calculations.costoBaseBd, 'USD')}
                </span>
                <span className="text-[10px] font-medium text-emerald-700 block mt-1">
                  Suma directa 'TOTAL $ CON IVA'
                </span>
              </div>

              {/* DESGLOSE PORCENTUAL (De arriba hacia abajo) */}
              <div className="space-y-2 border-t border-slate-100 pt-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">
                  Desglose Porcentual Operativo
                </span>

                {/* 10% GASTOS */}
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                  <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                    10% GASTOS
                  </span>
                  <span className="font-bold font-mono text-slate-900">
                    {formatCurrency(calculations.gastosGenerales10, 'USD')}
                  </span>
                </div>

                {/* 5% UTILIDAD */}
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                  <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    5% UTILIDAD
                  </span>
                  <span className="font-bold font-mono text-emerald-800">
                    {formatCurrency(calculations.utilidad5, 'USD')}
                  </span>
                </div>

                {/* 10% ADMINISTRACIÓN */}
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                  <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-700"></span>
                    10% ADMINISTRACIÓN
                  </span>
                  <span className="font-bold font-mono text-slate-900">
                    {formatCurrency(calculations.administracion10, 'USD')}
                  </span>
                </div>
              </div>
            </div>

            {/* TOTAL GENERAL BD */}
            <div className="bg-emerald-950 text-white p-3.5 border-t border-emerald-900 flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-200">
                TOTAL GENERAL
              </span>
              <span className="text-lg font-black font-mono text-emerald-300">
                {formatCurrency(calculations.totalGeneralBd, 'USD')}
              </span>
            </div>
          </div>

          {/* COLUMN 2: Ganancia $$ (Factor Ganancia X2 BD) */}
          <div className="bg-white rounded-2xl border-2 border-blue-200 shadow-sm overflow-hidden flex flex-col justify-between">
            {/* Column Title Header */}
            <div className="bg-blue-900 text-white p-3.5 border-b border-blue-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-300" />
                <span className="font-extrabold text-sm uppercase tracking-wide">Ganancia $$</span>
              </div>
              <span className="text-[10px] font-bold bg-blue-800 text-blue-200 px-2 py-0.5 rounded-md border border-blue-600/40">
                FACTOR X2.00
              </span>
            </div>

            <div className="p-4 space-y-3.5 flex-1">
              {/* SUBTOTAL GENERAL $$ */}
              <div className="bg-blue-50/80 rounded-xl p-3 border border-blue-200">
                <span className="text-[11px] font-bold text-blue-900 uppercase tracking-wider block">
                  SUBTOTAL GENERAL $$
                </span>
                <span className="text-2xl font-black text-blue-950 font-mono block mt-0.5">
                  {formatCurrency(calculations.factorGananciaX2, 'USD')}
                </span>
                <span className="text-[10px] font-medium text-blue-700 block mt-1">
                  Multiplicador x2.00 sobre costo base
                </span>
              </div>

              {/* DESGLOSE PORCENTUAL (De arriba hacia abajo) */}
              <div className="space-y-2 border-t border-slate-100 pt-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">
                  Desglose Porcentual Operativo
                </span>

                {/* 10% GASTOS */}
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                  <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                    10% GASTOS
                  </span>
                  <span className="font-bold font-mono text-slate-900">
                    {formatCurrency(calculations.gastosGanancia, 'USD')}
                  </span>
                </div>

                {/* 5% UTILIDAD */}
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                  <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    5% UTILIDAD
                  </span>
                  <span className="font-bold font-mono text-blue-800">
                    {formatCurrency(calculations.utilidadGanancia, 'USD')}
                  </span>
                </div>

                {/* 10% ADMINISTRACIÓN */}
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                  <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-700"></span>
                    10% ADMINISTRACIÓN
                  </span>
                  <span className="font-bold font-mono text-slate-900">
                    {formatCurrency(calculations.adminGanancia, 'USD')}
                  </span>
                </div>
              </div>
            </div>

            {/* TOTAL GENERAL GANANCIA */}
            <div className="bg-blue-950 text-white p-3.5 border-t border-blue-900 flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-blue-200">
                TOTAL GENERAL
              </span>
              <span className="text-lg font-black font-mono text-blue-300">
                {formatCurrency(calculations.totalGeneralGanancia, 'USD')}
              </span>
            </div>
          </div>

          {/* COLUMN 3: Ganancia BCV (Conversión BCV - Factor 75%) */}
          <div className="bg-white rounded-2xl border-2 border-amber-200 shadow-sm overflow-hidden flex flex-col justify-between">
            {/* Column Title Header */}
            <div className="bg-amber-900 text-white p-3.5 border-b border-amber-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-amber-300" />
                <span className="font-extrabold text-sm uppercase tracking-wide">Ganancia BCV</span>
              </div>
              <span className="text-[10px] font-bold bg-amber-800 text-amber-200 px-2 py-0.5 rounded-md border border-amber-600/40">
                FACTOR 75% BCV
              </span>
            </div>

            <div className="p-4 space-y-3.5 flex-1">
              {/* SUBTOTAL GENERAL $$ */}
              <div className="bg-amber-50/80 rounded-xl p-3 border border-amber-200">
                <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider block">
                  SUBTOTAL GENERAL $$
                </span>
                <span className="text-2xl font-black text-amber-950 font-mono block mt-0.5">
                  {formatCurrency(calculations.conversionBcv75, 'USD')}
                </span>
                <span className="text-[10px] font-medium text-amber-700 block mt-1">
                  Relación Tasa Oficial BCV / 75%
                </span>
              </div>

              {/* DESGLOSE PORCENTUAL (De arriba hacia abajo) */}
              <div className="space-y-2 border-t border-slate-100 pt-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">
                  Desglose Porcentual Operativo
                </span>

                {/* 10% GASTOS */}
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                  <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-600"></span>
                    10% GASTOS
                  </span>
                  <span className="font-bold font-mono text-slate-900">
                    {formatCurrency(calculations.gastosBcv, 'USD')}
                  </span>
                </div>

                {/* 5% UTILIDAD */}
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                  <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    5% UTILIDAD
                  </span>
                  <span className="font-bold font-mono text-amber-800">
                    {formatCurrency(calculations.utilidadBcv, 'USD')}
                  </span>
                </div>

                {/* 10% ADMINISTRACIÓN */}
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                  <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-700"></span>
                    10% ADMINISTRACIÓN
                  </span>
                  <span className="font-bold font-mono text-slate-900">
                    {formatCurrency(calculations.adminBcv, 'USD')}
                  </span>
                </div>
              </div>
            </div>

            {/* TOTAL GENERAL BCV */}
            <div className="bg-amber-950 text-white p-3.5 border-t border-amber-900 flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-amber-200">
                TOTAL GENERAL
              </span>
              <span className="text-lg font-black font-mono text-amber-300">
                {formatCurrency(calculations.totalGeneralBcv, 'USD')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Auxiliary Audit Footer Bar (Base Sin IVA & IVA Acumulado) */}
      <div className="border-t border-slate-200 bg-white px-5 py-3.5 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-2 text-slate-600">
          <PieChart className="w-4 h-4 text-emerald-700" />
          <span className="font-bold text-slate-800">Auditoría Fiscal Base:</span>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-semibold">Total Sin IVA:</span>
            <strong className="font-mono text-slate-900 text-sm">
              {formatCurrency(calculations.totalSinIvaSum, 'USD')}
            </strong>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-semibold">IVA Acumulado:</span>
            <strong className="font-mono text-emerald-800 text-sm">
              {formatCurrency(calculations.totalIvaSum, 'USD')}
            </strong>
          </div>
        </div>
      </div>
    </div>
  );
};

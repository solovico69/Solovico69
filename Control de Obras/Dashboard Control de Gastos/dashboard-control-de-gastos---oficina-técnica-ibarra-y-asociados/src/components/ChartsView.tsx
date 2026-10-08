import React, { useMemo } from 'react';
import { ExpenseRecord } from '../types';
import { formatCurrency } from '../utils/csvParser';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  CartesianGrid,
} from 'recharts';
import {
  PieChart as PieIcon,
  BarChart3,
  UserCheck,
  Layers,
  Building2,
  Receipt,
  TrendingUp,
  Award,
  DollarSign,
  Briefcase,
} from 'lucide-react';

interface Props {
  records: ExpenseRecord[];
}

const BRAND_COLORS = [
  '#1E3A2B', // Deep Emerald
  '#2E5A36', // Primary Corporate Green
  '#387042', // Mid Green
  '#4A7C59', // Muted Sage Green
  '#8CBF26', // Bright Lime Accent
  '#0F291E', // Very Dark Forest
  '#60992D', // Olive Accent
  '#A1D038', // Light Lime
];

// Custom Tooltip component for executive presentation
const CustomTooltip = ({ active, payload, label, suffix = '' }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/95 text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs font-sans z-50">
        <p className="font-bold text-emerald-300 border-b border-slate-800 pb-1 mb-1.5 uppercase tracking-wider text-[11px]">
          {label || payload[0].name}
        </p>
        {payload.map((entry: any, index: number) => (
          <div key={`item-${index}`} className="flex items-center justify-between gap-4 py-0.5">
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: entry.color || entry.fill }} />
              {entry.name}:
            </span>
            <span className="font-mono font-bold text-white">
              {typeof entry.value === 'number' ? formatCurrency(entry.value, 'USD') : entry.value} {suffix}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const ChartsView: React.FC<Props> = ({ records }) => {
  // --- CALCULATIONS ---

  // Overall KPIs
  const kpis = useMemo(() => {
    const totalConIva = records.reduce((acc, r) => acc + r.totalConIva, 0);
    const totalSinIva = records.reduce((acc, r) => acc + r.totalSinIva, 0);
    const totalIva = records.reduce((acc, r) => acc + r.ivaMonto, 0);
    const count = records.length;
    const avg = count > 0 ? totalConIva / count : 0;

    // Top Razon Social
    const supplierMap = new Map<string, number>();
    records.forEach((r) => {
      const name = r.razonSocial || 'Sin Especificar';
      supplierMap.set(name, (supplierMap.get(name) || 0) + r.totalConIva);
    });
    let topSupplier = 'N/A';
    let topSupplierTotal = 0;
    supplierMap.forEach((val, key) => {
      if (val > topSupplierTotal) {
        topSupplierTotal = val;
        topSupplier = key;
      }
    });

    return {
      totalConIva,
      totalSinIva,
      totalIva,
      count,
      avg,
      topSupplier,
      topSupplierTotal,
    };
  }, [records]);

  // 1. Total by Obra (Sin IVA + IVA Breakdown)
  const dataByObra = useMemo(() => {
    const map = new Map<string, { sinIva: number; iva: number; total: number }>();
    records.forEach((r) => {
      const name = r.obra || 'Sin Obra';
      const current = map.get(name) || { sinIva: 0, iva: 0, total: 0 };
      map.set(name, {
        sinIva: current.sinIva + r.totalSinIva,
        iva: current.iva + r.ivaMonto,
        total: current.total + r.totalConIva,
      });
    });
    return Array.from(map.entries()).map(([name, val]) => ({
      name,
      sinIva: Math.round(val.sinIva * 100) / 100,
      iva: Math.round(val.iva * 100) / 100,
      total: Math.round(val.total * 100) / 100,
    }));
  }, [records]);

  // 2. Total by Sector
  const dataBySector = useMemo(() => {
    const map = new Map<string, number>();
    records.forEach((r) => {
      const name = r.sector || 'General / Varios';
      map.set(name, (map.get(name) || 0) + r.totalConIva);
    });
    return Array.from(map.entries())
      .map(([name, total]) => ({
        name,
        total: Math.round(total * 100) / 100,
      }))
      .sort((a, b) => b.total - a.total);
  }, [records]);

  // 3. Top Disciplinas (Top 8)
  const dataByDisciplina = useMemo(() => {
    const map = new Map<string, number>();
    records.forEach((r) => {
      const name = r.disciplina || 'General';
      map.set(name, (map.get(name) || 0) + r.totalConIva);
    });
    return Array.from(map.entries())
      .map(([name, total]) => ({
        name,
        total: Math.round(total * 100) / 100,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);
  }, [records]);

  // 4. Auditoría de Registrador (Registrado Por)
  const dataByRegistrador = useMemo(() => {
    const map = new Map<string, { total: number; count: number }>();
    records.forEach((r) => {
      const name = r.registradoPor || 'SISTEMA';
      const current = map.get(name) || { total: 0, count: 0 };
      map.set(name, {
        total: current.total + r.totalConIva,
        count: current.count + 1,
      });
    });
    return Array.from(map.entries()).map(([name, val]) => ({
      name,
      total: Math.round(val.total * 100) / 100,
      count: val.count,
    }));
  }, [records]);

  // 5. Top Proveedores (Top 6)
  const dataBySupplier = useMemo(() => {
    const map = new Map<string, number>();
    records.forEach((r) => {
      const name = r.razonSocial || 'No Especificado';
      map.set(name, (map.get(name) || 0) + r.totalConIva);
    });
    return Array.from(map.entries())
      .map(([name, total]) => ({
        name: name.length > 25 ? name.substring(0, 22) + '...' : name,
        fullName: name,
        total: Math.round(total * 100) / 100,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 6);
  }, [records]);

  if (records.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm my-6">
        <BarChart3 className="w-12 h-12 text-slate-300 mx-auto mb-3 animate-pulse" />
        <h3 className="text-base font-bold text-slate-700">No hay registros para mostrar</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          Ajusta los filtros o limpia la búsqueda para visualizar los gráficos analíticos corporativos.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 my-6">
      {/* Executive Overview KPI Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="bg-gradient-to-br from-emerald-950 via-emerald-900 to-slate-900 rounded-2xl p-4 text-white shadow-md border border-emerald-800/40 relative overflow-hidden">
          <div className="absolute right-3 top-3 p-2 bg-emerald-800/40 rounded-xl border border-emerald-600/30">
            <DollarSign className="w-5 h-5 text-emerald-300" />
          </div>
          <p className="text-[11px] uppercase tracking-wider text-emerald-200 font-bold">Total Invertido (Con IVA)</p>
          <p className="text-2xl font-black text-white font-mono mt-1">
            {formatCurrency(kpis.totalConIva, 'USD')}
          </p>
          <div className="mt-2 text-[10px] text-emerald-300/80 flex items-center justify-between border-t border-emerald-800/60 pt-2">
            <span>Base: {formatCurrency(kpis.totalSinIva, 'USD')}</span>
            <span>IVA: {formatCurrency(kpis.totalIva, 'USD')}</span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">Registros / Documentos</p>
            <div className="p-2 bg-emerald-50 rounded-xl text-emerald-800">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 font-mono mt-1">{kpis.count}</p>
          <p className="text-[11px] text-slate-500 mt-2 border-t border-slate-100 pt-1.5">
            Promedio por Factura: <strong className="text-emerald-900">{formatCurrency(kpis.avg, 'USD')}</strong>
          </p>
        </div>

        {/* KPI 3 */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">Mayor Inversión por Obra</p>
            <div className="p-2 bg-emerald-50 rounded-xl text-emerald-800">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-sm font-bold text-slate-900 truncate mt-1">
            {dataByObra[0]?.name || 'N/A'}
          </p>
          <p className="text-[11px] text-slate-500 mt-2 border-t border-slate-100 pt-1.5">
            Monto: <strong className="text-emerald-900">{formatCurrency(dataByObra[0]?.total || 0, 'USD')}</strong>
          </p>
        </div>

        {/* KPI 4 */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">Top Proveedor / Comercio</p>
            <div className="p-2 bg-emerald-50 rounded-xl text-emerald-800">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <p className="text-sm font-bold text-slate-900 truncate mt-1" title={kpis.topSupplier}>
            {kpis.topSupplier}
          </p>
          <p className="text-[11px] text-slate-500 mt-2 border-t border-slate-100 pt-1.5">
            Total Facturado: <strong className="text-emerald-900">{formatCurrency(kpis.topSupplierTotal, 'USD')}</strong>
          </p>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CHART 1: Total Gastos por Obra (Base + IVA) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div>
              <h4 className="font-bold text-xs uppercase text-slate-900 tracking-wider flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-800" />
                Inversión por Obra (Base Imponible + IVA)
              </h4>
              <p className="text-[11px] text-slate-500">
                Desglose comparativo de costos sin IVA e impuesto retenido/agregado.
              </p>
            </div>
            <span className="text-[10px] font-bold bg-emerald-100 text-emerald-900 px-2.5 py-1 rounded-full">
              {dataByObra.length} Obras
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dataByObra} margin={{ top: 15, right: 15, left: 10, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#475569' }} interval={0} angle={-15} textAnchor="end" />
                <YAxis tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} tick={{ fontSize: 10, fill: '#475569' }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="sinIva" name="Monto Sin IVA" stackId="a" fill="#2E5A36" radius={[0, 0, 0, 0]} />
                <Bar dataKey="iva" name="IVA ($$)" stackId="a" fill="#8CBF26" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-center gap-6 pt-3 border-t border-slate-100 text-xs font-semibold text-slate-700">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-[#2E5A36] inline-block" />
              <span>Base Sin IVA</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-[#8CBF26] inline-block" />
              <span>Monto IVA</span>
            </div>
          </div>
        </div>

        {/* CHART 2: Distribución por Sector */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div>
              <h4 className="font-bold text-xs uppercase text-slate-900 tracking-wider flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-emerald-800" />
                Distribución de Gastos por Sector
              </h4>
              <p className="text-[11px] text-slate-500">
                Proporción del presupuesto ejecutado según áreas físicas de trabajo.
              </p>
            </div>
            <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full">
              {dataBySector.length} Sectores
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dataBySector}
                  dataKey="total"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={95}
                  paddingAngle={3}
                  label={({ name, percent }) => `${name.substring(0, 10)}... (${(percent * 100).toFixed(0)}%)`}
                  labelLine={false}
                >
                  {dataBySector.map((_, index) => (
                    <Cell key={`cell-sector-${index}`} fill={BRAND_COLORS[index % BRAND_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 3: Top Disciplinas (Horizontal Bar Chart) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div>
              <h4 className="font-bold text-xs uppercase text-slate-900 tracking-wider flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-emerald-800" />
                Top Disciplinas con Mayor Inversión
              </h4>
              <p className="text-[11px] text-slate-500">
                Análisis de partida técnica de gasto (Ej. Civil, Electricidad, Suministros).
              </p>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={dataByDisciplina}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} tick={{ fontSize: 10, fill: '#475569' }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#334155', fontWeight: 600 }} width={110} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="total" name="Inversión ($)" fill="#2E5A36" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 4: Auditoría por Usuario 'REGISTRADO POR' */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div>
              <h4 className="font-bold text-xs uppercase text-slate-900 tracking-wider flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald-800" />
                Cargas por Usuario (Auditoría 'REGISTRADO POR')
              </h4>
              <p className="text-[11px] text-slate-500">
                Volumen y monto total cargado por el personal de control técnico.
              </p>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dataByRegistrador} margin={{ top: 15, right: 15, left: 10, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#475569' }} interval={0} />
                <YAxis tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} tick={{ fontSize: 10, fill: '#475569' }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="total" name="Monto Registrado ($)" fill="#387042" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 5: Top Proveedores / Razones Sociales */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div>
              <h4 className="font-bold text-xs uppercase text-slate-900 tracking-wider flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-800" />
                Top 6 Proveedores con Mayor Volumen de Facturación
              </h4>
              <p className="text-[11px] text-slate-500">
                Empresas y comercios receptores de los mayores desembolsos en las obras seleccionadas.
              </p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dataBySupplier} margin={{ top: 10, right: 20, left: 10, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#334155', fontWeight: 600 }} interval={0} angle={-10} textAnchor="end" />
                <YAxis tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} tick={{ fontSize: 10, fill: '#475569' }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="total" name="Monto Facturado ($)" fill="#1E3A2B" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

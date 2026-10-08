import Papa from 'papaparse';
import { ExpenseRecord, FinancialResumenCalculations } from '../types';

/**
 * Transforms Google Drive view URLs to direct downloadable / renderable image URLs
 */
export function formatDriveImageUrl(url: string): string {
  if (!url) return '';
  const trimmed = url.trim().replace(/^["']|["']$/g, '');
  if (!trimmed) return '';

  // Match /file/d/FILE_ID/ or id=FILE_ID
  const match = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || trimmed.match(/id=([a-zA-Z0-9_-]+)/);
  if (match && match[1]) {
    const fileId = match[1];
    return `https://lh3.googleusercontent.com/d/${fileId}`;
  }
  return trimmed;
}

export function parseRawPhotoUrls(photosStr: string): string[] {
  if (!photosStr) return [];
  // Split by comma or space if multiple URLs
  const clean = photosStr.replace(/^["']|["']$/g, '');
  const parts = clean.split(/,|\n/).map(s => s.trim()).filter(Boolean);
  return parts.map(formatDriveImageUrl);
}

export function parseCsvToExpenses(csvText: string): ExpenseRecord[] {
  const parsed = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
  });

  return parsed.data.map((row, index) => {
    // Extract photo URLs
    const rawFotos = row['FOTOS'] || row['fotos'] || '';
    const photos = parseRawPhotoUrls(rawFotos);

    const parseNum = (val: string | undefined): number => {
      if (!val) return 0;
      const clean = String(val).replace(/,/g, '.').replace(/[^0-9.-]/g, '');
      const n = parseFloat(clean);
      return isNaN(n) ? 0 : n;
    };

    const parseNumNullable = (val: string | undefined): number | null => {
      if (!val || val.trim() === '') return null;
      const clean = String(val).replace(/,/g, '.').replace(/[^0-9.-]/g, '');
      const n = parseFloat(clean);
      return isNaN(n) ? null : n;
    };

    const totalConIva = parseNum(row['TOTAL $ CON IVA']);
    const totalSinIva = parseNum(row['TOTAL $ SIN IVA']);
    const ivaMonto = parseNum(row['IVA $$']);

    const rawFechaFactura = (row['FECHA FACTURA'] || row['FECHA_FACTURA'] || row['FECHA'] || row['fechaFactura'] || row['fecha'] || '').trim();
    const rawFechaCorte = (row['FECHA CORTE'] || row['FECHA_CORTE'] || row['fechaCorte'] || '').trim();

    return {
      id: `exp-${index + 1}-${row['# ORDEN'] || 'GTO'}`,
      obra: (row['OBRA'] || 'SIN OBRA').trim(),
      sector: (row['SECTOR'] || 'GENERAL').trim(),
      agrupacion: (row['AGRUPACIÓN'] || row['AGRUPACION'] || 'MATERIAL').trim(),
      fechaFactura: rawFechaFactura,
      disciplina: (row['DISCIPLINA'] || 'VARIOS').trim(),
      numFactura: (row['N° FACTURA'] || row['N FACTURA'] || '').trim(),
      razonSocial: (row['RAZÓN SOCIAL'] || row['RAZON SOCIAL'] || 'N/A').trim(),
      descripcion: (row['DESCRIPCIÓN'] || row['DESCRIPCION'] || 'Gasto no detallado').trim(),
      conversion: String(row['Conversion?'] || row['CONVERSION']).toUpperCase() === 'TRUE',
      binance: (row['BINANCE'] || '').trim(),
      bcv: parseNumNullable(row['BCV']),
      metrica: (row['METRICA'] || 'unidad').trim(),
      cantidad: parseNum(row['CANTIDAD']) || 1,
      preciosUnitariosBs: parseNumNullable(row['PRECIOS UNITARIOS (BS)']),
      preciosUnitariosUsd: parseNumNullable(row['PRECIOS UNITARIOS ($)']),
      ivaSiNo: String(row['IVA si o no'] || '').toUpperCase() === 'TRUE',
      registradoPor: (row['REGISTRADO POR'] || 'SISTEMA').trim(),
      fotos: photos,
      totalSinIva,
      ivaMonto,
      totalConIva,
      numOrden: (row['# ORDEN'] || row['ORDEN'] || 'GTO-0000000').trim(),
      fechaCorte: rawFechaCorte,
      mes: (row['MES'] || '').trim(),
      ano: (row['ANO'] || row['AÑO'] || '').trim(),
    };
  });
}

/**
 * Replicates financial calculations from 'RESUMEN' tab:
 * BD (Costo Base) = Sum of TOTAL $ CON IVA
 * Subtotal General BD = BD
 * Subtotal General Ganancia = BD * 2
 * Subtotal General Ganancia BCV = (BD * 2) / 0.75
 * Percentages breakdown for each: 10% Gastos, 5% Utilidad, 10% Admin
 * Total General = Subtotal + Gastos + Utilidad + Admin (125%)
 */
export function calculateFinancialResumen(records: ExpenseRecord[]): FinancialResumenCalculations {
  const costoBaseBd = records.reduce((sum, r) => sum + (r.totalConIva || 0), 0);
  const totalSinIvaSum = records.reduce((sum, r) => sum + (r.totalSinIva || 0), 0);
  const totalIvaSum = records.reduce((sum, r) => sum + (r.ivaMonto || 0), 0);

  // 1. Column BD $$
  const subtotalBd = costoBaseBd;
  const gastosGenerales10 = subtotalBd * 0.10;
  const utilidad5 = subtotalBd * 0.05;
  const administracion10 = subtotalBd * 0.10;
  const totalGeneralBd = subtotalBd * 1.25;

  // 2. Column Ganancia $$ (Factor X2 BD)
  const factorGananciaX2 = subtotalBd * 2;
  const gastosGanancia = factorGananciaX2 * 0.10;
  const utilidadGanancia = factorGananciaX2 * 0.05;
  const adminGanancia = factorGananciaX2 * 0.10;
  const totalGeneralGanancia = factorGananciaX2 * 1.25;

  // 3. Column Ganancia BCV (Factor 75% -> / 0.75)
  const conversionBcv75 = factorGananciaX2 / 0.75;
  const gastosBcv = conversionBcv75 * 0.10;
  const utilidadBcv = conversionBcv75 * 0.05;
  const adminBcv = conversionBcv75 * 0.10;
  const totalGeneralBcv = conversionBcv75 * 1.25;

  // Legacy field
  const subtotalCostosGastos = subtotalBd + gastosGenerales10 + administracion10;

  return {
    costoBaseBd,
    gastosGenerales10,
    utilidad5,
    administracion10,
    totalGeneralBd,

    factorGananciaX2,
    gastosGanancia,
    utilidadGanancia,
    adminGanancia,
    totalGeneralGanancia,

    conversionBcv75,
    gastosBcv,
    utilidadBcv,
    adminBcv,
    totalGeneralBcv,

    subtotalCostosGastos,
    totalSinIvaSum,
    totalIvaSum,
    totalRegistrosCount: records.length,
  };
}

export function formatCurrency(amount: number | null | undefined, currency: 'USD' | 'VES' = 'USD'): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return currency === 'USD' ? '$ 0.00' : 'Bs. 0,00';
  }

  if (currency === 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount).replace('USD', '$');
  } else {
    return 'Bs. ' + new Intl.NumberFormat('es-VE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }
}

/**
 * Formats raw date string (ISO, Excel serial, DD/MM/YYYY, etc.) cleanly into DD/MM/YYYY
 */
export function formatDisplayDate(rawDateStr: string | undefined | null): string {
  if (!rawDateStr) return '-';
  const str = String(rawDateStr).trim();
  if (!str || str === 'null' || str === 'undefined' || str === 'N/A' || str === '-') return '-';

  // 1. Check if ISO string with timestamp: e.g. "2026-07-17T04:00:00.000Z" or "2026-07-17"
  const isoMatch = str.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (isoMatch) {
    const year = isoMatch[1];
    const month = isoMatch[2].padStart(2, '0');
    const day = isoMatch[3].padStart(2, '0');
    return `${day}/${month}/${year}`;
  }

  // 2. Check Day/Month/Year or Month/Day/Year e.g. "17/7/2026", "17-07-2026", "06/08/2026"
  const dmyMatch = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})/);
  if (dmyMatch) {
    let p1 = parseInt(dmyMatch[1], 10);
    let p2 = parseInt(dmyMatch[2], 10);
    let yr = dmyMatch[3];
    if (yr.length === 2) yr = '20' + yr;

    let day = p1;
    let month = p2;
    if (p2 > 12) {
      day = p2;
      month = p1;
    }
    const dayStr = String(day).padStart(2, '0');
    const monthStr = String(month).padStart(2, '0');
    return `${dayStr}/${monthStr}/${yr}`;
  }

  // 3. Excel serial date (e.g. 45392)
  if (!isNaN(Number(str))) {
    const num = Number(str);
    if (num > 30000 && num < 70000) {
      const d = new Date((num - 25569) * 86400 * 1000);
      const dayStr = String(d.getUTCDate()).padStart(2, '0');
      const monthStr = String(d.getUTCMonth() + 1).padStart(2, '0');
      const yearStr = d.getUTCFullYear();
      return `${dayStr}/${monthStr}/${yearStr}`;
    }
  }

  // 4. Try JS Date parsing
  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    const dayStr = String(d.getUTCDate()).padStart(2, '0');
    const monthStr = String(d.getUTCMonth() + 1).padStart(2, '0');
    const yearStr = d.getUTCFullYear();
    return `${dayStr}/${monthStr}/${yearStr}`;
  }

  return str;
}

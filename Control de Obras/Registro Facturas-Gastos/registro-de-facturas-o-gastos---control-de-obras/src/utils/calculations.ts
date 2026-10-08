import { LineItem } from '../types';

const MONTH_NAMES_ES: Record<number, string> = {
  0: 'enero',
  1: 'febrero',
  2: 'marzo',
  3: 'abril',
  4: 'mayo',
  5: 'junio',
  6: 'julio',
  7: 'agosto',
  8: 'septiembre',
  9: 'octubre',
  10: 'noviembre',
  11: 'diciembre',
};

/**
 * Calculates Unit Price in USD for a line item
 */
export function calculateEffectiveUnitPriceUsd(
  cantidad: number,
  precioBs?: number,
  precioUsd?: number,
  conversion?: boolean,
  binance?: number,
  bcv?: number
): number {
  let baseUsd = 0;

  if (conversion) {
    if (precioUsd !== undefined && precioUsd > 0) {
      baseUsd = precioUsd;
    } else if (precioBs !== undefined && precioBs > 0 && bcv !== undefined && bcv > 0) {
      baseUsd = precioBs / bcv;
    }

    if (binance !== undefined && binance > 0) {
      baseUsd = baseUsd * binance;
    }
  } else {
    if (precioUsd !== undefined && precioUsd > 0) {
      baseUsd = precioUsd;
    } else if (precioBs !== undefined && precioBs > 0 && bcv !== undefined && bcv > 0) {
      baseUsd = precioBs / bcv;
    }
  }

  return baseUsd;
}

/**
 * Calculates item row totals (P, R, S)
 */
export function calculateLineTotals(
  cantidad: number,
  precioBs: number | undefined,
  precioUsd: number | undefined,
  conversion: boolean,
  binance: number | undefined,
  bcv: number | undefined,
  ivaSiNo: boolean = true
): { totalSinIva: number; ivaUsd: number; totalConIva: number } {
  const qty = Math.max(0, cantidad || 0);
  const effectiveUsd = calculateEffectiveUnitPriceUsd(
    qty,
    precioBs,
    precioUsd,
    conversion,
    binance,
    bcv
  );

  const totalSinIva = Number((qty * effectiveUsd).toFixed(2));
  const ivaUsd = ivaSiNo ? Number((totalSinIva * 0.16).toFixed(2)) : 0;
  const totalConIva = Number((totalSinIva + ivaUsd).toFixed(2));

  return { totalSinIva, ivaUsd, totalConIva };
}

/**
 * Calculate grand totals for a list of line items, summing each item's specific IVA
 */
export function calculateGrandTotals(
  items: LineItem[],
  conversion: boolean,
  binance: number | undefined,
  bcv: number | undefined
): { totalSinIva: number; ivaUsd: number; totalConIva: number } {
  let sumSinIva = 0;
  let sumIva = 0;
  let sumConIva = 0;

  for (const item of items) {
    const isIva = item.ivaSiNo !== undefined ? item.ivaSiNo : true;
    const totals = calculateLineTotals(
      item.cantidad,
      item.precioBs,
      item.precioUsd,
      conversion,
      binance,
      bcv,
      isIva
    );
    sumSinIva += totals.totalSinIva;
    sumIva += totals.ivaUsd;
    sumConIva += totals.totalConIva;
  }

  return {
    totalSinIva: Number(sumSinIva.toFixed(2)),
    ivaUsd: Number(sumIva.toFixed(2)),
    totalConIva: Number(sumConIva.toFixed(2)),
  };
}

/**
 * Helper to extract mes name and year from date string (YYYY-MM-DD or DD/MM/YYYY)
 */
export function extractDateMeta(dateStr: string): { mes: string; ano: number; fechaCorte: string } {
  const now = new Date();
  const defaultCorte = `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`;

  if (!dateStr) {
    return {
      mes: MONTH_NAMES_ES[now.getMonth()],
      ano: now.getFullYear(),
      fechaCorte: defaultCorte,
    };
  }

  let dateObj: Date | null = null;
  if (dateStr.includes('-')) {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      dateObj = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    }
  } else if (dateStr.includes('/')) {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      dateObj = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    }
  }

  if (!dateObj || isNaN(dateObj.getTime())) {
    dateObj = now;
  }

  return {
    mes: MONTH_NAMES_ES[dateObj.getMonth()],
    ano: dateObj.getFullYear(),
    fechaCorte: defaultCorte,
  };
}

export function formatCurrencyUsd(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatCurrencyBs(amount: number): string {
  return new Intl.NumberFormat('es-VE', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount) + ' Bs';
}

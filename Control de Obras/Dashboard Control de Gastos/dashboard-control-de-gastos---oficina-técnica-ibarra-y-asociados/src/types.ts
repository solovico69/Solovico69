export interface ExpenseRecord {
  id: string;
  obra: string;
  sector: string;
  agrupacion: string;
  fechaFactura: string;
  disciplina: string;
  numFactura: string;
  razonSocial: string;
  descripcion: string;
  conversion: boolean;
  binance: string;
  bcv: number | null;
  metrica: string;
  cantidad: number;
  preciosUnitariosBs: number | null;
  preciosUnitariosUsd: number | null;
  ivaSiNo: boolean;
  registradoPor: string;
  fotos: string[];
  totalSinIva: number;
  ivaMonto: number;
  totalConIva: number;
  numOrden: string;
  fechaCorte: string;
  mes: string;
  ano: string;
}

export interface FinancialResumenCalculations {
  // Column 1: BD $$
  costoBaseBd: number;          // Subtotal General BD $$ (TOTAL $ CON IVA)
  gastosGenerales10: number;    // 10% Gastos BD
  utilidad5: number;            // 5% Utilidad BD
  administracion10: number;     // 10% Administración BD
  totalGeneralBd: number;       // TOTAL GENERAL BD (125%)

  // Column 2: Ganancia $$ (Factor X2 BD)
  factorGananciaX2: number;     // Subtotal General Ganancia $$ (BD * 2)
  gastosGanancia: number;       // 10% Gastos Ganancia
  utilidadGanancia: number;     // 5% Utilidad Ganancia
  adminGanancia: number;        // 10% Administración Ganancia
  totalGeneralGanancia: number; // TOTAL GENERAL Ganancia (125%)

  // Column 3: Ganancia BCV (Factor 75% -> / 0.75)
  conversionBcv75: number;      // Subtotal General Ganancia BCV ( (BD * 2) / 0.75 )
  gastosBcv: number;            // 10% Gastos BCV
  utilidadBcv: number;          // 5% Utilidad BCV
  adminBcv: number;             // 10% Administración BCV
  totalGeneralBcv: number;      // TOTAL GENERAL BCV (125%)

  // Legacy & Audit fields
  subtotalCostosGastos: number; // BD + Gastos + Admin
  totalSinIvaSum: number;
  totalIvaSum: number;
  totalRegistrosCount: number;
}

export interface FilterState {
  obra: string;
  sector: string;
  disciplina: string;
  registradoPor: string;
  searchQuery: string;
  mes: string;
  ano: string;
  agrupacion: string;
}

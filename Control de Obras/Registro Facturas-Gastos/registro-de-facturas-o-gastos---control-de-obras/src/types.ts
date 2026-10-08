/**
 * Data structures for Control de Gastos - Oficina Técnica Ibarra y Asociados, C.A.
 */

export interface LineItem {
  id: string;
  disciplina?: string; // Disciplina por cada descripción / línea
  descripcion: string;
  metrica: string;
  cantidad: number;
  precioBs?: number;
  precioUsd?: number;
  ivaSiNo?: boolean; // Toggle per item (16% IVA vs Exento 0%)
  // Calculated fields per line
  totalSinIva: number;
  ivaUsd: number;
  totalConIva: number;
}

export interface AttachedPhoto {
  id: string;
  name: string;
  base64: string;
  mimeType: string;
  driveUrl?: string;
  driveFileId?: string;
}

export interface GastoRecord {
  id: string;
  obra: string;           // Col A (Mandatory)
  sector: string;         // Col B (Mandatory)
  agrupacion: string;     // Col C (Mandatory)
  fechaFactura: string;   // Col D (YYYY-MM-DD)
  disciplina: string;     // Col E
  nFactura: string;       // Col F
  razonSocial: string;    // Col G
  descripcion: string;    // Col H
  conversion: boolean;    // Col I (Checkbox)
  binance?: number;       // Col J
  bcv?: number;           // Col K
  metrica: string;        // Col L
  cantidad: number;       // Col M
  preciosUnitariosBs?: number; // Col N
  preciosUnitariosUsd?: number;// Col O
  totalSinIva: number;    // Col P (Formula)
  ivaSiNo: boolean;       // Col Q (Checkbox)
  ivaUsd: number;         // Col R (Formula)
  totalConIva: number;    // Col S (Formula)
  registradoPor: string;  // Col T (Mandatory)
  fechaCorte?: string;    // Col U
  mes?: string;           // Col V
  ano?: number | string;  // Col W
  nOrden?: string;        // Col X (# ORDEN)
  tieneFotos?: boolean;   // Col Y (FOTOS - Checkbox TRUE/FALSE)
  fotosUrl?: string;
  fotos?: AttachedPhoto[];
  createdAt: string;
}

export interface FormBlock1Data {
  obra: string;
  sector: string;
  agrupacion: string;
  fechaFactura: string;
  disciplina: string;
  nFactura: string;
  razonSocial: string;
  registradoPor: string;
  nOrden?: string;
  tieneFotos?: boolean;
  fotos?: AttachedPhoto[];
}

export interface FormBlock3Data {
  conversion: boolean;
  binance?: number;
  bcv?: number;
}

export interface FormBlock4Data {
  ivaSiNo: boolean;
}

export interface BdOptions {
  obras: string[];
  sectores: string[];
  agrupaciones: string[];
  disciplinas: string[];
  razonesSociales: string[];
  metricas: string[];
  registradores: string[];
}

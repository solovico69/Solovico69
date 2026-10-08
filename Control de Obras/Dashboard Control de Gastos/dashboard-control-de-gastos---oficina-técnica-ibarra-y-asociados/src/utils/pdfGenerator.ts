import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ExpenseRecord, FinancialResumenCalculations, FilterState } from '../types';
import { formatCurrency } from './csvParser';

export function generateCorporatePdfReport(
  records: ExpenseRecord[],
  calculations: FinancialResumenCalculations,
  filters: FilterState
) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Header Background Banner
  doc.setFillColor(30, 70, 42); // Institutional Forest Green (#1E462A)
  doc.rect(0, 0, pageWidth, 24, 'F');

  // Header Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('OFICINA TÉCNICA IBARRA Y ASOCIADOS, C.A.', 14, 11);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('RIF: J-40230045-0 | INFORME DE CONTROL DE GASTOS EN OBRAS', 14, 18);

  // Date and Metadata on Right Header
  const todayStr = new Date().toLocaleDateString('es-VE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  doc.setFontSize(8);
  doc.text(`Fecha de Emisión: ${todayStr}`, pageWidth - 14, 11, { align: 'right' });
  doc.text('ESTADO: SOLO LECTURA (SINCRO EN TIEMPO REAL)', pageWidth - 14, 18, { align: 'right' });

  // Filter Summary Sub-header Box
  let currentY = 28;
  doc.setFillColor(245, 247, 245);
  doc.setDrawColor(200, 215, 200);
  doc.roundedRect(14, currentY, pageWidth - 28, 16, 2, 2, 'FD');

  doc.setTextColor(40, 50, 40);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text('PARÁMETROS DE FILTRADO APLICADOS:', 18, currentY + 5);

  doc.setFont('helvetica', 'normal');
  const filterText = [
    `Obra: ${filters.obra || 'TODAS'}`,
    `Sector: ${filters.sector || 'TODOS'}`,
    `Disciplina: ${filters.disciplina || 'TODAS'}`,
    `Registrado Por: ${filters.registradoPor || 'TODOS'}`,
    filters.mes ? `Mes: ${filters.mes}` : '',
  ]
    .filter(Boolean)
    .join('  |  ');

  doc.text(filterText, 18, currentY + 11);

  currentY += 20;

  // Financial Summary replica table (RESUMEN ADMINISTRATIVO DE OBRA)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 70, 42);
  doc.text('1. RESUMEN ADMINISTRATIVO DE OBRA', 14, currentY);

  currentY += 4;

  const summaryRows = [
    [
      'Subtotal BD $$ (Costo Base)',
      formatCurrency(calculations.costoBaseBd, 'USD'),
      'Subtotal Ganancia $$ (Factor X2)',
      formatCurrency(calculations.factorGananciaX2, 'USD'),
      'Subtotal Ganancia BCV (75%)',
      formatCurrency(calculations.conversionBcv75, 'USD'),
    ],
    [
      '10% Gastos BD',
      formatCurrency(calculations.gastosGenerales10, 'USD'),
      '10% Gastos Ganancia',
      formatCurrency(calculations.gastosGanancia, 'USD'),
      '10% Gastos BCV',
      formatCurrency(calculations.gastosBcv, 'USD'),
    ],
    [
      '5% Utilidad BD',
      formatCurrency(calculations.utilidad5, 'USD'),
      '5% Utilidad Ganancia',
      formatCurrency(calculations.utilidadGanancia, 'USD'),
      '5% Utilidad BCV',
      formatCurrency(calculations.utilidadBcv, 'USD'),
    ],
    [
      '10% Admin BD',
      formatCurrency(calculations.administracion10, 'USD'),
      '10% Admin Ganancia',
      formatCurrency(calculations.adminGanancia, 'USD'),
      '10% Admin BCV',
      formatCurrency(calculations.adminBcv, 'USD'),
    ],
    [
      'TOTAL GENERAL BD',
      formatCurrency(calculations.totalGeneralBd, 'USD'),
      'TOTAL GENERAL GANANCIA',
      formatCurrency(calculations.totalGeneralGanancia, 'USD'),
      'TOTAL GENERAL BCV',
      formatCurrency(calculations.totalGeneralBcv, 'USD'),
    ],
  ];

  autoTable(doc, {
    startY: currentY,
    head: [['Factor BD $$', 'Monto BD', 'Factor Ganancia $$', 'Monto Ganancia', 'Factor BCV', 'Monto BCV']],
    body: summaryRows,
    theme: 'grid',
    styles: { fontSize: 7.5, cellPadding: 2 },
    headStyles: { fillColor: [30, 70, 42], textColor: 255, fontStyle: 'bold' },
    margin: { left: 14, right: 14 },
  });

  // @ts-expect-error autoTable lastAutoTable exists at runtime
  currentY = doc.lastAutoTable.finalY + 8;

  // Expense Records Itemized Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 70, 42);
  doc.text(`2. DETALLE CONTROL DE GASTOS EN OBRAS (${records.length} REGISTROS)`, 14, currentY);

  currentY += 3;

  const tableData = records.map((r) => [
    r.numOrden || '-',
    r.fechaFactura || r.fechaCorte || '-',
    r.obra,
    r.sector,
    r.disciplina,
    r.razonSocial.length > 25 ? r.razonSocial.substring(0, 23) + '...' : r.razonSocial,
    r.descripcion.length > 35 ? r.descripcion.substring(0, 33) + '...' : r.descripcion,
    `${r.cantidad} ${r.metrica}`,
    r.preciosUnitariosBs ? formatCurrency(r.preciosUnitariosBs, 'VES') : '-',
    r.preciosUnitariosUsd ? formatCurrency(r.preciosUnitariosUsd, 'USD') : '-',
    formatCurrency(r.totalSinIva, 'USD'),
    formatCurrency(r.ivaMonto, 'USD'),
    formatCurrency(r.totalConIva, 'USD'),
    r.registradoPor,
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [
      [
        '# Orden',
        'Fecha',
        'Obra',
        'Sector',
        'Disciplina',
        'Proveedor / Razón Social',
        'Descripción',
        'Cant.',
        'P.U. (Bs)',
        'P.U. ($)',
        'Sin IVA ($)',
        'IVA ($)',
        'Total ($)',
        'Registrado Por',
      ],
    ],
    body: tableData,
    theme: 'striped',
    styles: { fontSize: 6.5, cellPadding: 1.5, overflow: 'linebreak' },
    headStyles: { fillColor: [30, 70, 42], textColor: 255, fontStyle: 'bold', halign: 'center' },
    columnStyles: {
      0: { cellWidth: 16, fontStyle: 'bold' },
      1: { cellWidth: 14 },
      2: { cellWidth: 20 },
      3: { cellWidth: 16 },
      4: { cellWidth: 22 },
      5: { cellWidth: 25 },
      6: { cellWidth: 35 },
      7: { cellWidth: 12 },
      8: { cellWidth: 16, halign: 'right' },
      9: { cellWidth: 14, halign: 'right' },
      10: { cellWidth: 16, halign: 'right' },
      11: { cellWidth: 14, halign: 'right' },
      12: { cellWidth: 18, halign: 'right', fontStyle: 'bold' },
      13: { cellWidth: 18 },
    },
    margin: { left: 14, right: 14 },
    didDrawPage: (data) => {
      // Footer page numbering
      const str = `Página ${data.pageNumber}`;
      doc.setFontSize(8);
      doc.setTextColor(120);
      doc.text(
        str,
        pageWidth - 14,
        pageHeight - 8,
        { align: 'right' }
      );
      doc.text(
        'OFICINA TÉCNICA IBARRA Y ASOCIADOS, C.A. - Documento Oficial de Control Administrativo',
        14,
        pageHeight - 8
      );
    },
  });

  // Save PDF file
  const fileName = `Reporte_Control_Gastos_OTIA_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(fileName);
}

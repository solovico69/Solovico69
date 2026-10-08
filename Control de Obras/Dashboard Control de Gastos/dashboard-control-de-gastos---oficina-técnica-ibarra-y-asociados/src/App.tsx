import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { RAW_CSV_DATA } from './data/rawCsvData';
import { ExpenseRecord, FilterState } from './types';
import { parseCsvToExpenses, calculateFinancialResumen } from './utils/csvParser';
import { generateCorporatePdfReport } from './utils/pdfGenerator';
import { Header } from './components/Header';
import { FinancialSummaryCard } from './components/FinancialSummaryCard';
import { FilterPanel } from './components/FilterPanel';
import { ExpenseTable } from './components/ExpenseTable';
import { ChartsView } from './components/ChartsView';
import { ExpenseDetailModal } from './components/ExpenseDetailModal';
import { PhotoLightboxModal } from './components/PhotoLightboxModal';
import { GoogleAppsScriptModal } from './components/GoogleAppsScriptModal';
import { ShieldCheck, RefreshCw, FileSpreadsheet } from 'lucide-react';

export default function App() {
  // VOLATILE IN-MEMORY DATA ENGINE - WITH PERSISTENT GOOGLE APPS SCRIPT URL
  const [allRecords, setAllRecords] = useState<ExpenseRecord[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [sheetUrl, setSheetUrl] = useState<string>(() => {
    return localStorage.getItem('otia_gas_sheet_url') || '';
  });
  const [activeTab, setActiveTab] = useState<'table' | 'charts'>('table');

  // Filter State
  const [filters, setFilters] = useState<FilterState>({
    obra: '',
    sector: '',
    disciplina: '',
    registradoPor: '',
    searchQuery: '',
    mes: '',
    ano: '',
    agrupacion: '',
  });

  // Modal States
  const [selectedRecord, setSelectedRecord] = useState<ExpenseRecord | null>(null);
  const [lightboxPhotos, setLightboxPhotos] = useState<string[] | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);

  // Initial Load from raw volatile CSV stream or saved Google Apps Script URL
  const loadInitialVolatileData = useCallback(() => {
    setIsSyncing(true);
    try {
      const records = parseCsvToExpenses(RAW_CSV_DATA);
      setAllRecords(records);
    } catch (err) {
      console.error('Error parsing volatile sheet stream:', err);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // Fetch live from custom Apps Script endpoint or Google Sheet URL if set
  const handleFetchFromLiveSheet = useCallback(async (urlToFetch?: string) => {
    const targetUrl = urlToFetch !== undefined ? urlToFetch : sheetUrl;

    if (!targetUrl || targetUrl.trim() === '') {
      loadInitialVolatileData();
      return;
    }

    setIsSyncing(true);
    try {
      const resp = await fetch(targetUrl);
      if (!resp.ok) throw new Error(`HTTP Error ${resp.status}`);
      const textOrJson = await resp.text();

      // Check if response is JSON or CSV
      try {
        const json = JSON.parse(textOrJson);
        if (json.expenses && Array.isArray(json.expenses)) {
          // Re-map JSON array
          const parsed = json.expenses.map((row: any, idx: number) => ({
            id: `exp-${idx + 1}`,
            obra: String(row['OBRA'] || '').trim(),
            sector: String(row['SECTOR'] || '').trim(),
            agrupacion: String(row['AGRUPACIÓN'] || row['AGRUPACION'] || '').trim(),
            fechaFactura: String(row['FECHA FACTURA'] || '').trim(),
            disciplina: String(row['DISCIPLINA'] || '').trim(),
            numFactura: String(row['N° FACTURA'] || row['N FACTURA'] || '').trim(),
            razonSocial: String(row['RAZÓN SOCIAL'] || row['RAZON SOCIAL'] || '').trim(),
            descripcion: String(row['DESCRIPCIÓN'] || row['DESCRIPCION'] || '').trim(),
            conversion: String(row['Conversion?'] || '').toUpperCase() === 'TRUE',
            binance: String(row['BINANCE'] || '').trim(),
            bcv: parseFloat(row['BCV']) || null,
            metrica: String(row['METRICA'] || 'unidad').trim(),
            cantidad: parseFloat(row['CANTIDAD']) || 1,
            preciosUnitariosBs: parseFloat(row['PRECIOS UNITARIOS (BS)']) || null,
            preciosUnitariosUsd: parseFloat(row['PRECIOS UNITARIOS ($)']) || null,
            ivaSiNo: String(row['IVA si o no'] || '').toUpperCase() === 'TRUE',
            registradoPor: String(row['REGISTRADO POR'] || 'SISTEMA').trim(),
            fotos: row['FOTOS'] ? String(row['FOTOS']).split(',').map((s) => s.trim()) : [],
            totalSinIva: parseFloat(row['TOTAL $ SIN IVA']) || 0,
            ivaMonto: parseFloat(row['IVA $$']) || 0,
            totalConIva: parseFloat(row['TOTAL $ CON IVA']) || 0,
            numOrden: String(row['# ORDEN'] || '').trim(),
            fechaCorte: String(row['FECHA CORTE'] || '').trim(),
            mes: String(row['MES'] || '').trim(),
            ano: String(row['ANO'] || row['AÑO'] || '').trim(),
          }));
          setAllRecords(parsed);
        } else {
          // Fallback to CSV parse
          const parsed = parseCsvToExpenses(textOrJson);
          setAllRecords(parsed);
        }
      } catch {
        const parsed = parseCsvToExpenses(textOrJson);
        setAllRecords(parsed);
      }
    } catch (err) {
      console.error('Fetch live failed, falling back to volatile dataset:', err);
      loadInitialVolatileData();
    } finally {
      setIsSyncing(false);
    }
  }, [sheetUrl, loadInitialVolatileData]);

  // Initial mount effect: check for saved URL
  useEffect(() => {
    const savedUrl = localStorage.getItem('otia_gas_sheet_url');
    if (savedUrl && savedUrl.trim()) {
      handleFetchFromLiveSheet(savedUrl);
    } else {
      loadInitialVolatileData();
    }
  }, [handleFetchFromLiveSheet, loadInitialVolatileData]);

  const handleUpdateSheetUrl = (newUrl: string) => {
    const trimmed = newUrl.trim();
    setSheetUrl(trimmed);
    if (trimmed) {
      localStorage.setItem('otia_gas_sheet_url', trimmed);
    } else {
      localStorage.removeItem('otia_gas_sheet_url');
    }
    handleFetchFromLiveSheet(trimmed);
  };

  // Filter records dynamically
  const filteredRecords = useMemo(() => {
    return allRecords.filter((r) => {
      // 1. Obra filter
      if (filters.obra && r.obra !== filters.obra) return false;

      // 2. Sector filter
      if (filters.sector && r.sector !== filters.sector) return false;

      // 3. Disciplina filter
      if (filters.disciplina && r.disciplina !== filters.disciplina) return false;

      // 4. Registrado Por filter
      if (filters.registradoPor && r.registradoPor !== filters.registradoPor) return false;

      // 5. Agrupacion filter
      if (filters.agrupacion && r.agrupacion !== filters.agrupacion) return false;

      // 6. Mes filter
      if (filters.mes && r.mes.toLowerCase() !== filters.mes.toLowerCase()) return false;

      // 7. Search query filter
      if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase();
        const matchDesc = r.descripcion.toLowerCase().includes(q);
        const matchFactura = r.numFactura.toLowerCase().includes(q);
        const matchRazon = r.razonSocial.toLowerCase().includes(q);
        const matchOrden = r.numOrden.toLowerCase().includes(q);
        const matchObra = r.obra.toLowerCase().includes(q);
        const matchUser = r.registradoPor.toLowerCase().includes(q);

        if (!matchDesc && !matchFactura && !matchRazon && !matchOrden && !matchObra && !matchUser) {
          return false;
        }
      }

      return true;
    });
  }, [allRecords, filters]);

  // Calculate RESUMEN tab metrics for current filtered subset
  const financialCalculations = useMemo(() => {
    return calculateFinancialResumen(filteredRecords);
  }, [filteredRecords]);

  // Reset Filters
  const handleResetFilters = () => {
    setFilters({
      obra: '',
      sector: '',
      disciplina: '',
      registradoPor: '',
      searchQuery: '',
      mes: '',
      ano: '',
      agrupacion: '',
    });
  };

  // Export PDF Report
  const handleExportPdf = () => {
    generateCorporatePdfReport(filteredRecords, financialCalculations, filters);
  };

  const handleOpenPhotoLightbox = (photos: string[], initialIdx: number = 0) => {
    setLightboxPhotos(photos);
    setLightboxIndex(initialIdx);
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900 flex flex-col antialiased selection:bg-emerald-800 selection:text-white">
      {/* Header Bar */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onExportPdf={handleExportPdf}
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
        onRefreshData={() => handleFetchFromLiveSheet()}
        isSyncing={isSyncing}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Banner Informactivo de Sincronización en Tiempo Real */}
        <div className="bg-emerald-900 text-white rounded-xl p-4 mb-6 shadow-sm flex flex-wrap items-center justify-between gap-3 border border-emerald-700/60">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-800/80 rounded-lg">
              <FileSpreadsheet className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h2 className="font-bold text-sm tracking-wide">
                Control de Gastos en Obras - Espejo Volátil 'CONTROL_GASTOS' & 'RESUMEN'
              </h2>
              <p className="text-xs text-emerald-200">
                Lógica financiera sincronizada en tiempo real. La URL de conexión se guarda de forma permanente en su navegador.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold bg-emerald-950 px-3 py-1 rounded-full border border-emerald-600/40 text-emerald-300 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Solo Lectura Activo
            </span>
          </div>
        </div>

        {/* 1. Financial Summary Replica (Pestaña RESUMEN) */}
        <FinancialSummaryCard
          calculations={financialCalculations}
          filteredCount={filteredRecords.length}
          totalCount={allRecords.length}
        />

        {/* 2. Hierarchical & Audit Filter Panel */}
        <FilterPanel
          allRecords={allRecords}
          filters={filters}
          onFilterChange={setFilters}
          onResetFilters={handleResetFilters}
          onRefreshData={() => handleFetchFromLiveSheet()}
          isSyncing={isSyncing}
        />

        {/* 3. Tab Content: Table or Visual Charts */}
        {activeTab === 'table' ? (
          <ExpenseTable
            records={filteredRecords}
            onSelectRecord={setSelectedRecord}
            onOpenPhotoLightbox={handleOpenPhotoLightbox}
          />
        ) : (
          <ChartsView records={filteredRecords} />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 text-xs py-6 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-bold text-slate-200">
              OFICINA TÉCNICA IBARRA Y ASOCIADOS, C.A. — RIF: J-40230045-0
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Sistema de Auditoría y Control de Gastos en Obras. Todos los derechos reservados.
            </p>
          </div>
          <div className="text-right text-[11px] text-slate-400">
            <span>Sincronización en tiempo real con Google Sheets</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <ExpenseDetailModal
        record={selectedRecord}
        onClose={() => setSelectedRecord(null)}
        onOpenPhotos={(photos) => {
          setSelectedRecord(null);
          handleOpenPhotoLightbox(photos, 0);
        }}
      />

      {lightboxPhotos && (
        <PhotoLightboxModal
          photos={lightboxPhotos}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxPhotos(null)}
        />
      )}

      <GoogleAppsScriptModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        sheetUrlInput={sheetUrl}
        onUpdateSheetUrl={handleUpdateSheetUrl}
      />
    </div>
  );
}

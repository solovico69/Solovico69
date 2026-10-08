import React, { useState, useEffect } from 'react';
import {
  FormBlock1Data,
  FormBlock3Data,
  FormBlock4Data,
  LineItem,
  BdOptions,
  GastoRecord,
  AttachedPhoto,
} from '../types';
import { PhotoSection } from './PhotoSection';
import {
  calculateLineTotals,
  calculateGrandTotals,
  extractDateMeta,
  formatCurrencyUsd,
  formatCurrencyBs,
} from '../utils/calculations';
import { CalculatorModal } from './CalculatorModal';
import { SearchableCombobox } from './SearchableCombobox';
import {
  Building2,
  FileSpreadsheet,
  Coins,
  Calculator,
  Plus,
  Trash2,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Info,
  DollarSign,
  Percent,
  Database,
  Lock,
  RefreshCw,
} from 'lucide-react';

export function getNextNOrden(gastos: GastoRecord[] = []): string {
  let maxNum = 218; // Baseline from initial dataset (GST-9 is GTO-0000218)
  for (const g of gastos) {
    if (g.nOrden) {
      const match = g.nOrden.match(/(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    }
  }
  const nextNum = maxNum + 1;
  return `GTO-${String(nextNum).padStart(7, '0')}`;
}

interface FormGastosProps {
  bdOptions: BdOptions;
  existingGastos?: GastoRecord[];
  onSave: (records: GastoRecord[], resetAll: boolean) => Promise<{ success: boolean; sheetsSynced?: boolean; sheetsError?: string } | boolean>;
  onOpenBdManager: () => void;
  onOpenSheetsModal?: () => void;
  onAddOption?: (category: keyof BdOptions, value: string) => Promise<void>;
  onRefreshData?: () => Promise<void>;
  saving: boolean;
}

export const FormGastos: React.FC<FormGastosProps> = ({
  bdOptions,
  existingGastos = [],
  onSave,
  onOpenBdManager,
  onOpenSheetsModal,
  onAddOption,
  onRefreshData,
  saving,
}) => {
  // Today's date default
  const todayStr = new Date().toISOString().split('T')[0];

  const handleQuickAddOption = async (category: keyof BdOptions, labelName: string) => {
    const val = prompt(`Ingrese un nuevo valor para ${labelName}:`);
    if (!val || !val.trim()) return;
    const cleanVal = val.trim();
    if (onAddOption) {
      await onAddOption(category, cleanVal);
    }
    if (category === 'obras') setBlock1((prev) => ({ ...prev, obra: cleanVal }));
    else if (category === 'sectores') setBlock1((prev) => ({ ...prev, sector: cleanVal }));
    else if (category === 'agrupaciones') setBlock1((prev) => ({ ...prev, agrupacion: cleanVal }));
    else if (category === 'disciplinas') {
      setLineItems((prev) => {
        const updated = [...prev];
        if (updated.length > 0 && !updated[updated.length - 1].disciplina) {
          updated[updated.length - 1] = { ...updated[updated.length - 1], disciplina: cleanVal };
        }
        return updated;
      });
    }
    else if (category === 'razonesSociales') setBlock1((prev) => ({ ...prev, razonSocial: cleanVal }));
    else if (category === 'registradores') setBlock1((prev) => ({ ...prev, registradoPor: cleanVal }));
  };

  // Block 1 State (Start clean)
  const [block1, setBlock1] = useState<FormBlock1Data>(() => ({
    obra: '',
    sector: '',
    agrupacion: '',
    fechaFactura: todayStr,
    disciplina: '',
    nFactura: '',
    razonSocial: '',
    registradoPor: '',
    nOrden: getNextNOrden(existingGastos),
  }));

  const [isRefreshingOrden, setIsRefreshingOrden] = useState<boolean>(false);

  // Fetch the latest # ORDEN from Google Sheets Column X and server DB
  const refreshNextOrden = async () => {
    setIsRefreshingOrden(true);
    try {
      const res = await fetch('/api/gastos/next-orden');
      if (res.ok) {
        const data = await res.json();
        if (data.nextOrden) {
          setBlock1((prev) => ({ ...prev, nOrden: data.nextOrden }));
        }
      } else if (onRefreshData) {
        await onRefreshData();
      }
    } catch (err) {
      console.error('Error refreshing next orden:', err);
      if (onRefreshData) await onRefreshData();
    } finally {
      setIsRefreshingOrden(false);
    }
  };

  // Auto-fetch next # ORDEN from Google Sheets Column X when component mounts
  useEffect(() => {
    refreshNextOrden();
  }, []);

  // Keep nOrden in sync if existingGastos loads asynchronously
  useEffect(() => {
    if (existingGastos && existingGastos.length > 0) {
      setBlock1((prev) => ({
        ...prev,
        nOrden: getNextNOrden(existingGastos),
      }));
    }
  }, [existingGastos]);

  // Complete Form Reset Function
  const handleClearForm = () => {
    setBlock1({
      obra: '',
      sector: '',
      agrupacion: '',
      fechaFactura: todayStr,
      disciplina: '',
      nFactura: '',
      razonSocial: '',
      registradoPor: '',
      nOrden: getNextNOrden(existingGastos),
    });
    setPhotos([]);
    setTieneFotos(false);
    setLineItems([
      {
        id: `item-${Date.now()}`,
        disciplina: '',
        descripcion: '',
        metrica: bdOptions.metricas[0] || 'unidad',
        cantidad: 1,
        precioBs: undefined,
        precioUsd: undefined,
        ivaSiNo: true,
        totalSinIva: 0,
        ivaUsd: 0,
        totalConIva: 0,
      },
    ]);
    setErrors({});
    refreshNextOrden();
  };

  // Photo Attachment State
  const [photos, setPhotos] = useState<AttachedPhoto[]>([]);
  const [tieneFotos, setTieneFotos] = useState<boolean>(false);
  const [uploadingPhotos, setUploadingPhotos] = useState<boolean>(false);

  // Block 2 State (Dynamic Multi-Line Items)
  const [lineItems, setLineItems] = useState<LineItem[]>([
    {
      id: 'item-1',
      disciplina: '',
      descripcion: '',
      metrica: bdOptions.metricas[0] || 'unidad',
      cantidad: 1,
      precioBs: undefined,
      precioUsd: undefined,
      ivaSiNo: true,
      totalSinIva: 0,
      ivaUsd: 0,
      totalConIva: 0,
    },
  ]);

  // Block 3 State (Conversion & Rates)
  const [block3, setBlock3] = useState<FormBlock3Data>({
    conversion: true,
    binance: undefined,
    bcv: 736.93,
  });

  // Calculator Modal state
  const [calculatorOpen, setCalculatorOpen] = useState(false);
  const [activeCalculatorRowIndex, setActiveCalculatorRowIndex] = useState<number>(0);

  // Validation state
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Recalculate grand totals whenever lines or conversion rates change
  const grandTotals = calculateGrandTotals(
    lineItems,
    block3.conversion,
    block3.binance,
    block3.bcv
  );

  // Synchronize line item calculated values
  useEffect(() => {
    setLineItems((prevItems) =>
      prevItems.map((item) => {
        const isIva = item.ivaSiNo !== undefined ? item.ivaSiNo : true;
        const totals = calculateLineTotals(
          item.cantidad,
          item.precioBs,
          item.precioUsd,
          block3.conversion,
          block3.binance,
          block3.bcv,
          isIva
        );
        return {
          ...item,
          totalSinIva: totals.totalSinIva,
          ivaUsd: totals.ivaUsd,
          totalConIva: totals.totalConIva,
        };
      })
    );
  }, [block3.conversion, block3.binance, block3.bcv]);

  // Handle adding line item
  const handleAddLineItem = () => {
    const newItem: LineItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      disciplina: lineItems[lineItems.length - 1]?.disciplina || '',
      descripcion: '',
      metrica: bdOptions.metricas[0] || 'unidad',
      cantidad: 1,
      precioBs: undefined,
      precioUsd: undefined,
      ivaSiNo: true,
      totalSinIva: 0,
      ivaUsd: 0,
      totalConIva: 0,
    };
    setLineItems([...lineItems, newItem]);
  };

  // Handle removing line item
  const handleRemoveLineItem = (index: number) => {
    if (lineItems.length <= 1) {
      // If only 1 line item left, clear it instead of deleting
      setLineItems([
        {
          id: `item-${Date.now()}`,
          disciplina: '',
          descripcion: '',
          metrica: bdOptions.metricas[0] || 'unidad',
          cantidad: 1,
          precioBs: undefined,
          precioUsd: undefined,
          ivaSiNo: true,
          totalSinIva: 0,
          ivaUsd: 0,
          totalConIva: 0,
        },
      ]);
      return;
    }
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  // Handle line item field change
  const handleLineChange = (index: number, field: keyof LineItem, val: any) => {
    const updated = [...lineItems];
    const current = { ...updated[index], [field]: val };

    const isIva = field === 'ivaSiNo' ? Boolean(val) : (current.ivaSiNo !== undefined ? current.ivaSiNo : true);

    // Calculate totals for updated line
    const totals = calculateLineTotals(
      field === 'cantidad' ? Number(val) : current.cantidad,
      field === 'precioBs' ? (val !== '' ? Number(val) : undefined) : current.precioBs,
      field === 'precioUsd' ? (val !== '' ? Number(val) : undefined) : current.precioUsd,
      block3.conversion,
      block3.binance,
      block3.bcv,
      isIva
    );

    updated[index] = {
      ...current,
      totalSinIva: totals.totalSinIva,
      ivaUsd: totals.ivaUsd,
      totalConIva: totals.totalConIva,
    };

    setLineItems(updated);
  };

  // Open Calculator for specific line item
  const openCalculatorForRow = (index: number) => {
    setActiveCalculatorRowIndex(index);
    setCalculatorOpen(true);
  };

  // Apply result from calculator to line item
  const handleApplyCalculatorResult = (val: number, targetField: 'bs' | 'usd') => {
    if (targetField === 'bs') {
      handleLineChange(activeCalculatorRowIndex, 'precioBs', val);
    } else {
      handleLineChange(activeCalculatorRowIndex, 'precioUsd', val);
    }
  };

  // Validate form fields before submission
  const validateForm = (): boolean => {
    const errs: { [key: string]: string } = {};

    if (!block1.obra.trim()) errs.obra = 'La Obra es obligatoria';
    if (!block1.sector.trim()) errs.sector = 'El Sector es obligatorio';
    if (!block1.agrupacion.trim()) errs.agrupacion = 'La Agrupación es obligatoria';
    if (!block1.registradoPor.trim()) errs.registradoPor = 'El campo Registrado Por es obligatorio';

    // Validate line items
    let hasValidLine = false;
    lineItems.forEach((item) => {
      if (item.descripcion.trim()) {
        hasValidLine = true;
      }
    });

    if (!hasValidLine) {
      errs.lines = 'Debe ingresar la Descripción de al menos un ítem o gasto';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Prepare records array for API save
  const prepareGastoRecords = (uploadedPhotos: AttachedPhoto[] = photos): GastoRecord[] => {
    const dateMeta = extractDateMeta(block1.fechaFactura);
    const assignedNOrden = block1.nOrden || getNextNOrden(existingGastos);
    const isTieneFotos = tieneFotos || uploadedPhotos.length > 0;
    const driveUrls = uploadedPhotos.map((p) => p.driveUrl).filter(Boolean).join(', ');

    return lineItems
      .filter((item, idx) => item.descripcion.trim() !== '' || item.precioBs !== undefined || item.precioUsd !== undefined || lineItems.length === 1 || idx === 0)
      .map((item, idx) => {
        const isIva = item.ivaSiNo !== undefined ? item.ivaSiNo : true;
        const lineTotals = calculateLineTotals(
          item.cantidad,
          item.precioBs,
          item.precioUsd,
          block3.conversion,
          block3.binance,
          block3.bcv,
          isIva
        );

        return {
          id: `gst-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 5)}`,
          obra: block1.obra,
          sector: block1.sector,
          agrupacion: block1.agrupacion,
          fechaFactura: block1.fechaFactura,
          disciplina: item.disciplina || '',
          nFactura: block1.nFactura.trim() || 'S/C',
          razonSocial: block1.razonSocial,
          descripcion: item.descripcion || 'Gasto no especificado',
          conversion: block3.conversion,
          binance: block3.binance,
          bcv: block3.bcv,
          metrica: item.metrica,
          cantidad: item.cantidad,
          preciosUnitariosBs: item.precioBs,
          preciosUnitariosUsd: item.precioUsd,
          totalSinIva: lineTotals.totalSinIva,
          ivaSiNo: isIva,
          ivaUsd: lineTotals.ivaUsd,
          totalConIva: lineTotals.totalConIva,
          registradoPor: block1.registradoPor,
          fechaCorte: dateMeta.fechaCorte,
          mes: dateMeta.mes,
          ano: dateMeta.ano,
          nOrden: assignedNOrden,
          tieneFotos: isTieneFotos,
          fotosUrl: driveUrls || (isTieneFotos ? 'TRUE' : 'FALSE'),
          fotos: uploadedPhotos,
          createdAt: new Date().toISOString(),
        };
      });
  };

  // Submit Handler: "Guardar"
  const handleSubmitSave = async (resetAll: boolean = true) => {
    if (!validateForm()) return;

    let finalPhotos = [...photos];

    // Upload photos to Google Drive if there are any
    if (photos.length > 0) {
      setUploadingPhotos(true);
      try {
        const response = await fetch('/api/drive/upload-photos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            photos,
            fechaFactura: block1.fechaFactura,
            nOrden: block1.nOrden || getNextNOrden(existingGastos),
          }),
        });

        if (response.ok) {
          const json = await response.json();
          if (json.photos && Array.isArray(json.photos)) {
            finalPhotos = json.photos;
            setPhotos(json.photos);
          }
        }
      } catch (uploadErr) {
        console.error('Error uploading photos to Drive:', uploadErr);
      } finally {
        setUploadingPhotos(false);
      }
    }

    const records = prepareGastoRecords(finalPhotos);
    const success = await onSave(records, resetAll);

    if (success) {
      const nextOrden = getNextNOrden([...existingGastos, ...records]);
      if (resetAll) {
        // Reset whole form
        handleClearForm();
        setBlock1((prev) => ({ ...prev, nOrden: nextOrden }));
      } else {
        // "Guardar y agregar otra": Keep Obra/Sector/Agrupación/RegistradoPor, reset lines, nFactura & photos
        setBlock1((prev) => ({ ...prev, nFactura: '', nOrden: nextOrden }));
        setPhotos([]);
        setTieneFotos(false);
        setLineItems([
          {
            id: `item-${Date.now()}`,
            disciplina: '',
            descripcion: '',
            metrica: bdOptions.metricas[0] || 'unidad',
            cantidad: 1,
            precioBs: undefined,
            precioUsd: undefined,
            ivaSiNo: true,
            totalSinIva: 0,
            ivaUsd: 0,
            totalConIva: 0,
          },
        ]);
        setErrors({});
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6 animate-fadeIn text-slate-900 dark:text-slate-100 font-sans">
      {/* Top Banner Notice */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="bg-indigo-600 dark:bg-indigo-500 p-2.5 rounded-xl shadow-md text-white flex-shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white uppercase">
              FORMULARIO DE REGISTRO DE FACTURAS O GASTOS
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Ingrese la información por bloques para procesar el gasto
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={onOpenBdManager}
            className="px-4 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-xs font-bold text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 transition-colors flex items-center gap-2 whitespace-nowrap shadow-xs"
          >
            <Database className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>+ Agregar Opciones a Listas</span>
          </button>

          {onOpenSheetsModal && (
            <button
              type="button"
              onClick={onOpenSheetsModal}
              className="px-4 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900 text-xs font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 transition-colors flex items-center gap-2 whitespace-nowrap shadow-xs"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Conectar Google Sheets</span>
            </button>
          )}
        </div>
      </div>

      {/* Global Validation Errors Alert */}
      {Object.keys(errors).length > 0 && (
        <div className="p-4 rounded-lg bg-red-950/60 border border-red-800 text-red-200 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-sm font-mono uppercase text-red-300">Por favor complete los campos requeridos:</h4>
            <ul className="text-xs list-disc list-inside space-y-0.5 font-mono">
              {Object.values(errors).map((err, idx) => (
                <li key={idx}>{err}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Grid Layout matching Geometric Balance arrangement */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Block 1 (Identificación) & Block 2 (Conversión) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* BLOCK 1: Datos de Identificación */}
          <section className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400"></span>
                1. Datos de identificación
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400">* Obligatorios</span>
                <button
                  type="button"
                  onClick={onOpenBdManager}
                  className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                  title="Agregar un nuevo valor a la lista"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Listas BD</span>
                </button>
              </div>
            </div>

            <div className="space-y-3.5">
              {/* OBRA */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Obra *
                  </label>
                  <button
                    type="button"
                    onClick={() => handleQuickAddOption('obras', 'Obra')}
                    className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
                  >
                    + Nueva opción
                  </button>
                </div>
                <SearchableCombobox
                  value={block1.obra}
                  onChange={(val) => setBlock1({ ...block1, obra: val })}
                  options={bdOptions.obras}
                  placeholder="Buscar o escribir obra..."
                  error={errors.obra}
                />
              </div>

              {/* SECTOR */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Sector *
                  </label>
                  <button
                    type="button"
                    onClick={() => handleQuickAddOption('sectores', 'Sector')}
                    className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
                  >
                    + Nueva opción
                  </button>
                </div>
                <SearchableCombobox
                  value={block1.sector}
                  onChange={(val) => setBlock1({ ...block1, sector: val })}
                  options={bdOptions.sectores}
                  placeholder="Buscar o escribir sector..."
                  error={errors.sector}
                />
              </div>

              {/* AGRUPACIÓN */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Agrupación / Concepto *
                  </label>
                  <button
                    type="button"
                    onClick={() => handleQuickAddOption('agrupaciones', 'Agrupación / Concepto')}
                    className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
                  >
                    + Nueva opción
                  </button>
                </div>
                <SearchableCombobox
                  value={block1.agrupacion}
                  onChange={(val) => setBlock1({ ...block1, agrupacion: val })}
                  options={bdOptions.agrupaciones}
                  placeholder="Buscar o escribir agrupación..."
                  error={errors.agrupacion}
                />
              </div>

              {/* Row for # ORDEN, Factura # & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* # ORDEN (Campo de solo lectura) */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span># ORDEN</span>
                      <button
                        type="button"
                        onClick={refreshNextOrden}
                        className="p-1 rounded-md hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                        title="Verificar y obtener el último número de orden desde Google Sheets (Columna X) y el servidor"
                      >
                          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingOrden ? 'animate-spin text-indigo-600 dark:text-indigo-400' : ''}`} />
                        </button>
                    </div>
                    <span className="text-[10px] text-slate-400 font-normal">Autogenerado</span>
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      readOnly
                      value={block1.nOrden || getNextNOrden(existingGastos)}
                      className="w-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 p-2.5 pr-9 rounded-xl text-sm font-mono font-bold text-indigo-600 dark:text-indigo-400 cursor-not-allowed outline-none select-none"
                      title="Número de orden asignado automáticamente"
                    />
                    <div className="absolute right-3 text-slate-400" title="Campo no modificable">
                      <Lock className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                {/* FACTURA # */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Factura #
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setBlock1((prev) => ({
                          ...prev,
                          nFactura: prev.nFactura === 'S/C' ? '' : 'S/C',
                        }))
                      }
                      className={`text-[11px] px-2 py-0.5 rounded-md font-bold font-mono transition-colors ${
                        block1.nFactura === 'S/C'
                          ? 'bg-amber-500 text-white shadow-xs'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 hover:text-indigo-600 dark:hover:text-indigo-300'
                      }`}
                      title="Haz clic para marcar como Sin Comprobante (S/C)"
                    >
                      {block1.nFactura === 'S/C' ? '✓ S/C' : '+ S/C'}
                    </button>
                  </div>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      placeholder="N° Factura o S/C"
                      value={block1.nFactura}
                      onChange={(e) => setBlock1({ ...block1, nFactura: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2.5 rounded-xl text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono"
                    />
                  </div>
                </div>

                {/* FECHA FACTURA */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Fecha
                  </label>
                  <input
                    type="date"
                    value={block1.fechaFactura}
                    onChange={(e) => setBlock1({ ...block1, fechaFactura: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2.5 rounded-xl text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              {/* RAZÓN SOCIAL */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Proveedor / Razón Social
                  </label>
                  <button
                    type="button"
                    onClick={() => handleQuickAddOption('razonesSociales', 'Proveedor / Razón Social')}
                    className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
                  >
                    + Nueva opción
                  </button>
                </div>
                <SearchableCombobox
                  value={block1.razonSocial}
                  onChange={(val) => setBlock1({ ...block1, razonSocial: val })}
                  options={bdOptions.razonesSociales}
                  placeholder="Escriba para buscar o ingresar Razón Social (ej. EPA)..."
                />
              </div>

              {/* REGISTRADO POR */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Registrado Por *
                  </label>
                  <button
                    type="button"
                    onClick={() => handleQuickAddOption('registradores', 'Registrado Por')}
                    className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
                  >
                    + Nueva opción
                  </button>
                </div>
                <SearchableCombobox
                  value={block1.registradoPor}
                  onChange={(val) => setBlock1({ ...block1, registradoPor: val })}
                  options={bdOptions.registradores}
                  placeholder="Buscar o escribir nombre..."
                  error={errors.registradoPor}
                />
              </div>

              {/* SECCIÓN ADJUNTAR FOTOS Y COMPROBANTES */}
              <PhotoSection
                tieneFotos={tieneFotos}
                onToggleTieneFotos={setTieneFotos}
                photos={photos}
                onPhotosChange={setPhotos}
                fechaFactura={block1.fechaFactura}
                nOrden={block1.nOrden || getNextNOrden(existingGastos)}
              />
            </div>
          </section>

          {/* BLOCK 2: Conversión & Moneda */}
          <section className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                2. Conversión & Moneda
              </h2>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={block3.conversion}
                  onChange={(e) => setBlock3({ ...block3, conversion: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            {block3.conversion ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col">
                  <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-1 uppercase">BINANCE</span>
                  <input
                    type="number"
                    step="any"
                    placeholder="Factor Binance"
                    value={block3.binance !== undefined ? block3.binance : ''}
                    onChange={(e) =>
                      setBlock3({
                        ...block3,
                        binance: e.target.value !== '' ? parseFloat(e.target.value) : undefined,
                      })
                    }
                    className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2.5 rounded-xl text-sm font-mono text-slate-900 dark:text-indigo-300 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-1 uppercase">BCV</span>
                  <input
                    type="number"
                    step="any"
                    placeholder="Tasa BCV"
                    value={block3.bcv !== undefined ? block3.bcv : ''}
                    onChange={(e) =>
                      setBlock3({
                        ...block3,
                        bcv: e.target.value !== '' ? parseFloat(e.target.value) : undefined,
                      })
                    }
                    className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2.5 rounded-xl text-sm font-mono text-slate-900 dark:text-indigo-300 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic py-1">
                Conversión inactiva. Los cálculos usarán montos directos.
              </p>
            )}
          </section>

        </div>

        {/* Right Column: Block 3 (Descripción) & Block 4 (Totales) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* BLOCK 3: Descripción y Detalles de Gastos */}
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex-1 flex flex-col overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-wrap justify-between items-center bg-slate-50/50 dark:bg-slate-800/40 gap-2">
              <h2 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                3. Descripción y Detalles de Gastos
              </h2>
              <button
                type="button"
                onClick={() => openCalculatorForRow(0)}
                className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-600 dark:text-indigo-400 text-xs font-semibold px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800 transition-colors uppercase tracking-wider"
              >
                <Calculator className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                CALCULADORA INTERACTIVA
              </button>
            </div>

            <div className="flex-1 overflow-x-auto">
              {/* Table Header */}
              <div className="min-w-[820px] grid grid-cols-[150px_minmax(180px,1fr)_90px_60px_90px_90px_76px_56px] gap-2 px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between pr-1">
                  <span>Disciplina</span>
                  <button
                    type="button"
                    onClick={() => handleQuickAddOption('disciplinas', 'Disciplina')}
                    className="text-[9px] lowercase text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
                    title="Añadir nueva opción de disciplina"
                  >
                    +nueva
                  </button>
                </div>
                <div>Descripción</div>
                <div>Métrica</div>
                <div className="text-center">Cant.</div>
                <div className="text-right">Unit Bss</div>
                <div className="text-right">Unit USD ($)</div>
                <div className="text-center">IVA (16%)</div>
                <div className="text-center">Acción</div>
              </div>

              {/* Rows Container */}
              <div className="min-w-[820px] divide-y divide-slate-100 dark:divide-slate-800/60">
                {lineItems.map((item, idx) => {
                  const isIva = item.ivaSiNo !== undefined ? item.ivaSiNo : true;
                  return (
                    <div
                      key={item.id}
                      className="grid grid-cols-[150px_minmax(180px,1fr)_90px_60px_90px_90px_76px_56px] gap-2 px-4 py-3 items-center hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* DISCIPLINA (Lado izquierdo de Descripción) */}
                      <div>
                        <select
                          value={item.disciplina || ''}
                          onChange={(e) => handleLineChange(idx, 'disciplina', e.target.value)}
                          className="bg-slate-50 dark:bg-slate-800 text-xs p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 w-full text-slate-800 dark:text-slate-200 outline-none focus:ring-1 focus:ring-indigo-500 font-medium truncate"
                          title={item.disciplina || 'Seleccione disciplina'}
                        >
                          <option value="">Seleccionar...</option>
                          {bdOptions.disciplinas.map((d, i) => (
                            <option key={i} value={d}>
                              {d}
                            </option>
                          ))}
                          {item.disciplina && !bdOptions.disciplinas.includes(item.disciplina) && (
                            <option value={item.disciplina}>{item.disciplina}</option>
                          )}
                        </select>
                      </div>

                      {/* DESCRIPCIÓN */}
                      <div>
                        <input
                          type="text"
                          placeholder="Descripción del gasto..."
                          value={item.descripcion}
                          onChange={(e) => handleLineChange(idx, 'descripcion', e.target.value)}
                          className="bg-transparent border-b border-slate-200 dark:border-slate-700 focus:border-indigo-500 w-full text-sm outline-none text-slate-900 dark:text-white py-1 px-1"
                        />
                      </div>
                      <div className="col-span-1">
                        <select
                          value={item.metrica}
                          onChange={(e) => handleLineChange(idx, 'metrica', e.target.value)}
                          className="bg-slate-50 dark:bg-slate-800 text-xs p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 w-full text-slate-800 dark:text-slate-200 outline-none"
                        >
                          {bdOptions.metricas.map((m, i) => (
                            <option key={i} value={m}>{m}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-1">
                        <input
                          type="number"
                          min="0.01"
                          step="any"
                          value={item.cantidad}
                          onChange={(e) => handleLineChange(idx, 'cantidad', parseFloat(e.target.value) || 0)}
                          className="bg-transparent border-b border-slate-200 dark:border-slate-700 focus:border-indigo-500 w-full text-center text-sm font-mono text-slate-900 dark:text-white py-1"
                        />
                      </div>
                      <div className="col-span-1">
                        <input
                          type="number"
                          step="any"
                          placeholder="0.00"
                          value={item.precioBs !== undefined ? item.precioBs : ''}
                          onChange={(e) => handleLineChange(idx, 'precioBs', e.target.value)}
                          className="bg-transparent border-b border-slate-200 dark:border-slate-700 focus:border-indigo-500 w-full text-right text-sm font-mono text-slate-700 dark:text-slate-300 py-1"
                        />
                      </div>
                      <div className="col-span-1">
                        <input
                          type="number"
                          step="any"
                          placeholder="0.00"
                          value={item.precioUsd !== undefined ? item.precioUsd : ''}
                          onChange={(e) => handleLineChange(idx, 'precioUsd', e.target.value)}
                          className="bg-transparent border-b border-slate-200 dark:border-slate-700 focus:border-indigo-500 w-full text-right text-sm font-mono text-indigo-600 dark:text-indigo-400 font-semibold py-1"
                        />
                      </div>
                      <div className="col-span-1 text-center">
                        <button
                          type="button"
                          onClick={() => handleLineChange(idx, 'ivaSiNo', !isIva)}
                          className={`w-full py-1.5 px-1 rounded-lg text-[10px] font-bold uppercase transition-all border ${
                            isIva
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-300 dark:border-slate-700 hover:border-slate-400'
                          }`}
                          title={isIva ? 'Aplica 16% IVA' : 'Producto Exento de IVA (0%)'}
                        >
                          {isIva ? '16% IVA' : 'EXENTO'}
                        </button>
                      </div>
                      <div className="col-span-1 text-center flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => openCalculatorForRow(idx)}
                          className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 p-1"
                          title="Calculadora para esta línea"
                        >
                          <Calculator className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveLineItem(idx)}
                          className="text-slate-400 hover:text-red-500 p-1 transition-colors"
                          title="Eliminar fila"
                        >
                          &times;
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Add Line Control */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <button
                type="button"
                onClick={handleAddLineItem}
                className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 uppercase tracking-wider transition-colors"
              >
                <Plus className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                + AGREGAR OTRO ÍTEM / LÍNEA
              </button>
              <span className="text-[10px] text-slate-500 font-medium">
                {lineItems.length} ÍTEM(S) REGISTRADO(S)
              </span>
            </div>

            {/* BLOCK 4: Totales Section inside Right Column */}
            <div className="p-5 sm:p-6 bg-slate-50/50 dark:bg-slate-900 grid grid-cols-1 sm:grid-cols-3 gap-6 border-t border-slate-200 dark:border-slate-800">
              <div className="flex flex-col border-b sm:border-b-0 sm:border-r border-slate-200 dark:border-slate-800 pb-3 sm:pb-0">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase mb-1">4. Subtotal Sin IVA</span>
                <span className="text-2xl font-bold font-mono text-slate-800 dark:text-slate-200">
                  {formatCurrencyUsd(grandTotals.totalSinIva)}
                </span>
              </div>

              <div className="flex flex-col border-b sm:border-b-0 sm:border-r border-slate-200 dark:border-slate-800 pb-3 sm:pb-0">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase mb-1">Monto IVA Total (16%)</span>
                <span className="text-2xl font-bold font-mono text-indigo-600 dark:text-indigo-400">
                  {formatCurrencyUsd(grandTotals.ivaUsd)}
                </span>
                <span className="text-[10px] text-slate-400 italic mt-0.5">Suma del IVA de cada ítem</span>
              </div>

              <div className="flex flex-col bg-indigo-600 text-white p-4 rounded-xl shadow-md relative">
                <span className="text-[10px] text-indigo-200 font-bold uppercase mb-1">Total a Pagar</span>
                <span className="text-3xl font-black font-mono tracking-tight">
                  {formatCurrencyUsd(grandTotals.totalConIva)}
                </span>
                <div className="mt-1 text-right text-xs text-indigo-100 font-mono">
                  Bss. {(grandTotals.totalConIva * (block3.bcv || 1)).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          </section>

          {/* Action Bar Footer */}
          <footer className="flex flex-col sm:flex-row justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleClearForm}
                className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-5 py-2.5 rounded-xl text-xs font-bold transition-all uppercase tracking-wider"
              >
                Limpiar Formulario
              </button>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                disabled={saving || uploadingPhotos}
                onClick={() => handleSubmitSave(false)}
                className="w-full sm:w-auto border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50"
              >
                {uploadingPhotos ? 'Subiendo fotos...' : 'Guardar y Agregar Otro'}
              </button>

              <button
                type="button"
                disabled={saving || uploadingPhotos}
                onClick={() => handleSubmitSave(true)}
                className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-7 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-indigo-600/30 transition-all disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>
                  {uploadingPhotos ? 'Subiendo fotos a Drive...' : (saving ? 'Guardando...' : 'Guardar Factura')}
                </span>
              </button>
            </div>
          </footer>

        </div>
      </div>

      {/* Interactive Calculator Modal */}
      <CalculatorModal
        isOpen={calculatorOpen}
        onClose={() => setCalculatorOpen(false)}
        onApplyResult={handleApplyCalculatorResult}
        targetItemIndex={activeCalculatorRowIndex}
      />
    </div>
  );
};

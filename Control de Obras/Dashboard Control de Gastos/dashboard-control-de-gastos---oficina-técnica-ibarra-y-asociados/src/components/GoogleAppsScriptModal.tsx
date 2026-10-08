import React, { useState } from 'react';
import { X, Copy, Check, Code2, Link, Server, ShieldAlert } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  sheetUrlInput: string;
  onUpdateSheetUrl: (url: string) => void;
}

export const GoogleAppsScriptModal: React.FC<Props> = ({
  isOpen,
  onClose,
  sheetUrlInput,
  onUpdateSheetUrl,
}) => {
  const [copied, setCopied] = useState(false);
  const [inputUrl, setInputUrl] = useState(sheetUrlInput);

  if (!isOpen) return null;

  const gasCode = `/**
 * Google Apps Script - Oficina Técnica Ibarra y Asociados, C.A.
 * Servidor de API Web para 'Control de Gastos en Obras'
 * Pestañas: 'CONTROL_GASTOS' y 'RESUMEN'
 */

function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetGastos = ss.getSheetByName('CONTROL_GASTOS');
  var sheetResumen = ss.getSheetByName('RESUMEN');
  
  if (!sheetGastos) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: "No se encontró la pestaña 'CONTROL_GASTOS'" }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  var dataGastos = sheetGastos.getDataRange().getValues();
  var headers = dataGastos[0];
  var rows = dataGastos.slice(1);
  
  var expenses = rows.map(function(row) {
    var obj = {};
    headers.forEach(function(header, i) {
      obj[header] = row[i] !== undefined ? row[i] : "";
    });
    return obj;
  });
  
  var result = {
    timestamp: new Date().toISOString(),
    totalRows: expenses.length,
    expenses: expenses
  };
  
  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}
`;

  const handleCopy = () => {
    navigator.clipboard.writeText(gasCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveUrl = () => {
    onUpdateSheetUrl(inputUrl);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-800/80 rounded-xl border border-emerald-600/40">
              <Server className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                Sincronización en Tiempo Real con Google Sheets
              </h3>
              <p className="text-xs text-emerald-200">
                Oficina Técnica Ibarra y Asociados, C.A. - Conector Volátil Sin Base de Datos
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Instructions Box */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-xs text-emerald-950 space-y-2">
            <div className="font-bold text-sm text-emerald-900 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-emerald-700" />
              Almacenamiento Permanente de la URL de Sincronización
            </div>
            <p>
              Para mayor comodidad de todo el equipo de <strong>Oficina Técnica Ibarra y Asociados, C.A.</strong>, la URL que ingreses a continuación <strong>se guardará automáticamente de forma permanente en tu navegador (localStorage)</strong>.
            </p>
            <p className="text-emerald-800">
              Al abrir o sincronizar la aplicación en el futuro, los datos se extraerán directamente y en tiempo real desde las pestañas <code className="bg-emerald-200/70 px-1 rounded">CONTROL_GASTOS</code> y <code className="bg-emerald-200/70 px-1 rounded">RESUMEN</code> sin requerir pegar la URL nuevamente.
            </p>
          </div>

          {/* Web App URL Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Link className="w-4 h-4 text-emerald-700" />
                URL de la Aplicación Web (Google Apps Script / CSV público):
              </label>
              {inputUrl && (
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <Check className="w-3 h-3" /> URL Guardada
                </span>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="url"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
                className="flex-1 text-xs px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSaveUrl}
                  className="px-4 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-xl transition-colors shadow-sm flex items-center gap-1.5 whitespace-nowrap"
                >
                  <Check className="w-4 h-4" />
                  Guardar y Conectar
                </button>
                {inputUrl && (
                  <button
                    onClick={() => {
                      setInputUrl('');
                      onUpdateSheetUrl('');
                    }}
                    className="px-3 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 transition-colors whitespace-nowrap"
                    title="Eliminar URL guardada"
                  >
                    Borrar
                  </button>
                )}
              </div>
            </div>
            <p className="text-[11px] text-slate-500">
              Si se vacía y se borra, la App utilizará el conjunto de datos volátil oficial pre-cargado.
            </p>
          </div>

          {/* Code Snippet */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Code2 className="w-4 h-4 text-emerald-700" />
                Código de Google Apps Script (Code.gs):
              </label>
              <button
                onClick={handleCopy}
                className="text-xs font-bold px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg transition-colors flex items-center gap-1 border border-slate-300"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? '¡Copiado!' : 'Copiar Código'}
              </button>
            </div>

            <pre className="p-4 bg-slate-900 text-emerald-400 font-mono text-xs rounded-xl overflow-x-auto max-h-56 leading-relaxed">
              {gasCode}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 text-white font-bold text-xs rounded-xl hover:bg-slate-900 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

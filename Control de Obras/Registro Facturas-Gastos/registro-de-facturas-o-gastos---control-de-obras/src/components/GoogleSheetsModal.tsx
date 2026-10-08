import React, { useState, useEffect } from 'react';
import {
  X,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  Send,
  HelpCircle,
  Info,
  ShieldCheck,
  Code2,
} from 'lucide-react';

interface GoogleSheetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigSaved?: () => void;
}

export interface SheetsConfig {
  spreadsheetId?: string;
  sheetName?: string;
  webAppUrl?: string;
  accessToken?: string;
  autoSync?: boolean;
}

export const GoogleSheetsModal: React.FC<GoogleSheetsModalProps> = ({
  isOpen,
  onClose,
  onConfigSaved,
}) => {
  const [activeTab, setActiveTab] = useState<'webapp' | 'api'>('webapp');
  const [webAppUrl, setWebAppUrl] = useState('');
  const [spreadsheetId, setSpreadsheetId] = useState('');
  const [sheetName, setSheetName] = useState('Hoja 1');
  const [accessToken, setAccessToken] = useState('');
  const [autoSync, setAutoSync] = useState(true);

  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [syncingAll, setSyncingAll] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [copiedScript, setCopiedScript] = useState(false);

  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchConfig();
    }
  }, [isOpen]);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/sheets/config');
      if (res.ok) {
        const data: SheetsConfig = await res.json();
        const cachedUrl = localStorage.getItem('persistent_webAppUrl') || '';
        const effectiveUrl = data.webAppUrl || cachedUrl;

        setWebAppUrl(effectiveUrl);
        setSpreadsheetId(data.spreadsheetId || '');
        setSheetName(data.sheetName || 'Hoja 1');
        setAccessToken(data.accessToken || '');
        setAutoSync(data.autoSync !== undefined ? data.autoSync : true);

        if (effectiveUrl) {
          localStorage.setItem('persistent_webAppUrl', effectiveUrl);
        }

        if (data.spreadsheetId && !effectiveUrl) {
          setActiveTab('api');
        }
      }
    } catch (err) {
      console.error('Error fetching sheets config:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async () => {
    setStatusMsg(null);
    setLoading(true);

    try {
      if (webAppUrl?.trim()) {
        localStorage.setItem('persistent_webAppUrl', webAppUrl.trim());
      }

      const res = await fetch('/api/sheets/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          webAppUrl,
          spreadsheetId,
          sheetName,
          accessToken,
          autoSync,
        }),
      });

      if (res.ok) {
        setStatusMsg({ type: 'success', text: '¡Configuración de Google Sheets guardada exitosamente!' });
        if (onConfigSaved) onConfigSaved();
      } else {
        const err = await res.json();
        setStatusMsg({ type: 'error', text: err.error || 'Error al guardar la configuración.' });
      }
    } catch (err) {
      setStatusMsg({ type: 'error', text: 'Error de red al guardar la configuración.' });
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setStatusMsg(null);
    setTesting(true);

    try {
      // First save current values
      await handleSaveConfig();

      const res = await fetch('/api/sheets/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          webAppUrl,
          spreadsheetId,
          sheetName,
          accessToken,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setStatusMsg({ type: 'success', text: data.message || '¡Prueba exitosa! Revisa tu Google Sheet.' });
      } else {
        setStatusMsg({ type: 'error', text: data.error || 'Fallo la prueba de conexión.' });
      }
    } catch (err) {
      setStatusMsg({ type: 'error', text: 'Error de red al probar la conexión.' });
    } finally {
      setTesting(false);
    }
  };

  const handleSyncAll = async () => {
    setStatusMsg(null);
    setSyncingAll(true);

    try {
      const res = await fetch('/api/sheets/sync', {
        method: 'POST',
      });

      const data = await res.json();
      if (res.ok) {
        setStatusMsg({ type: 'success', text: data.message });
      } else {
        setStatusMsg({ type: 'error', text: data.error || 'Error al sincronizar registros.' });
      }
    } catch (err) {
      setStatusMsg({ type: 'error', text: 'Error al procesar la sincronización.' });
    } finally {
      setSyncingAll(false);
    }
  };

  const appsScriptCode = `function doGet(e) {
  return handleRequest(e ? e.parameter : {});
}

function doPost(e) {
  var data = {};
  try {
    if (e && e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    }
  } catch(err) {}
  if (!data.action && e && e.parameter) {
    data = e.parameter;
  }
  return handleRequest(data);
}

function handleRequest(data) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var action = data.action || 'append';

    // 0. OBTENER TODOS LOS REGISTROS DE LA HOJA
    if (action === 'getGastos') {
      var mainSheet = ss.getSheetByName(data.sheetName || 'Control_Gastos') || ss.getActiveSheet();
      var values = mainSheet.getDataRange().getValues();
      return jsonResponse({ result: 'success', rows: values });
    }

    // 1. OBTENER ULTIMO # ORDEN (COLUMNA V / COLUMNA 22)
    if (action === 'getLastOrden') {
      var mainSheet = ss.getSheetByName(data.sheetName || 'Control_Gastos') || ss.getActiveSheet();
      var lastRow = mainSheet.getLastRow();
      var lastOrden = '';
      if (lastRow >= 1) {
        var vals = mainSheet.getRange(1, 22, lastRow, 1).getValues();
        for (var r = vals.length - 1; r >= 0; r--) {
          var cellVal = String(vals[r][0] || '').trim();
          if (cellVal !== '' && cellVal.toUpperCase().indexOf('ORDEN') === -1) {
            lastOrden = cellVal;
            break;
          }
        }
      }
      return jsonResponse({ result: 'success', lastOrden: lastOrden, lastRow: lastRow });
    }

    // 2. SUBIR FOTOS A DRIVE EN CARPETA 'Facturas_Gastos_Adjuntos'
    if (action === 'uploadPhotos') {
      var folderName = 'Facturas_Gastos_Adjuntos';
      var folders = DriveApp.getFoldersByName(folderName);
      var folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(folderName);
      var uploaded = [];
      var photos = data.photos || [];
      for (var i = 0; i < photos.length; i++) {
        var p = photos[i];
        if (!p.base64) continue;
        var b64Str = String(p.base64);
        var commaIdx = b64Str.indexOf(',');
        var cleanB64 = commaIdx >= 0 ? b64Str.substring(commaIdx + 1) : b64Str;
        var decoded = Utilities.base64Decode(cleanB64);
        var mime = p.mimeType || 'image/jpeg';
        var fileName = p.name || ('photo_' + (i + 1) + '.jpg');
        var blob = Utilities.newBlob(decoded, mime, fileName);
        var file = folder.createFile(blob);
        try {
          file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        } catch(e) {}
        uploaded.push({
          id: p.id || ('photo_' + i),
          name: file.getName(),
          driveUrl: file.getUrl(),
          driveFileId: file.getId(),
          base64: p.base64,
          mimeType: mime
        });
      }
      return jsonResponse({ result: 'success', photos: uploaded, folderName: folderName, folderId: folder.getId() });
    }

    // 3. EXTRAER OPCIONES DE LA HOJA BD
    if (action === 'getBD') {
      var bdSheet = ss.getSheetByName('BD');
      if (!bdSheet) {
        bdSheet = ss.insertSheet('BD');
        bdSheet.appendRow(['OBRA', 'SECTOR', 'AGRUPACION', 'DISCIPLINA', 'RAZON SOCIAL', 'METRICA', 'REGISTRADO POR']);
      }
      var values = bdSheet.getDataRange().getValues();
      var result = { obras: [], sectores: [], agrupaciones: [], disciplinas: [], razonesSociales: [], metricas: [], registradores: [] };

      if (values.length > 0) {
        var headerRow = values[0];
        var colMap = {};
        for (var c = 0; c < headerRow.length; c++) {
          var h = String(headerRow[c] || '').trim().toUpperCase();
          if (h.indexOf('OBRA') !== -1) colMap['obras'] = c;
          else if (h.indexOf('SECTOR') !== -1) colMap['sectores'] = c;
          else if (h.indexOf('AGRUPAC') !== -1 || h.indexOf('CONCEPTO') !== -1) colMap['agrupaciones'] = c;
          else if (h.indexOf('DISCIPLIN') !== -1) colMap['disciplinas'] = c;
          else if (h.indexOf('RAZON') !== -1 || h.indexOf('PROVEEDOR') !== -1) colMap['razonesSociales'] = c;
          else if (h.indexOf('METRIC') !== -1 || h.indexOf('UNIDAD') !== -1) colMap['metricas'] = c;
          else if (h.indexOf('REGISTRAD') !== -1 || h.indexOf('USUARIO') !== -1) colMap['registradores'] = c;
        }

        if (colMap['obras'] === undefined) colMap['obras'] = 0;
        if (colMap['sectores'] === undefined) colMap['sectores'] = 1;
        if (colMap['agrupaciones'] === undefined) colMap['agrupaciones'] = 2;
        if (colMap['disciplinas'] === undefined) colMap['disciplinas'] = 3;
        if (colMap['razonesSociales'] === undefined) colMap['razonesSociales'] = 4;
        if (colMap['metricas'] === undefined) colMap['metricas'] = 5;
        if (colMap['registradores'] === undefined) colMap['registradores'] = 6;

        var categories = ['obras', 'sectores', 'agrupaciones', 'disciplinas', 'razonesSociales', 'metricas', 'registradores'];
        for (var r = 1; r < values.length; r++) {
          for (var i = 0; i < categories.length; i++) {
            var cat = categories[i];
            var colIdx = colMap[cat];
            if (colIdx !== undefined && values[r][colIdx] !== undefined && values[r][colIdx] !== null) {
              var val = String(values[r][colIdx]).trim();
              if (val !== '' && result[cat].indexOf(val) === -1) {
                result[cat].push(val);
              }
            }
          }
        }
      }
      return jsonResponse({ result: 'success', bd: result });
    }

    // 4. AGREGAR OPCION A LA HOJA BD
    if (action === 'addBD') {
      var bdSheet = ss.getSheetByName('BD');
      if (!bdSheet) {
        bdSheet = ss.insertSheet('BD');
        bdSheet.appendRow(['OBRA', 'SECTOR', 'AGRUPACION', 'DISCIPLINA', 'RAZON SOCIAL', 'METRICA', 'REGISTRADO POR']);
      }
      var values = bdSheet.getDataRange().getValues();
      var colIdx = -1;
      var cat = data.category;

      var catHeaderSearch = {
        'obras': 'OBRA',
        'sectores': 'SECTOR',
        'agrupaciones': 'AGRUPAC',
        'disciplinas': 'DISCIPLIN',
        'razonesSociales': 'RAZON',
        'metricas': 'METRIC',
        'registradores': 'REGISTRAD'
      };
      var searchKey = catHeaderSearch[cat] || (cat ? cat.toUpperCase() : '');

      if (values.length > 0) {
        var headerRow = values[0];
        for (var c = 0; c < headerRow.length; c++) {
          if (String(headerRow[c] || '').trim().toUpperCase().indexOf(searchKey) !== -1) {
            colIdx = c;
            break;
          }
        }
      }

      if (colIdx === -1) {
        var defaultCols = { 'obras': 0, 'sectores': 1, 'agrupaciones': 2, 'disciplinas': 3, 'razonesSociales': 4, 'metricas': 5, 'registradores': 6 };
        colIdx = defaultCols[cat] !== undefined ? defaultCols[cat] : 0;
      }

      var col1Based = colIdx + 1;
      if (data.value) {
        var valToInsert = String(data.value).trim();
        var lastR = Math.max(bdSheet.getLastRow(), 1);
        var existing = bdSheet.getRange(1, col1Based, lastR, 1).getValues().map(function(row){ return String(row[0]).trim().toUpperCase(); });
        if (existing.indexOf(valToInsert.toUpperCase()) === -1) {
          var targetRow = 2;
          while (bdSheet.getRange(targetRow, col1Based).getValue() !== '') {
            targetRow++;
          }
          bdSheet.getRange(targetRow, col1Based).setValue(valToInsert);
        }
      }
      return jsonResponse({ result: 'success' });
    }

    // 5. REGISTRAR GASTOS EN LA HOJA PRINCIPAL
    var mainSheet = ss.getSheetByName(data.sheetName || 'Control_Gastos') || ss.getActiveSheet();
    var rows = data.rows || (data.row ? [data.row] : []);
    for (var i = 0; i < rows.length; i++) {
      try {
        var prevRowIndex = mainSheet.getLastRow();
        mainSheet.appendRow(rows[i]);
        var newRowIndex = mainSheet.getLastRow();

        // Opcional: Copiar fórmulas si existen en la fila anterior (sin detener si falla)
        if (prevRowIndex >= 2) {
          try {
            [19, 20, 21, 22].forEach(function(cIdx) {
              try {
                var sourceCell = mainSheet.getRange(prevRowIndex, cIdx);
                if (sourceCell && typeof sourceCell.hasFormula === 'function' && sourceCell.hasFormula()) {
                  sourceCell.copyTo(mainSheet.getRange(newRowIndex, cIdx));
                }
              } catch(fErr) {}
            });
          } catch(cErr) {}
        }
      } catch(rowErr) {
        // Si ocurre un detalle en una fila, continúa con las demás filas de la factura
      }
    }
    return jsonResponse({ result: 'success', added: rows.length });

  } catch(error) {
    return jsonResponse({ result: 'error', error: error.message });
  }
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}`;

  const copyScript = () => {
    navigator.clipboard.writeText(appsScriptCode);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2500);
  };

  if (!isOpen) return null;

  const isConnected = Boolean(webAppUrl.trim() || (spreadsheetId.trim() && accessToken.trim()));

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden my-8">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base tracking-wide flex items-center gap-2">
                <span>Conectar con Google Sheets</span>
                {isConnected && (
                  <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] px-2 py-0.5 rounded-full font-mono uppercase font-bold">
                    Conectado
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400">
                Sincroniza automáticamente los registros con tu archivo principal
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Server-Wide Central Connection Info Banner */}
          <div className="bg-indigo-50/80 dark:bg-indigo-950/50 p-4 rounded-xl border border-indigo-200 dark:border-indigo-800 flex items-start gap-3">
            <Info className="w-5 h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-indigo-900 dark:text-indigo-200 space-y-1">
              <p className="font-bold">⚡ Conexión Centralizada e Instantánea:</p>
              <p>
                Una vez configurada la URL o ID aquí, <strong>se guardará en el servidor central de la aplicación</strong>. Todos los usuarios que ingresen a la App registrarán automáticamente sus facturas en esta misma plantilla de Google Sheets <strong>sin tener que ingresar o pegar ninguna URL</strong>.
              </p>
            </div>
          </div>

          {/* Status Message Alert */}
          {statusMsg && (
            <div
              className={`p-4 rounded-xl border flex items-start gap-3 ${
                statusMsg.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                  : 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
              }`}
            >
              {statusMsg.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
              )}
              <div className="text-xs font-medium leading-relaxed whitespace-pre-line">{statusMsg.text}</div>
            </div>
          )}

          {/* Connection Mode Tabs */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 gap-4">
            <button
              onClick={() => setActiveTab('webapp')}
              className={`pb-3 text-xs font-bold uppercase tracking-wider transition-colors relative flex items-center gap-2 ${
                activeTab === 'webapp'
                  ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Code2 className="w-4 h-4" />
              <span>Google Web App (Recomendado)</span>
            </button>

            <button
              onClick={() => setActiveTab('api')}
              className={`pb-3 text-xs font-bold uppercase tracking-wider transition-colors relative flex items-center gap-2 ${
                activeTab === 'api'
                  ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>ID de Hoja + Access Token</span>
            </button>
          </div>

          {/* MODE 1: GOOGLE WEB APP */}
          {activeTab === 'webapp' && (
            <div className="space-y-4">
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                  URL de la Web App de Google Apps Script:
                </label>
                <input
                  type="url"
                  value={webAppUrl}
                  onChange={(e) => setWebAppUrl(e.target.value)}
                  placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
                  className="w-full text-xs font-mono p-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Esta URL conecta este formulario directamente con la pestaña activa de tu libro de Google Sheets sin requerir contraseñas o tokens temporales.
                </p>
              </div>

              {/* Step by step guide toggle */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <button
                  onClick={() => setShowInstructions(!showInstructions)}
                  className="w-full bg-slate-100 dark:bg-slate-800/80 p-3.5 text-left text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    Instrucciones: ¿Cómo obtener la URL de mi Google Sheet en 1 minuto?
                  </span>
                  <span className="text-indigo-600 dark:text-indigo-400 text-[11px]">
                    {showInstructions ? 'Ocultar pasas' : 'Ver pasos'}
                  </span>
                </button>

                {showInstructions && (
                  <div className="p-4 space-y-3 text-xs text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
                    <ol className="list-decimal pl-4 space-y-2 leading-relaxed">
                      <li>
                        Abre tu archivo principal en Google Sheets y en el menú superior ve a: <strong>Extensiones &gt; Apps Script</strong>.
                      </li>
                      <li>
                        Borra lo que aparezca y pega este código exacto:
                        <div className="mt-2 relative">
                          <pre className="bg-slate-900 text-emerald-400 font-mono text-[11px] p-3 rounded-lg overflow-x-auto border border-slate-800">
                            {appsScriptCode}
                          </pre>
                          <button
                            type="button"
                            onClick={copyScript}
                            className="absolute top-2 right-2 bg-slate-800 hover:bg-slate-700 text-white text-[10px] px-2.5 py-1.5 rounded-md flex items-center gap-1 border border-slate-700 transition-colors"
                          >
                            {copiedScript ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedScript ? '¡Copiado!' : 'Copiar código'}</span>
                          </button>
                        </div>
                      </li>
                      <li>
                        Haz clic en <strong>Implantar (Deploy) &gt; Nueva implantación</strong>.
                      </li>
                      <li>
                        Selecciona el tipo: <strong>Aplicación web (Web App)</strong>.
                      </li>
                      <li className="bg-amber-50 dark:bg-amber-950/40 p-2 rounded-lg border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200">
                        <strong>¡MUY IMPORTANTE (Evita error 401)!</strong> En <i>"Quién tiene acceso" (Who has access)</i> selecciona obligatoriamente: <strong>Cualquiera (Anyone)</strong>.
                      </li>
                      <li>
                        Haz clic en <strong>Implantar</strong>, autoriza los permisos y copia la <strong>URL de la Aplicación web</strong> en el campo de arriba.
                      </li>
                    </ol>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* MODE 2: DIRECT SHEETS API */}
          {activeTab === 'api' && (
            <div className="space-y-4">
              <div className="space-y-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                <div>
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1">
                    ID o URL de la Hoja de Cálculo de Google:
                  </label>
                  <input
                    type="text"
                    value={spreadsheetId}
                    onChange={(e) => {
                      const input = e.target.value.trim();
                      const match = input.match(/\/d\/([a-zA-Z0-9-_]+)/);
                      setSpreadsheetId(match ? match[1] : input);
                    }}
                    placeholder="Pega la URL o ID de tu Google Sheet (ej: 1BxiMVs...)"
                    className="w-full text-xs font-mono p-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1">
                      Nombre de la pestaña:
                    </label>
                    <input
                      type="text"
                      value={sheetName}
                      onChange={(e) => setSheetName(e.target.value)}
                      placeholder="Hoja 1"
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1">
                      Google OAuth Access Token:
                    </label>
                    <input
                      type="password"
                      value={accessToken}
                      onChange={(e) => setAccessToken(e.target.value)}
                      placeholder="ya29.a0A..."
                      className="w-full text-xs font-mono p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Footer Buttons */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-end gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testing || loading}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                <Send className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>{testing ? 'Probando...' : 'Probar Conexión'}</span>
              </button>

              <button
                type="button"
                onClick={handleSaveConfig}
                disabled={loading}
                className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-indigo-600/30 transition-all disabled:opacity-50"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Guardar</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

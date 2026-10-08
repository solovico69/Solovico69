import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { INITIAL_GASTOS } from './src/data/initialGastos';
import { INITIAL_BD_OPTIONS } from './src/data/initialBd';

const DATA_DIR = path.join(process.cwd(), 'data');
const GASTOS_FILE = path.join(DATA_DIR, 'gastos.json');
const BD_FILE = path.join(DATA_DIR, 'bd_options.json');
const SHEETS_CONFIG_FILE = path.join(DATA_DIR, 'sheets_config.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize files if not exist
if (!fs.existsSync(GASTOS_FILE)) {
  fs.writeFileSync(GASTOS_FILE, JSON.stringify(INITIAL_GASTOS, null, 2), 'utf-8');
}

if (!fs.existsSync(BD_FILE)) {
  fs.writeFileSync(BD_FILE, JSON.stringify(INITIAL_BD_OPTIONS, null, 2), 'utf-8');
}

// Interface & Helper functions for Google Sheets config
interface SheetsConfig {
  spreadsheetId?: string;
  sheetName?: string;
  webAppUrl?: string;
  accessToken?: string;
  autoSync?: boolean;
}

function getSheetsConfig(): SheetsConfig {
  try {
    if (fs.existsSync(SHEETS_CONFIG_FILE)) {
      return JSON.parse(fs.readFileSync(SHEETS_CONFIG_FILE, 'utf-8'));
    }
  } catch (err) {
    console.error('Error reading sheets config:', err);
  }
  return {
    spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID || '',
    sheetName: process.env.GOOGLE_SHEET_NAME || 'Hoja 1',
    webAppUrl: process.env.GOOGLE_WEB_APP_URL || '',
    accessToken: process.env.GOOGLE_ACCESS_TOKEN || '',
    autoSync: true,
  };
}

function saveSheetsConfig(config: SheetsConfig) {
  fs.writeFileSync(SHEETS_CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
}

function formatItemsForSheets(items: any[]) {
  return items.map((item) => {
    const isFotos = Boolean(
      item.tieneFotos ||
      (item.fotos && item.fotos.length > 0) ||
      (item.fotosUrl && item.fotosUrl !== 'FALSE')
    );

    let photoColValue = isFotos ? 'TRUE' : 'FALSE';
    if (item.fotosUrl && item.fotosUrl !== 'TRUE' && item.fotosUrl !== 'FALSE') {
      photoColValue = item.fotosUrl;
    } else if (item.fotos && Array.isArray(item.fotos)) {
      const urls = item.fotos.map((f: any) => f.driveUrl || f.url).filter(Boolean);
      if (urls.length > 0) photoColValue = urls.join(', ');
    }

    return [
      item.obra || '',                                           // A (1) - OBRA
      item.sector || '',                                         // B (2) - SECTOR
      item.agrupacion || '',                                     // C (3) - AGRUPACION
      item.fechaFactura || '',                                   // D (4) - FECHA FACTURA
      item.disciplina || '',                                     // E (5) - DISCIPLINA
      item.nFactura || '',                                       // F (6) - N° FACTURA
      item.razonSocial || '',                                    // G (7) - RAZON SOCIAL
      item.descripcion || '',                                    // H (8) - DESCRIPCION
      item.conversion ? 'TRUE' : 'FALSE',                        // I (9) - CONVERSION
      item.binance !== undefined && item.binance !== '' ? Number(item.binance) : '', // J (10) - BINANCE
      item.bcv !== undefined && item.bcv !== '' ? Number(item.bcv) : '',         // K (11) - BCV
      item.metrica || '',                                        // L (12) - METRICA
      item.cantidad !== undefined && item.cantidad !== '' ? Number(item.cantidad) : '', // M (13) - CANTIDAD
      item.preciosUnitariosBs !== undefined && item.preciosUnitariosBs !== '' ? Number(item.preciosUnitariosBs) : '', // N (14) - PRECIOS UNITARIOS BS
      item.preciosUnitariosUsd !== undefined && item.preciosUnitariosUsd !== '' ? Number(item.preciosUnitariosUsd) : '', // O (15) - PRECIOS UNITARIOS USD
      item.ivaSiNo ? 'TRUE' : 'FALSE',                           // P (16) - IVA (SI/NO)
      item.registradoPor || '',                                  // Q (17) - REGISTRADO POR
      photoColValue,                                             // R (18) - FOTOS / LINK DRIVE
    ];
  });
}

// Helpers for Google Drive photo uploads
function formatDateForFilename(dateStr: string): string {
  if (!dateStr) {
    const today = new Date();
    const d = String(today.getDate()).padStart(2, '0');
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const y = today.getFullYear();
    return `${d}-${m}-${y}`;
  }
  // If YYYY-MM-DD
  if (dateStr.includes('-') && dateStr.split('-')[0].length === 4) {
    const [y, m, d] = dateStr.split('-');
    return `${d.padStart(2, '0')}-${m.padStart(2, '0')}-${y}`;
  }
  // If DD/MM/YYYY or D/M/YYYY
  if (dateStr.includes('/')) {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const d = parts[0].padStart(2, '0');
      const m = parts[1].padStart(2, '0');
      const y = parts[2];
      return `${d}-${m}-${y}`;
    }
  }
  return dateStr.replace(/[/:]/g, '-');
}

async function getOrCreateDriveFolder(accessToken: string, folderName = 'Facturas_Gastos_Adjuntos'): Promise<string> {
  const token = accessToken.trim();
  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=name='${encodeURIComponent(folderName)}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
  
  const searchRes = await fetch(searchUrl, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (searchRes.ok) {
    const data = await searchRes.json();
    if (data.files && data.files.length > 0) {
      return data.files[0].id;
    }
  }

  // Create folder if not existing
  const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder'
    })
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`No se pudo crear la carpeta '${folderName}' en Drive: ${errText}`);
  }

  const folderData = await createRes.json();
  return folderData.id;
}

async function uploadFileToDriveFolder(
  accessToken: string,
  folderId: string,
  filename: string,
  base64Data: string,
  mimeType = 'image/jpeg'
): Promise<{ id: string; webViewLink: string }> {
  const token = accessToken.trim();
  const cleanBase64 = base64Data.replace(/^data:image\/\w+;base64,/, '');
  const buffer = Buffer.from(cleanBase64, 'base64');

  const metadata = {
    name: filename,
    parents: [folderId]
  };

  const boundary = 'foo_bar_baz_gto_upload';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const bodyParts = [
    Buffer.from(
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      `Content-Type: ${mimeType}\r\n` +
      'Content-Transfer-Encoding: base64\r\n\r\n'
    ),
    Buffer.from(buffer.toString('base64')),
    Buffer.from(closeDelimiter)
  ];

  const bodyBuffer = Buffer.concat(bodyParts);

  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
      'Content-Length': String(bodyBuffer.length)
    },
    body: bodyBuffer
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Error subiendo '${filename}' a Google Drive: ${errText}`);
  }

  const fileData = await res.json();

  // Try to set public reader permission so link can be viewed
  try {
    await fetch(`https://www.googleapis.com/drive/v3/files/${fileData.id}/permissions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        role: 'reader',
        type: 'anyone'
      })
    });
  } catch (permErr) {
    console.warn('Could not set permissions for file:', fileData.id, permErr);
  }

  return {
    id: fileData.id,
    webViewLink: fileData.webViewLink || `https://drive.google.com/file/d/${fileData.id}/view`
  };
}

async function sendToGoogleSheets(items: any[], config: SheetsConfig) {
  if (!items || items.length === 0) return { success: true, count: 0 };

  const rows = formatItemsForSheets(items);

  // Strategy 1: Google Apps Script Web App URL
  if (config.webAppUrl && config.webAppUrl.trim().startsWith('http')) {
    try {
      const response = await fetch(config.webAppUrl.trim(), {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'append', rows, items, row: rows[0] }),
        redirect: 'follow',
      });

      const text = await response.text();

      // Check if Google returned an HTML login or access denied page
      if (
        text.includes('<!DOCTYPE') ||
        text.includes('<html') ||
        response.status === 401 ||
        response.status === 403
      ) {
        throw new Error(
          'Error de Acceso en Google Apps Script (Error 401).\n' +
          'Tu script requiere autenticación. Para solucionarlo:\n' +
          '1. En Google Sheets ve a Extensiones > Apps Script.\n' +
          '2. Haz clic en "Implantar" (Deploy) > "Nueva implantación".\n' +
          '3. En "Quién tiene acceso" (Who has access), selecciona "Cualquiera" (Anyone).\n' +
          '4. Copia la nueva URL generada y guárdala aquí.'
        );
      }

      if (response.ok) {
        return { success: true, method: 'webAppUrl', count: rows.length };
      } else {
        throw new Error(`Google Web App Error (${response.status}): ${text.slice(0, 150)}`);
      }
    } catch (err: any) {
      console.error('Error syncing to Web App URL:', err);
      throw err;
    }
  }

  // Strategy 2: Google Sheets API v4 using Spreadsheet ID + Access Token
  if (config.spreadsheetId && config.accessToken) {
    let cleanId = config.spreadsheetId.trim();
    const match = cleanId.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (match) {
      cleanId = match[1];
    }

    const sheetName = encodeURIComponent(config.sheetName || 'Hoja 1');
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}/values/${sheetName}:append?valueInputOption=USER_ENTERED`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.accessToken.trim()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: rows,
      }),
    });

    if (response.ok) {
      return { success: true, method: 'googleSheetsApi', count: rows.length };
    } else {
      const errorJson = await response.json().catch(() => ({}));
      throw new Error(errorJson.error?.message || `Google Sheets API Error (${response.status})`);
    }
  }

  throw new Error('Configura la URL de Web App de Google o el ID de Hoja con Token de acceso para conectar con Google Sheets.');
}

// Helpers for syncing BD options with Google Sheets
function parseCsvText(text: string): string[][] {
  const lines = text.split(/\r?\n/);
  return lines.map((line) => {
    const matches: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        matches.push(cur.replace(/^"|"$/g, '').trim());
        cur = '';
      } else {
        cur += char;
      }
    }
    matches.push(cur.replace(/^"|"$/g, '').trim());
    return matches;
  });
}

function buildColumnMapping(headerRow: any[]): Record<string, number> {
  const map: Record<string, number> = {
    obra: 0,
    sector: 1,
    agrupacion: 2,
    fechaFactura: 3,
    disciplina: 4,
    nFactura: 5,
    razonSocial: 6,
    descripcion: 7,
    conversion: 8,
    binance: 9,
    bcv: 10,
    metrica: 11,
    cantidad: 12,
    preciosUnitariosBs: 13,
    preciosUnitariosUsd: 14,
    ivaSiNo: 15,
    registradoPor: 16,
    fotosUrl: 17,
    totalSinIva: 18,
    ivaUsd: 19,
    totalConIva: 20,
    nOrden: 21,
  };

  if (!headerRow || headerRow.length === 0) return map;

  for (let c = 0; c < headerRow.length; c++) {
    const h = String(headerRow[c] || '').trim().toUpperCase();
    if (h.includes('# ORDEN') || h.includes('N° ORDEN') || h.includes('N ORDEN') || h === 'ORDEN') map.nOrden = c;
    else if (h.includes('TOTAL $ CON IVA') || h.includes('TOTAL CON IVA')) map.totalConIva = c;
    else if (h.includes('TOTAL $ SIN IVA') || h.includes('TOTAL SIN IVA')) map.totalSinIva = c;
    else if (h.includes('IVA $$') || h.includes('IVA USD')) map.ivaUsd = c;
    else if (h.includes('IVA SI O NO') || h.includes('IVA (SI/NO)')) map.ivaSiNo = c;
    else if (h.includes('REGISTRADO POR') || h.includes('USUARIO')) map.registradoPor = c;
    else if (h.includes('FOTOS') || h.includes('LINK')) map.fotosUrl = c;
    else if (h.includes('PRECIOS UNITARIOS ($)') || h.includes('PRECIO USD')) map.preciosUnitariosUsd = c;
    else if (h.includes('PRECIOS UNITARIOS (BS)') || h.includes('PRECIO BS')) map.preciosUnitariosBs = c;
    else if (h.includes('CANTIDAD')) map.cantidad = c;
    else if (h.includes('METRICA') || h.includes('UNIDAD')) map.metrica = c;
    else if (h.includes('BCV')) map.bcv = c;
    else if (h.includes('BINANCE')) map.binance = c;
    else if (h.includes('CONVERSION')) map.conversion = c;
    else if (h.includes('DESCRIPCION') || h.includes('CONCEPTO')) map.descripcion = c;
    else if (h.includes('RAZON SOCIAL') || h.includes('PROVEEDOR')) map.razonSocial = c;
    else if (h.includes('N° FACTURA') || h.includes('N FACTURA')) map.nFactura = c;
    else if (h.includes('DISCIPLINA')) map.disciplina = c;
    else if (h.includes('FECHA FACTURA')) map.fechaFactura = c;
    else if (h.includes('FECHA') && !h.includes('CORTE') && !h.includes('CREAT')) map.fechaFactura = c;
    else if (h.includes('AGRUPAC')) map.agrupacion = c;
    else if (h.includes('SECTOR')) map.sector = c;
    else if (h.includes('OBRA')) map.obra = c;
  }

  return map;
}

function parseRowToGasto(row: any[], index: number, colMap: Record<string, number>): any | null {
  if (!row || row.length === 0) return null;

  const getVal = (field: string) => {
    const idx = colMap[field];
    return idx !== undefined && row[idx] !== undefined ? row[idx] : '';
  };

  let nOrden = String(getVal('nOrden') || '').trim();

  if (!nOrden) {
    for (let c = row.length - 1; c >= 0; c--) {
      const val = String(row[c] || '').trim();
      if (val.toUpperCase().startsWith('GTO-')) {
        nOrden = val;
        break;
      }
    }
  }

  if (nOrden.toUpperCase().includes('ORDEN') && !nOrden.match(/\d/)) {
    return null;
  }

  const obra = String(getVal('obra') || '').trim();
  const sector = String(getVal('sector') || '').trim();
  const agrupacion = String(getVal('agrupacion') || '').trim();
  const fechaFactura = String(getVal('fechaFactura') || '').trim();
  const disciplina = String(getVal('disciplina') || '').trim();
  const nFactura = String(getVal('nFactura') || '').trim();
  const razonSocial = String(getVal('razonSocial') || '').trim();
  const descripcion = String(getVal('descripcion') || '').trim();

  const conversionStr = String(getVal('conversion') || '').trim().toUpperCase();
  const conversion = conversionStr === 'TRUE' || conversionStr === 'VERDADERO' || conversionStr === '1' || conversionStr === 'SI';

  const binanceVal = getVal('binance');
  const binance = binanceVal !== '' && binanceVal !== undefined ? Number(binanceVal) : undefined;

  const bcvVal = getVal('bcv');
  const bcv = bcvVal !== '' && bcvVal !== undefined ? Number(bcvVal) : undefined;

  const metrica = String(getVal('metrica') || '').trim();
  const cantidad = Number(getVal('cantidad') || 0);

  const pBsVal = getVal('preciosUnitariosBs');
  const preciosUnitariosBs = pBsVal !== '' && pBsVal !== undefined ? Number(pBsVal) : undefined;

  const pUsdVal = getVal('preciosUnitariosUsd');
  const preciosUnitariosUsd = pUsdVal !== '' && pUsdVal !== undefined ? Number(pUsdVal) : undefined;

  const ivaSiNoStr = String(getVal('ivaSiNo') || '').trim().toUpperCase();
  const ivaSiNo = ivaSiNoStr === 'TRUE' || ivaSiNoStr === 'VERDADERO' || ivaSiNoStr === '1' || ivaSiNoStr === 'SI';

  const registradoPor = String(getVal('registradoPor') || '').trim();
  const fotosUrl = String(getVal('fotosUrl') || '').trim();

  const parseNum = (v: any) => {
    if (typeof v === 'number') return v;
    if (!v) return 0;
    const str = String(v).replace(/\$/g, '').replace(/,/g, '.').trim();
    const parsed = parseFloat(str);
    return isNaN(parsed) ? 0 : parsed;
  };

  const totalSinIva = parseNum(getVal('totalSinIva'));
  const ivaUsd = parseNum(getVal('ivaUsd'));
  const totalConIva = parseNum(getVal('totalConIva'));

  if (!obra && !nOrden && !razonSocial && !descripcion) return null;

  return {
    id: `gst-sheet-${index}-${nOrden || Date.now()}`,
    obra,
    sector,
    agrupacion,
    fechaFactura,
    disciplina,
    nFactura,
    razonSocial,
    descripcion,
    conversion,
    binance,
    bcv,
    metrica,
    cantidad,
    preciosUnitariosBs,
    preciosUnitariosUsd,
    totalSinIva,
    ivaSiNo,
    ivaUsd,
    totalConIva,
    registradoPor,
    nOrden,
    fotosUrl,
    createdAt: new Date().toISOString(),
  };
}

async function fetchGastosFromSheets(config: SheetsConfig): Promise<any[] | null> {
  // Strategy 1: Google Apps Script Web App
  if (config.webAppUrl && config.webAppUrl.trim().startsWith('http')) {
    try {
      const response = await fetch(config.webAppUrl.trim(), {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'getGastos' }),
        redirect: 'follow',
      });

      if (response.ok) {
        const text = await response.text();
        if (!text.includes('<!DOCTYPE') && !text.includes('<html')) {
          const json = JSON.parse(text);
          if (json.rows && Array.isArray(json.rows) && json.rows.length > 0) {
            const colMap = buildColumnMapping(json.rows[0]);
            const parsedItems: any[] = [];
            for (let i = 1; i < json.rows.length; i++) {
              const parsed = parseRowToGasto(json.rows[i], i, colMap);
              if (parsed) parsedItems.push(parsed);
            }
            if (parsedItems.length > 0) {
              return parsedItems;
            }
          }
        }
      }
    } catch (err) {
      console.error('Error fetching gastos via Web App:', err);
    }
  }

  // Strategy 2: Google Sheets API v4
  if (config.spreadsheetId && config.accessToken) {
    try {
      let cleanId = config.spreadsheetId.trim();
      const match = cleanId.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (match) cleanId = match[1];

      const sheetName = encodeURIComponent(config.sheetName || 'Control_Gastos');
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}/values/${sheetName}!A1:Z5000`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${config.accessToken.trim()}` },
      });

      if (response.ok) {
        const json = await response.json();
        const rows: any[][] = json.values || [];
        if (rows.length > 1) {
          const colMap = buildColumnMapping(rows[0]);
          const parsedItems: any[] = [];
          for (let i = 1; i < rows.length; i++) {
            const parsed = parseRowToGasto(rows[i], i, colMap);
            if (parsed) parsedItems.push(parsed);
          }
          if (parsedItems.length > 0) return parsedItems;
        }
      }
    } catch (err) {
      console.error('Error fetching gastos via Sheets API:', err);
    }
  }

  // Strategy 3: Public GViz CSV Export
  if (config.spreadsheetId) {
    try {
      let cleanId = config.spreadsheetId.trim();
      const match = cleanId.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (match) cleanId = match[1];

      const sheetName = encodeURIComponent(config.sheetName || 'Control_Gastos');
      const csvUrl = `https://docs.google.com/spreadsheets/d/${cleanId}/gviz/tq?tqx=out:csv&sheet=${sheetName}`;
      const response = await fetch(csvUrl);
      if (response.ok) {
        const csvText = await response.text();
        if (!csvText.includes('<!DOCTYPE') && !csvText.includes('<html')) {
          const rows = parseCsvText(csvText);
          if (rows.length > 1) {
            const colMap = buildColumnMapping(rows[0]);
            const parsedItems: any[] = [];
            for (let i = 1; i < rows.length; i++) {
              const parsed = parseRowToGasto(rows[i], i, colMap);
              if (parsed) parsedItems.push(parsed);
            }
            if (parsedItems.length > 0) return parsedItems;
          }
        }
      }
    } catch (err) {
      console.error('Error fetching gastos via CSV:', err);
    }
  }

  return null;
}

async function fetchBdFromSheets(config: SheetsConfig): Promise<Record<string, string[]> | null> {
  // Strategy 1: Google Apps Script Web App
  if (config.webAppUrl && config.webAppUrl.trim().startsWith('http')) {
    try {
      const response = await fetch(config.webAppUrl.trim(), {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'getBD' }),
        redirect: 'follow',
      });
      if (response.ok) {
        const text = await response.text();
        if (!text.includes('<!DOCTYPE') && !text.includes('<html')) {
          const json = JSON.parse(text);
          if (json.bd) {
            return json.bd;
          }
        }
      }
    } catch (err) {
      console.error('Error fetching BD from Web App:', err);
    }
  }

  // Strategy 2: Google Sheets API v4
  if (config.spreadsheetId && config.accessToken) {
    try {
      let cleanId = config.spreadsheetId.trim();
      const match = cleanId.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (match) cleanId = match[1];

      const url = `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}/values/BD!A1:Z500`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${config.accessToken.trim()}` },
      });

      if (response.ok) {
        const json = await response.json();
        const rows: any[][] = json.values || [];
        const result: Record<string, string[]> = {
          obras: [],
          sectores: [],
          agrupaciones: [],
          disciplinas: [],
          razonesSociales: [],
          metricas: [],
          registradores: [],
        };
        const categories = [
          'obras', 'sectores', 'agrupaciones', 'disciplinas', 'razonesSociales', 'metricas', 'registradores'
        ];

        // Dynamic header column map
        const colMap: Record<string, number> = {};
        if (rows.length > 0) {
          const headerRow = rows[0];
          for (let c = 0; c < headerRow.length; c++) {
            const h = String(headerRow[c] || '').trim().toUpperCase();
            if (h.includes('OBRA')) colMap['obras'] = c;
            else if (h.includes('SECTOR')) colMap['sectores'] = c;
            else if (h.includes('AGRUPAC') || h.includes('CONCEPTO')) colMap['agrupaciones'] = c;
            else if (h.includes('DISCIPLIN')) colMap['disciplinas'] = c;
            else if (h.includes('RAZON') || h.includes('PROVEEDOR')) colMap['razonesSociales'] = c;
            else if (h.includes('METRIC') || h.includes('UNIDAD')) colMap['metricas'] = c;
            else if (h.includes('REGISTRAD') || h.includes('USUARIO')) colMap['registradores'] = c;
          }
        }

        // Fallback default columns if not found in header
        if (colMap['obras'] === undefined) colMap['obras'] = 0;
        if (colMap['sectores'] === undefined) colMap['sectores'] = 1;
        if (colMap['agrupaciones'] === undefined) colMap['agrupaciones'] = 2;
        if (colMap['disciplinas'] === undefined) colMap['disciplinas'] = 3;
        if (colMap['razonesSociales'] === undefined) colMap['razonesSociales'] = 4;
        if (colMap['metricas'] === undefined) colMap['metricas'] = 5;
        if (colMap['registradores'] === undefined) colMap['registradores'] = 6;

        for (let r = 1; r < rows.length; r++) {
          for (const cat of categories) {
            const colIdx = colMap[cat];
            if (colIdx !== undefined && rows[r][colIdx] !== undefined && rows[r][colIdx] !== null) {
              const strVal = String(rows[r][colIdx]).trim();
              if (strVal !== '' && !result[cat].some((item) => item.toUpperCase() === strVal.toUpperCase())) {
                result[cat].push(strVal);
              }
            }
          }
        }
        return result;
      }
    } catch (err) {
      console.error('Error fetching BD from Sheets API:', err);
    }
  }

  return null;
}

async function sendBdOptionToSheets(category: string, value: string, config: SheetsConfig) {
  if (!category || !value) return;

  // Strategy 1: Web App
  if (config.webAppUrl && config.webAppUrl.trim().startsWith('http')) {
    try {
      await fetch(config.webAppUrl.trim(), {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'addBD', category, value: value.trim() }),
        redirect: 'follow',
      });
      return;
    } catch (err) {
      console.error('Error adding BD option via Web App:', err);
    }
  }

  // Strategy 2: Sheets API
  if (config.spreadsheetId && config.accessToken) {
    try {
      let cleanId = config.spreadsheetId.trim();
      const match = cleanId.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (match) cleanId = match[1];

      // Fetch row 1 header to find exact column
      const headerUrl = `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}/values/BD!A1:Z1`;
      const resHeader = await fetch(headerUrl, {
        headers: { Authorization: `Bearer ${config.accessToken.trim()}` },
      });

      let colLetter = '';
      const fallbackMap: Record<string, string> = {
        obras: 'A', sectores: 'B', agrupaciones: 'C',
        disciplinas: 'D', razonesSociales: 'E', metricas: 'F', registradores: 'G'
      };

      const searchKeys: Record<string, string> = {
        obras: 'OBRA', sectores: 'SECTOR', agrupaciones: 'AGRUPAC',
        disciplinas: 'DISCIPLIN', razonesSociales: 'RAZON', metricas: 'METRIC', registradores: 'REGISTRAD'
      };

      if (resHeader.ok) {
        const jsonHeader = await resHeader.json();
        const headers: string[] = (jsonHeader.values && jsonHeader.values[0]) || [];
        const searchKey = searchKeys[category] || category.toUpperCase();
        for (let i = 0; i < headers.length; i++) {
          if (String(headers[i]).trim().toUpperCase().includes(searchKey)) {
            colLetter = String.fromCharCode(65 + i);
            break;
          }
        }
      }

      if (!colLetter) {
        colLetter = fallbackMap[category] || 'A';
      }

      const url = `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}/values/BD!${colLetter}1:append?valueInputOption=USER_ENTERED`;
      await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.accessToken.trim()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ values: [[value.trim()]] }),
      });
    } catch (err) {
      console.error('Error adding BD option via Sheets API:', err);
    }
  }
}

function mergeBdOptions(local: any, remote: any) {
  const categories = ['obras', 'sectores', 'agrupaciones', 'disciplinas', 'razonesSociales', 'metricas', 'registradores'];
  const merged: any = { ...local };

  for (const cat of categories) {
    const localArr: string[] = Array.isArray(local[cat]) ? local[cat] : [];
    const remoteArr: string[] = Array.isArray(remote[cat]) ? remote[cat] : [];
    const combined = [...localArr];

    for (const item of remoteArr) {
      const clean = String(item).trim();
      if (clean && !combined.some(x => x.toUpperCase() === clean.toUpperCase())) {
        combined.push(clean);
      }
    }
    merged[cat] = combined;
  }

  return merged;
}

// Helper functions for reading/writing storage
function getGastosData() {
  try {
    const content = fs.readFileSync(GASTOS_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    console.error('Error reading gastos file, returning initial:', err);
    return INITIAL_GASTOS;
  }
}

function saveGastosData(data: any[]) {
  fs.writeFileSync(GASTOS_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

function getBdData() {
  try {
    const content = fs.readFileSync(BD_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    console.error('Error reading BD file, returning initial:', err);
    return INITIAL_BD_OPTIONS;
  }
}

function saveBdData(data: any) {
  fs.writeFileSync(BD_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

async function getNextOrdenNumber(): Promise<{ nextOrden: string; maxNum: number }> {
  let sheetLastNum: number | null = null;
  let maxNum = 0;

  // 1. Check Google Sheets Column V (col index 21 / 22nd column) first
  const config = getSheetsConfig();
  if (config.webAppUrl && config.webAppUrl.trim().startsWith('http')) {
    try {
      const response = await fetch(config.webAppUrl.trim(), {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'getLastOrden', sheetName: config.sheetName || 'Control_Gastos' }),
        redirect: 'follow',
      });
      if (response.ok) {
        const text = await response.text();
        if (!text.includes('<!DOCTYPE') && !text.includes('<html')) {
          const json = JSON.parse(text);
          if (json.lastOrden) {
            const m = String(json.lastOrden).match(/(\d+)/);
            if (m) {
              const num = parseInt(m[1], 10);
              if (!isNaN(num)) {
                sheetLastNum = num;
              }
            }
          }
        }
      }
    } catch (webAppErr) {
      console.error('Error fetching max orden from Web App:', webAppErr);
    }
  } else if (config.spreadsheetId && config.accessToken) {
    try {
      let cleanId = config.spreadsheetId.trim();
      const match = cleanId.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (match) cleanId = match[1];

      const sheetName = encodeURIComponent(config.sheetName || 'Control_Gastos');
      // Column V = 22nd column
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}/values/${sheetName}!V1:V5000`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${config.accessToken.trim()}` },
      });

      if (response.ok) {
        const json = await response.json();
        const rows: any[][] = json.values || [];
        for (let r = rows.length - 1; r >= 0; r--) {
          const cellVal = rows[r] && rows[r][0] ? String(rows[r][0]).trim() : '';
          if (cellVal && !cellVal.toUpperCase().includes('ORDEN')) {
            const m = cellVal.match(/(\d+)/);
            if (m) {
              const num = parseInt(m[1], 10);
              if (!isNaN(num)) {
                sheetLastNum = num;
                break;
              }
            }
          }
        }
      }
    } catch (sheetErr) {
      console.error('Error fetching max orden from Google Sheets API:', sheetErr);
    }
  }

  // If Google Sheets provided a last order, use it as the source of truth!
  if (sheetLastNum !== null && sheetLastNum > 0) {
    maxNum = sheetLastNum;
  } else {
    // Fallback: Check local gastos.json
    maxNum = 218; // Default baseline
    try {
      const localGastos = getGastosData();
      if (Array.isArray(localGastos)) {
        for (const g of localGastos) {
          if (g.nOrden) {
            const match = g.nOrden.match(/(\d+)/);
            if (match) {
              const num = parseInt(match[1], 10);
              if (!isNaN(num) && num > maxNum) maxNum = num;
            }
          }
        }
      }
    } catch (err) {
      console.error('Error reading local gastos for max orden:', err);
    }
  }

  const nextNum = maxNum + 1;
  const nextOrden = `GTO-${String(nextNum).padStart(7, '0')}`;
  return { nextOrden, maxNum };
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // Upload photos to Google Drive
  app.post('/api/drive/upload-photos', async (req, res) => {
    try {
      const { photos, fechaFactura, nOrden, accessToken } = req.body;

      if (!photos || !Array.isArray(photos) || photos.length === 0) {
        return res.status(400).json({ error: 'No se recibieron fotos para subir' });
      }

      const config = getSheetsConfig();
      const token = (accessToken || config.accessToken || '').trim();
      const webAppUrl = (config.webAppUrl || '').trim();

      const datePart = formatDateForFilename(fechaFactura);
      const ordenPart = (nOrden || 'GTO-0000001').replace(/[/\\?%*:|"<>]/g, '-');

      const uploadedResults: any[] = [];

      // Strategy 1: Google Drive API v3 via Access Token
      if (token) {
        let folderId = '';
        try {
          folderId = await getOrCreateDriveFolder(token, 'Facturas_Gastos_Adjuntos');
        } catch (folderErr: any) {
          console.error('Error getting/creating Drive folder via token:', folderErr);
        }

        if (folderId) {
          for (let i = 0; i < photos.length; i++) {
            const photo = photos[i];
            if (!photo.base64) continue;

            let ext = 'jpg';
            if (photo.name && photo.name.includes('.')) {
              ext = photo.name.split('.').pop()?.toLowerCase() || 'jpg';
            }
            if (ext === 'jpeg') ext = 'jpg';

            const standardizedName = `${datePart}_${ordenPart}_${i + 1}.${ext}`;
            const mimeType = photo.mimeType || (ext === 'png' ? 'image/png' : 'image/jpeg');

            try {
              const driveRes = await uploadFileToDriveFolder(token, folderId, standardizedName, photo.base64, mimeType);
              uploadedResults.push({
                id: photo.id || `photo-${Date.now()}-${i}`,
                name: standardizedName,
                driveUrl: driveRes.webViewLink,
                driveFileId: driveRes.id,
                base64: photo.base64,
                mimeType,
              });
            } catch (uploadErr: any) {
              console.error(`Error uploading photo ${standardizedName} via Drive API:`, uploadErr);
            }
          }

          if (uploadedResults.length > 0) {
            return res.json({
              success: true,
              folderName: 'Facturas_Gastos_Adjuntos',
              folderId,
              photos: uploadedResults,
            });
          }
        }
      }

      // Strategy 2: Google Apps Script Web App
      if (webAppUrl && webAppUrl.startsWith('http')) {
        try {
          const webAppRes = await fetch(webAppUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({
              action: 'uploadPhotos',
              fechaFactura,
              nOrden: ordenPart,
              photos: photos.map((p, idx) => {
                let ext = 'jpg';
                if (p.name && p.name.includes('.')) {
                  ext = p.name.split('.').pop()?.toLowerCase() || 'jpg';
                }
                if (ext === 'jpeg') ext = 'jpg';
                return {
                  id: p.id || `photo-${Date.now()}-${idx}`,
                  name: `${datePart}_${ordenPart}_${idx + 1}.${ext}`,
                  base64: p.base64,
                  mimeType: p.mimeType || (ext === 'png' ? 'image/png' : 'image/jpeg'),
                };
              }),
            }),
            redirect: 'follow',
          });

          if (webAppRes.ok) {
            const text = await webAppRes.text();
            if (!text.includes('<!DOCTYPE') && !text.includes('<html')) {
              const json = JSON.parse(text);
              if (json.photos && Array.isArray(json.photos)) {
                return res.json({
                  success: true,
                  folderName: 'Facturas_Gastos_Adjuntos',
                  folderId: json.folderId || '',
                  photos: json.photos,
                });
              }
            }
          }
        } catch (webAppErr) {
          console.error('Error uploading photos via Web App:', webAppErr);
        }
      }

      // Fallback: Local response
      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
        let ext = 'jpg';
        if (photo.name && photo.name.includes('.')) {
          ext = photo.name.split('.').pop()?.toLowerCase() || 'jpg';
        }
        const standardizedName = `${datePart}_${ordenPart}_${i + 1}.${ext}`;
        uploadedResults.push({
          id: photo.id || `photo-${Date.now()}-${i}`,
          name: standardizedName,
          base64: photo.base64,
          mimeType: photo.mimeType || 'image/jpeg',
          notice: 'Se guardó en la App. Copia el código actualizado de Apps Script en Google Sheets para guardar fotos en Drive.',
        });
      }

      return res.json({
        success: true,
        folderName: 'Facturas_Gastos_Adjuntos',
        photos: uploadedResults,
      });

    } catch (error: any) {
      console.error('Error in /api/drive/upload-photos:', error);
      res.status(500).json({ error: error.message || 'Error al procesar las fotos' });
    }
  });

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Calculate next # ORDEN by checking Google Sheets Column X and local DB
  app.get('/api/gastos/next-orden', async (req, res) => {
    try {
      const result = await getNextOrdenNumber();
      res.json(result);
    } catch (error) {
      console.error('Error calculating next orden:', error);
      res.status(500).json({ error: 'Error al calcular el siguiente número de orden' });
    }
  });

  // Sync expenses directly from Google Sheets
  app.post('/api/gastos/sync-from-sheets', async (req, res) => {
    try {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      const config = getSheetsConfig();
      if (!config.webAppUrl && !config.spreadsheetId) {
        return res.status(400).json({ error: 'Google Sheets no está configurado.' });
      }

      const remoteGastos = await fetchGastosFromSheets(config);
      if (remoteGastos && remoteGastos.length > 0) {
        saveGastosData(remoteGastos);
        return res.json({
          message: `¡Historial y base de datos local sincronizada exitosamente con Google Sheets! (${remoteGastos.length} registros cargados)`,
          gastos: remoteGastos,
          count: remoteGastos.length,
        });
      }

      const localData = getGastosData();
      res.json({
        message: 'Sincronización finalizada con la base local.',
        gastos: localData,
        count: localData.length,
      });
    } catch (error: any) {
      console.error('Error en sync-from-sheets:', error);
      res.status(500).json({ error: error.message || 'Error al sincronizar con Google Sheets' });
    }
  });

  // Get all expenses (deshabilitar caché de navegador para garantizar lectura real)
  app.get('/api/gastos', async (req, res) => {
    try {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');

      const config = getSheetsConfig();
      if ((config.webAppUrl || config.spreadsheetId) && req.query.sync === 'true') {
        const remote = await fetchGastosFromSheets(config);
        if (remote && remote.length > 0) {
          saveGastosData(remote);
        }
      }

      const data = getGastosData();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener los datos de gastos' });
    }
  });

  // Read-only endpoint for Historial de las Últimas 5 Órdenes
  app.get('/api/gastos/historial', async (req, res) => {
    try {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');

      const config = getSheetsConfig();
      if (config.webAppUrl || config.spreadsheetId) {
        const remote = await fetchGastosFromSheets(config);
        if (remote && remote.length > 0) {
          saveGastosData(remote);
        }
      }

      const data = getGastosData() || [];
      const last5Codes: string[] = [];
      const seen = new Set<string>();

      // Recorrer de abajo hacia arriba la hoja
      for (let i = data.length - 1; i >= 0; i--) {
        const code = data[i].nOrden?.trim();
        if (code && !seen.has(code)) {
          seen.add(code);
          last5Codes.push(code);
          if (last5Codes.length === 5) break;
        }
      }

      const history = last5Codes.map((code) => {
        const items = data.filter((g: any) => g.nOrden?.trim() === code);
        const first = items[0] || {};
        const montoTotalConIva = items.reduce((acc: number, curr: any) => acc + (Number(curr.totalConIva) || 0), 0);
        return {
          nOrden: code,
          fechaFactura: first.fechaFactura || '',
          razonSocial: first.razonSocial || '',
          obra: first.obra || '',
          sector: first.sector || '',
          agrupacion: first.agrupacion || '',
          disciplina: first.disciplina || '',
          nFactura: first.nFactura || 'S/C',
          registradoPor: first.registradoPor || '',
          montoTotalConIva,
          items,
        };
      });

      res.json(history);
    } catch (error) {
      res.status(500).json({ error: 'Error al procesar historial de órdenes' });
    }
  });

  // Get Google Sheets configuration
  app.get('/api/sheets/config', (req, res) => {
    try {
      const config = getSheetsConfig();
      res.json(config);
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener la configuración de Google Sheets' });
    }
  });

  // Save Google Sheets configuration
  app.post('/api/sheets/config', (req, res) => {
    try {
      const { spreadsheetId, sheetName, webAppUrl, accessToken, autoSync } = req.body;
      const config: SheetsConfig = {
        spreadsheetId: (spreadsheetId || '').trim(),
        sheetName: (sheetName || 'Hoja 1').trim(),
        webAppUrl: (webAppUrl || '').trim(),
        accessToken: (accessToken || '').trim(),
        autoSync: autoSync !== undefined ? Boolean(autoSync) : true,
      };
      saveSheetsConfig(config);
      res.json({ message: 'Configuración de Google Sheets guardada exitosamente', config });
    } catch (error) {
      res.status(500).json({ error: 'Error al guardar la configuración de Google Sheets' });
    }
  });

  // Test connection to Google Sheets
  app.post('/api/sheets/test', async (req, res) => {
    try {
      const config = req.body.spreadsheetId || req.body.webAppUrl ? req.body : getSheetsConfig();
      const testItem = {
        obra: 'PRUEBA CONEXIÓN',
        sector: 'TEST',
        agrupacion: 'SISTEMA',
        fechaFactura: new Date().toISOString().split('T')[0],
        disciplina: 'PRUEBA',
        nFactura: '000',
        razonSocial: 'SISTEMA CONTROL GASTOS',
        descripcion: 'Registro de prueba de conexión a Google Sheets',
        conversion: false,
        metrica: 'UND',
        cantidad: 1,
        preciosUnitariosBs: 0,
        preciosUnitariosUsd: 0,
        totalSinIva: 0,
        ivaSiNo: false,
        ivaUsd: 0,
        totalConIva: 0,
        registradoPor: 'SISTEMA',
        fechaCorte: new Date().toISOString().split('T')[0],
        mes: 'TEST',
        ano: new Date().getFullYear(),
      };

      const result = await sendToGoogleSheets([testItem], config);
      res.json({
        message: '¡Conexión exitosa! Se envió una fila de prueba a tu archivo de Google Sheets.',
        result,
      });
    } catch (error: any) {
      console.error('Test sheets connection error:', error);
      res.status(400).json({
        error: error.message || 'No se pudo conectar con Google Sheets. Verifica la URL de la Web App o las credenciales.',
      });
    }
  });

  // Sync all local records to Google Sheets
  app.post('/api/sheets/sync', async (req, res) => {
    try {
      const config = getSheetsConfig();
      const gastos = getGastosData();
      if (!gastos || gastos.length === 0) {
        return res.json({ message: 'No hay registros locales para sincronizar', count: 0 });
      }

      const result = await sendToGoogleSheets(gastos, config);
      res.json({
        message: `¡Sincronización completada! Se enviaron ${gastos.length} registros a tu archivo de Google Sheets.`,
        result,
        count: gastos.length,
      });
    } catch (error: any) {
      console.error('Sync all to sheets error:', error);
      res.status(400).json({
        error: error.message || 'Error al sincronizar con Google Sheets.',
      });
    }
  });

  // Create new expense(s) - Supports single record or array of records
  app.post('/api/gastos', async (req, res) => {
    try {
      const current = getGastosData();
      const payload = req.body;
      const newItems = Array.isArray(payload) ? payload : [payload];

      const validatedItems = newItems.map((item) => ({
        id: item.id || `gst-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        obra: item.obra || '',
        sector: item.sector || '',
        agrupacion: item.agrupacion || '',
        fechaFactura: item.fechaFactura || new Date().toISOString().split('T')[0],
        disciplina: item.disciplina || '',
        nFactura: item.nFactura || '',
        razonSocial: item.razonSocial || '',
        descripcion: item.descripcion || '',
        conversion: Boolean(item.conversion),
        binance: item.binance !== undefined && item.binance !== '' ? Number(item.binance) : undefined,
        bcv: item.bcv !== undefined && item.bcv !== '' ? Number(item.bcv) : undefined,
        metrica: item.metrica || '',
        cantidad: Number(item.cantidad || 0),
        preciosUnitariosBs: item.preciosUnitariosBs !== undefined && item.preciosUnitariosBs !== '' ? Number(item.preciosUnitariosBs) : undefined,
        preciosUnitariosUsd: item.preciosUnitariosUsd !== undefined && item.preciosUnitariosUsd !== '' ? Number(item.preciosUnitariosUsd) : undefined,
        totalSinIva: Number(item.totalSinIva || 0),
        ivaSiNo: Boolean(item.ivaSiNo),
        ivaUsd: Number(item.ivaUsd || 0),
        totalConIva: Number(item.totalConIva || 0),
        registradoPor: item.registradoPor || '',
        fechaCorte: item.fechaCorte || '',
        mes: item.mes || '',
        ano: item.ano || new Date().getFullYear(),
        nOrden: item.nOrden || '',
        tieneFotos: Boolean(item.tieneFotos || (item.fotos && item.fotos.length > 0) || item.fotosUrl),
        fotosUrl: item.fotosUrl || '',
        fotos: item.fotos || [],
        createdAt: item.createdAt || new Date().toISOString(),
      }));

      const updated = [...validatedItems, ...current];
      saveGastosData(updated);

      // Attempt sync to Google Sheets if configured
      let sheetsSynced = false;
      let sheetsError = '';
      const sheetsConfig = getSheetsConfig();

      if (sheetsConfig.webAppUrl || (sheetsConfig.spreadsheetId && sheetsConfig.accessToken)) {
        try {
          await sendToGoogleSheets(validatedItems, sheetsConfig);
          sheetsSynced = true;
        } catch (sErr: any) {
          console.error('Auto sync to Google Sheets failed:', sErr);
          sheetsError = sErr.message || 'Fallo al enviar a Google Sheets';
        }
      }

      // Check for new BD options in saved expenses and sync them to BD sheet
      const fieldCatMap: Record<string, string> = {
        obra: 'obras',
        sector: 'sectores',
        agrupacion: 'agrupaciones',
        disciplina: 'disciplinas',
        razonSocial: 'razonesSociales',
        metrica: 'metricas',
        registradoPor: 'registradores',
      };

      const bd = getBdData();
      let bdUpdated = false;

      for (const item of validatedItems) {
        for (const [field, cat] of Object.entries(fieldCatMap)) {
          const val = ((item as any)[field] || '').trim();
          if (val && Array.isArray(bd[cat])) {
            if (!bd[cat].some((x: string) => x.toUpperCase() === val.toUpperCase())) {
              bd[cat].push(val);
              bdUpdated = true;
              if (sheetsConfig.webAppUrl || (sheetsConfig.spreadsheetId && sheetsConfig.accessToken)) {
                sendBdOptionToSheets(cat, val, sheetsConfig).catch((e) =>
                  console.error(`Error auto-syncing new option ${val} to BD:`, e)
                );
              }
            }
          }
        }
      }

      if (bdUpdated) {
        saveBdData(bd);
      }

      res.status(201).json({
        message: sheetsSynced
          ? 'Registros guardados en local y sincronizados con Google Sheets exitosamente'
          : 'Registros guardados exitosamente en la base local',
        count: validatedItems.length,
        items: validatedItems,
        sheetsSynced,
        sheetsError,
        bd,
      });
    } catch (error) {
      console.error('Error saving gastos:', error);
      res.status(500).json({ error: 'Fallo al guardar la información en el archivo' });
    }
  });

  // Delete an expense by ID
  app.delete('/api/gastos/:id', (req, res) => {
    try {
      const { id } = req.params;
      const current = getGastosData();
      const updated = current.filter((item: any) => item.id !== id);
      saveGastosData(updated);
      res.json({ message: 'Registro eliminado exitosamente', id });
    } catch (error) {
      res.status(500).json({ error: 'Error al eliminar el registro' });
    }
  });

  // Get dropdown options (BD) - Reads from Google Sheets BD tab if connected
  app.get('/api/bd', async (req, res) => {
    try {
      let bd = getBdData();
      const config = getSheetsConfig();

      if (config.webAppUrl || (config.spreadsheetId && config.accessToken)) {
        const remoteBd = await fetchBdFromSheets(config);
        if (remoteBd) {
          const hasRemoteData = Object.values(remoteBd).some((arr) => Array.isArray(arr) && arr.length > 0);
          if (hasRemoteData) {
            bd = remoteBd;
          } else {
            bd = mergeBdOptions(bd, remoteBd);
          }
          saveBdData(bd);
        }
      }

      res.json(bd);
    } catch (error) {
      res.status(500).json({ error: 'Error al cargar opciones de base de datos' });
    }
  });

  // Add new option to BD - Saves locally and sends to Google Sheets BD tab
  app.post('/api/bd', async (req, res) => {
    try {
      const { category, value } = req.body; // e.g., category: 'obras', value: 'NUEVA OBRA'
      if (!category || !value) {
        return res.status(400).json({ error: 'Categoría y valor son requeridos' });
      }

      const valTrim = value.trim();
      const bd = getBdData();

      if (Array.isArray(bd[category])) {
        if (!bd[category].some((x: string) => x.toUpperCase() === valTrim.toUpperCase())) {
          bd[category].push(valTrim);
          saveBdData(bd);
        }
      }

      const config = getSheetsConfig();
      if (config.webAppUrl || (config.spreadsheetId && config.accessToken)) {
        await sendBdOptionToSheets(category, valTrim, config);
      }

      res.json({ message: 'Opción agregada exitosamente', bd });
    } catch (error) {
      res.status(500).json({ error: 'Error al guardar la opción en la base de datos' });
    }
  });

  // Delete an option from BD
  app.delete('/api/bd', (req, res) => {
    try {
      const { category, value } = req.body;
      if (!category || !value) {
        return res.status(400).json({ error: 'Categoría y valor son requeridos' });
      }

      const bd = getBdData();
      if (Array.isArray(bd[category])) {
        bd[category] = bd[category].filter(
          (x: string) => x.toUpperCase() !== value.trim().toUpperCase()
        );
        saveBdData(bd);
      }

      res.json({ message: 'Opción eliminada exitosamente', bd });
    } catch (error) {
      res.status(500).json({ error: 'Error al eliminar la opción de la base de datos' });
    }
  });

  // Clear all local BD options
  app.post('/api/bd/clear', (req, res) => {
    try {
      const emptyBd = {
        obras: [],
        sectores: [],
        agrupaciones: [],
        disciplinas: [],
        razonesSociales: [],
        metricas: [],
        registradores: [],
      };
      saveBdData(emptyBd);
      res.json({ message: 'Base de datos local limpiada correctamente', bd: emptyBd });
    } catch (error) {
      res.status(500).json({ error: 'Error al limpiar la base de datos local' });
    }
  });

  // Full 2-way sync / replace of BD options with Google Sheets
  app.post('/api/bd/sync', async (req, res) => {
    try {
      const config = getSheetsConfig();

      if (config.webAppUrl || (config.spreadsheetId && config.accessToken)) {
        const remoteBd = await fetchBdFromSheets(config);
        if (remoteBd) {
          saveBdData(remoteBd);
          return res.json({ message: 'Base de datos reemplazada y sincronizada con Google Sheets exitosamente', bd: remoteBd });
        }
      }

      const bd = getBdData();
      res.json({ message: 'Base de datos sincronizada', bd });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Error al sincronizar opciones de base de datos' });
    }
  });

  // Export CSV
  app.get('/api/export/csv', (req, res) => {
    try {
      const gastos = getGastosData();
      const headers = [
        'OBRA',
        'SECTOR',
        'AGRUPACIÓN',
        'FECHA FACTURA',
        'DISCIPLINA',
        'N° FACTURA',
        'RAZÓN SOCIAL',
        'DESCRIPCIÓN',
        'Conversion?',
        'BINANCE',
        'BCV',
        'METRICA',
        'CANTIDAD',
        'PRECIOS UNITARIOS (BS)',
        'PRECIOS UNITARIOS ($)',
        'TOTAL $ SIN IVA',
        'IVA si o no',
        'IVA $$',
        'TOTAL $ CON IVA',
        'REGISTRADO POR',
        'FECHA CORTE',
        'MES',
        'ANO',
      ];

      const csvRows = [headers.join(',')];

      for (const item of gastos) {
        const row = [
          `"${(item.obra || '').replace(/"/g, '""')}"`,
          `"${(item.sector || '').replace(/"/g, '""')}"`,
          `"${(item.agrupacion || '').replace(/"/g, '""')}"`,
          `"${(item.fechaFactura || '').replace(/"/g, '""')}"`,
          `"${(item.disciplina || '').replace(/"/g, '""')}"`,
          `"${(item.nFactura || '').replace(/"/g, '""')}"`,
          `"${(item.razonSocial || '').replace(/"/g, '""')}"`,
          `"${(item.descripcion || '').replace(/"/g, '""')}"`,
          item.conversion ? 'TRUE' : 'FALSE',
          item.binance !== undefined ? item.binance : '',
          item.bcv !== undefined ? item.bcv : '',
          `"${(item.metrica || '').replace(/"/g, '""')}"`,
          item.cantidad !== undefined ? item.cantidad : '',
          item.preciosUnitariosBs !== undefined ? item.preciosUnitariosBs : '',
          item.preciosUnitariosUsd !== undefined ? item.preciosUnitariosUsd : '',
          item.totalSinIva !== undefined ? item.totalSinIva : '',
          item.ivaSiNo ? 'TRUE' : 'FALSE',
          item.ivaUsd !== undefined ? item.ivaUsd : '',
          item.totalConIva !== undefined ? item.totalConIva : '',
          `"${(item.registradoPor || '').replace(/"/g, '""')}"`,
          `"${(item.fechaCorte || '').replace(/"/g, '""')}"`,
          `"${(item.mes || '').replace(/"/g, '""')}"`,
          item.ano !== undefined ? item.ano : '',
        ];
        csvRows.push(row.join(','));
      }

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="Control_Gastos_Export.csv"');
      res.send(csvRows.join('\n'));
    } catch (error) {
      res.status(500).json({ error: 'Error al exportar los datos' });
    }
  });

  // Vite middleware for development vs Static file serving in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

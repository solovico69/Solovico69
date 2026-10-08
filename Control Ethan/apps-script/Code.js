/**
 * PROYECTO: Control Ethan - Sistema de Inventario y Ventas iPhone
 * DESARROLLO & ARQUITECTURA: Victor Solorzano
 * ASISTENCIA TÉCNICA: Antigravity IDE
 * ROL: Backend Google Apps Script - API REST para Google Sheets
 */

// ID OFICIAL DE LA HOJA DE GOOGLE SHEETS
var SPREADSHEET_ID = "1XA_RhgURM3Kj4DaJ4IRBQQ2R604OsH62kRM3TMJJIRs";

/**
 * Función auxiliar para obtener el libro activo
 */
function getSpreadsheet() {
  if (SPREADSHEET_ID && SPREADSHEET_ID.trim() !== "") {
    try {
      return SpreadsheetApp.openById(SPREADSHEET_ID);
    } catch (e) {
      return SpreadsheetApp.getActiveSpreadsheet();
    }
  }
  return SpreadsheetApp.getActiveSpreadsheet();
}

/**
 * Normaliza nombres de encabezados para búsquedas seguras (sin tildes, minúsculas, trim)
 */
function normalizeHeader(str) {
  if (!str) return "";
  return str.toString()
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/**
 * Busca el índice de columna (1-indexed) por coincidencia exacta o normalizada de encabezado
 */
function findColumnByHeader(headers, targetName) {
  var normTarget = normalizeHeader(targetName);
  for (var i = 0; i < headers.length; i++) {
    if (normalizeHeader(headers[i]) === normTarget) {
      return i + 1; // 1-indexed para SpreadsheetApp
    }
  }
  return -1;
}

/**
 * Manejador de peticiones GET (Lectura de datos y verificación de estado)
 */
function doGet(e) {
  var output = {};
  try {
    var ss = getSpreadsheet();
    var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : "getAllData";

    if (action === "ping") {
      output = { status: "success", message: "Conexión exitosa con Control Ethan API", timestamp: new Date().toISOString() };
    } else if (action === "getAllData") {
      output = {
        status: "success",
        timestamp: new Date().toISOString(),
        resumen: getResumenData(ss),
        catalogo: getCatalogoData(ss),
        entradas: getEntradasData(ss),
        ventas: getVentasData(ss)
      };
    } else if (action === "getCatalogo") {
      output = { status: "success", catalogo: getCatalogoData(ss) };
    } else if (action === "getResumen") {
      output = { status: "success", resumen: getResumenData(ss) };
    } else {
      output = { status: "error", message: "Acción no reconocida: " + action };
    }
  } catch (err) {
    output = { status: "error", message: err.toString(), stack: err.stack };
  }

  return ContentService.createTextOutput(JSON.stringify(output))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Manejador de peticiones POST (Inserción de nuevas entradas o ventas respetando fórmulas)
 */
function doPost(e) {
  var output = {};
  var lock = LockService.getScriptLock();

  // Esperar hasta 30 segundos por el bloqueo para evitar colisiones
  try {
    lock.waitLock(30000);
  } catch (lockError) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: "El servidor está ocupado. Intenta de nuevo en unos segundos."
    })).setMimeType(ContentService.MimeType.JSON);
  }

  try {
    var ss = getSpreadsheet();
    var postData = {};

    if (e && e.postData && e.postData.contents) {
      postData = JSON.parse(e.postData.contents);
    } else if (e && e.parameter) {
      postData = e.parameter;
    }

    var action = postData.action;

    if (action === "addEntrada") {
      output = insertEntrada(ss, postData.data);
    } else if (action === "addVenta") {
      output = insertVenta(ss, postData.data);
    } else {
      output = { status: "error", message: "Acción POST no reconocida: " + action };
    }

    // Agregar datos frescos post-inserción para actualizar la app de inmediato
    if (output.status === "success") {
      output.resumen = getResumenData(ss);
      output.entradas = getEntradasData(ss, 15);
      output.ventas = getVentasData(ss, 15);
    }
  } catch (err) {
    output = { status: "error", message: err.toString() };
  } finally {
    lock.releaseLock();
  }

  return ContentService.createTextOutput(JSON.stringify(output))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Lee los datos de la hoja 'Resumen General' mapeando encabezados
 */
function getResumenData(ss) {
  var sheet = ss.getSheetByName("Resumen General");
  if (!sheet) return null;

  // Leer KPIs directos de las celdas formuladas (filas 3 a 5)
  // B4=Ventas Totales, D4=Inversión Total, F4=Utilidad en Ventas, H4=Stock Disponible, J4=Margen Promedio
  var kpiRange = sheet.getRange("B4:J4").getValues()[0];
  var kpis = {
    ventasTotales: Number(kpiRange[0]) || 0,
    inversionTotal: Number(kpiRange[2]) || 0,
    utilidadVentas: Number(kpiRange[4]) || 0,
    stockDisponible: Number(kpiRange[6]) || 0,
    margenPromedio: Number(kpiRange[8]) || 0
  };

  // Leer la tabla de productos (Encabezados en fila 7)
  var lastRow = sheet.getLastRow();
  var tableHeaders = sheet.getRange(7, 2, 1, 9).getValues()[0]; // B7:J7

  // Mapear columnas dinámicamente por nombre
  var idxProducto = findColumnByHeader(tableHeaders, "Producto") - 1;
  var idxCategoria = findColumnByHeader(tableHeaders, "Categoría") - 1;
  var idxEntradas = findColumnByHeader(tableHeaders, "Entradas") - 1;
  var idxSalidas = findColumnByHeader(tableHeaders, "Salidas") - 1;
  var idxStockActual = findColumnByHeader(tableHeaders, "Stock Actual") - 1;
  var idxCostoTotal = findColumnByHeader(tableHeaders, "Costo Total ($)") - 1;
  var idxVentasTotal = findColumnByHeader(tableHeaders, "Ventas Total ($)") - 1;
  var idxGananciaNeta = findColumnByHeader(tableHeaders, "Ganancia Neta ($)") - 1;
  var idxEstadoStock = findColumnByHeader(tableHeaders, "Estado Stock") - 1;

  var productos = [];
  if (lastRow >= 8) {
    var dataRows = sheet.getRange(8, 2, Math.min(lastRow - 7, 50), 9).getValues();
    for (var i = 0; i < dataRows.length; i++) {
      var row = dataRows[i];
      var prodName = row[idxProducto];
      if (!prodName || prodName.toString().trim() === "" || prodName === "TOTAL GENERAL") {
        continue;
      }
      productos.push({
        producto: prodName,
        categoria: row[idxCategoria] || "",
        entradas: Number(row[idxEntradas]) || 0,
        salidas: Number(row[idxSalidas]) || 0,
        stockActual: Number(row[idxStockActual]) || 0,
        costoTotal: Number(row[idxCostoTotal]) || 0,
        ventasTotal: Number(row[idxVentasTotal]) || 0,
        gananciaNeta: Number(row[idxGananciaNeta]) || 0,
        estadoStock: row[idxEstadoStock] || "Agotado"
      });
    }
  }

  return { kpis: kpis, productos: productos };
}

/**
 * Lee el catálogo de productos disponible
 */
function getCatalogoData(ss) {
  var sheet = ss.getSheetByName("Catálogo") || ss.getSheetByName("Catalogo");
  if (!sheet) return [];

  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  var headers = sheet.getRange(1, 1, 1, 2).getValues()[0];
  var colProd = findColumnByHeader(headers, "Producto") - 1;
  var colCat = findColumnByHeader(headers, "Categoría") - 1;

  var rows = sheet.getRange(2, 1, lastRow - 1, 2).getValues();
  var catalogo = [];
  for (var i = 0; i < rows.length; i++) {
    var p = rows[i][colProd !== -1 ? colProd : 0];
    var c = rows[i][colCat !== -1 ? colCat : 1];
    if (p && p.toString().trim() !== "") {
      catalogo.push({ producto: p.toString().trim(), categoria: c ? c.toString().trim() : "" });
    }
  }
  return catalogo;
}

/**
 * Lee los registros recientes de Stock de Entrada
 */
function getEntradasData(ss, limit) {
  var sheet = ss.getSheetByName("Stock de Entrada");
  if (!sheet) return [];

  var lastCol = sheet.getLastColumn();
  if (lastCol < 1) return [];

  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var colId = findColumnByHeader(headers, "ID Entrada") - 1;
  var colFecha = findColumnByHeader(headers, "Fecha") - 1;
  var colProd = findColumnByHeader(headers, "Producto") - 1;
  var colCant = findColumnByHeader(headers, "Cantidad") - 1;
  var colAplica = findColumnByHeader(headers, "Aplica Tasa") - 1;
  var colTasa = findColumnByHeader(headers, "Tasa BCV") - 1;
  var colBs = findColumnByHeader(headers, "Costo Unitario (Bs.)") - 1;
  var colUsd = findColumnByHeader(headers, "Costo Unitario ($)") - 1;
  var colTotal = findColumnByHeader(headers, "Costo Total ($)") - 1;

  var lastRow = sheet.getLastRow();
  var items = [];

  if (lastRow >= 2) {
    var range = sheet.getRange(2, 1, lastRow - 1, lastCol);
    var values = range.getValues();

    for (var i = values.length - 1; i >= 0; i--) {
      var row = values[i];
      var prod = row[colProd];
      if (!prod || prod.toString().trim() === "") continue;

      var fechaStr = "";
      if (row[colFecha]) {
        try {
          fechaStr = Utilities.formatDate(new Date(row[colFecha]), Session.getScriptTimeZone(), "yyyy-MM-dd");
        } catch(e) {
          fechaStr = row[colFecha].toString();
        }
      }

      items.push({
        id: row[colId] || ("ENT-" + (i + 1)),
        fecha: fechaStr,
        producto: prod,
        cantidad: Number(row[colCant]) || 0,
        aplicaTasa: Boolean(row[colAplica]),
        tasaBCV: Number(row[colTasa]) || 0,
        costoUnitarioBs: Number(row[colBs]) || 0,
        costoUnitarioUsd: Number(row[colUsd]) || 0,
        costoTotalUsd: Number(row[colTotal]) || 0
      });

      if (limit && items.length >= limit) break;
    }
  }

  return items;
}

/**
 * Lee los registros recientes de Stock de Vendidos
 */
function getVentasData(ss, limit) {
  var sheet = ss.getSheetByName("Stock de Vendidos");
  if (!sheet) return [];

  var lastCol = sheet.getLastColumn();
  if (lastCol < 1) return [];

  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var colId = findColumnByHeader(headers, "ID Venta") - 1;
  var colFecha = findColumnByHeader(headers, "Fecha") - 1;
  var colProd = findColumnByHeader(headers, "Producto") - 1;
  var colCant = findColumnByHeader(headers, "Cantidad") - 1;
  var colAplica = findColumnByHeader(headers, "Aplica Tasa") - 1;
  var colTasa = findColumnByHeader(headers, "Tasa BCV") - 1;
  var colBs = findColumnByHeader(headers, "Precio Unitario (Bs.)") - 1;
  var colUsd = findColumnByHeader(headers, "Precio Unitario ($)") - 1;
  var colTotal = findColumnByHeader(headers, "Total Venta ($)") - 1;

  var lastRow = sheet.getLastRow();
  var items = [];

  if (lastRow >= 2) {
    var range = sheet.getRange(2, 1, lastRow - 1, lastCol);
    var values = range.getValues();

    for (var i = values.length - 1; i >= 0; i--) {
      var row = values[i];
      var prod = row[colProd];
      if (!prod || prod.toString().trim() === "") continue;

      var fechaStr = "";
      if (row[colFecha]) {
        try {
          fechaStr = Utilities.formatDate(new Date(row[colFecha]), Session.getScriptTimeZone(), "yyyy-MM-dd");
        } catch(e) {
          fechaStr = row[colFecha].toString();
        }
      }

      items.push({
        id: row[colId] || ("VNT-" + (i + 1)),
        fecha: fechaStr,
        producto: prod,
        cantidad: Number(row[colCant]) || 0,
        aplicaTasa: Boolean(row[colAplica]),
        tasaBCV: Number(row[colTasa]) || 0,
        precioUnitarioBs: Number(row[colBs]) || 0,
        precioUnitarioUsd: Number(row[colUsd]) || 0,
        totalVentaUsd: Number(row[colTotal]) || 0
      });

      if (limit && items.length >= limit) break;
    }
  }

  return items;
}

/**
 * Encuentra la primera fila verdaderamente disponible para escribir (donde Producto esté vacío)
 */
function findNextTargetRow(sheet, colProducto) {
  var maxRows = sheet.getMaxRows();
  var prodColumnValues = sheet.getRange(2, colProducto, maxRows - 1, 1).getValues();

  for (var i = 0; i < prodColumnValues.length; i++) {
    var val = prodColumnValues[i][0];
    if (val === "" || val === null || val === undefined) {
      return i + 2; // +2 por índice 1 y cabecera
    }
  }

  // Si todas las filas tienen datos, insertar una nueva fila al final
  sheet.appendRow([""]);
  return sheet.getLastRow();
}

/**
 * Inserta un registro de Entrada mapeando encabezados y asegurando NO sobreescribir fórmulas
 */
function insertEntrada(ss, data) {
  var sheet = ss.getSheetByName("Stock de Entrada");
  if (!sheet) throw new Error("No se encontró la hoja 'Stock de Entrada'");

  var lastCol = sheet.getLastColumn();
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];

  // Identificar columnas por nombre exacto
  var cId = findColumnByHeader(headers, "ID Entrada");
  var cFecha = findColumnByHeader(headers, "Fecha");
  var cProducto = findColumnByHeader(headers, "Producto");
  var cCantidad = findColumnByHeader(headers, "Cantidad");
  var cAplica = findColumnByHeader(headers, "Aplica Tasa");
  var cTasa = findColumnByHeader(headers, "Tasa BCV");
  var cCostoBs = findColumnByHeader(headers, "Costo Unitario (Bs.)");
  var cCostoUsd = findColumnByHeader(headers, "Costo Unitario ($)");
  var cTotalUsd = findColumnByHeader(headers, "Costo Total ($)");

  if (cProducto === -1) throw new Error("No se encontró la columna 'Producto' en 'Stock de Entrada'");

  var targetRow = findNextTargetRow(sheet, cProducto);

  // PROTOCOLO DE FORMULAS: Asegurar que las columnas con fórmulas existan en la fila
  // Si la celda de fórmula está vacía, copiarla desde la fila 2 para preservar la lógica nativa
  if (cId !== -1) {
    var cellId = sheet.getRange(targetRow, cId);
    if (!cellId.getFormula() && targetRow > 2) {
      sheet.getRange(2, cId).copyTo(cellId, SpreadsheetApp.CopyPasteType.PASTE_FORMULA, false);
    }
  }

  if (cTotalUsd !== -1) {
    var cellTotal = sheet.getRange(targetRow, cTotalUsd);
    if (!cellTotal.getFormula() && targetRow > 2) {
      sheet.getRange(2, cTotalUsd).copyTo(cellTotal, SpreadsheetApp.CopyPasteType.PASTE_FORMULA, false);
    }
  }

  // ESCRIBIR ÚNICAMENTE EN LAS COLUMNAS DE ENTRADA MANUAL (SALTANDO FORMULAS)
  if (cFecha !== -1 && data.fecha) {
    sheet.getRange(targetRow, cFecha).setValue(data.fecha);
  }
  if (cProducto !== -1) {
    sheet.getRange(targetRow, cProducto).setValue(data.producto);
  }
  if (cCantidad !== -1) {
    sheet.getRange(targetRow, cCantidad).setValue(Number(data.cantidad) || 1);
  }
  if (cAplica !== -1) {
    sheet.getRange(targetRow, cAplica).setValue(data.aplicaTasa ? 1 : 0);
  }
  if (cTasa !== -1) {
    sheet.getRange(targetRow, cTasa).setValue(data.aplicaTasa ? (Number(data.tasaBCV) || 0) : "");
  }
  if (cCostoBs !== -1) {
    sheet.getRange(targetRow, cCostoBs).setValue(data.costoUnitarioBs ? Number(data.costoUnitarioBs) : "");
  }
  if (cCostoUsd !== -1) {
    sheet.getRange(targetRow, cCostoUsd).setValue(data.costoUnitarioUsd ? Number(data.costoUnitarioUsd) : 0);
  }

  SpreadsheetApp.flush();

  return {
    status: "success",
    message: "Entrada registrada correctamente en fila " + targetRow,
    row: targetRow
  };
}

/**
 * Inserta un registro de Venta mapeando encabezados y asegurando NO sobreescribir fórmulas
 */
function insertVenta(ss, data) {
  var sheet = ss.getSheetByName("Stock de Vendidos");
  if (!sheet) throw new Error("No se encontró la hoja 'Stock de Vendidos'");

  var lastCol = sheet.getLastColumn();
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];

  // Identificar columnas por nombre exacto
  var cId = findColumnByHeader(headers, "ID Venta");
  var cFecha = findColumnByHeader(headers, "Fecha");
  var cProducto = findColumnByHeader(headers, "Producto");
  var cCantidad = findColumnByHeader(headers, "Cantidad");
  var cAplica = findColumnByHeader(headers, "Aplica Tasa");
  var cTasa = findColumnByHeader(headers, "Tasa BCV");
  var cPrecioBs = findColumnByHeader(headers, "Precio Unitario (Bs.)");
  var cPrecioUsd = findColumnByHeader(headers, "Precio Unitario ($)");
  var cTotalUsd = findColumnByHeader(headers, "Total Venta ($)");

  if (cProducto === -1) throw new Error("No se encontró la columna 'Producto' en 'Stock de Vendidos'");

  var targetRow = findNextTargetRow(sheet, cProducto);

  // PROTOCOLO DE FORMULAS: Asegurar que las columnas con fórmulas existan en la fila
  if (cId !== -1) {
    var cellId = sheet.getRange(targetRow, cId);
    if (!cellId.getFormula() && targetRow > 2) {
      sheet.getRange(2, cId).copyTo(cellId, SpreadsheetApp.CopyPasteType.PASTE_FORMULA, false);
    }
  }

  if (cTotalUsd !== -1) {
    var cellTotal = sheet.getRange(targetRow, cTotalUsd);
    if (!cellTotal.getFormula() && targetRow > 2) {
      sheet.getRange(2, cTotalUsd).copyTo(cellTotal, SpreadsheetApp.CopyPasteType.PASTE_FORMULA, false);
    }
  }

  // ESCRIBIR ÚNICAMENTE EN LAS COLUMNAS DE ENTRADA MANUAL (SALTANDO FORMULAS)
  if (cFecha !== -1 && data.fecha) {
    sheet.getRange(targetRow, cFecha).setValue(data.fecha);
  }
  if (cProducto !== -1) {
    sheet.getRange(targetRow, cProducto).setValue(data.producto);
  }
  if (cCantidad !== -1) {
    sheet.getRange(targetRow, cCantidad).setValue(Number(data.cantidad) || 1);
  }
  if (cAplica !== -1) {
    sheet.getRange(targetRow, cAplica).setValue(data.aplicaTasa ? 1 : 0);
  }
  if (cTasa !== -1) {
    sheet.getRange(targetRow, cTasa).setValue(data.aplicaTasa ? (Number(data.tasaBCV) || 0) : "");
  }
  if (cPrecioBs !== -1) {
    sheet.getRange(targetRow, cPrecioBs).setValue(data.precioUnitarioBs ? Number(data.precioUnitarioBs) : "");
  }
  if (cPrecioUsd !== -1) {
    sheet.getRange(targetRow, cPrecioUsd).setValue(data.precioUnitarioUsd ? Number(data.precioUnitarioUsd) : 0);
  }

  SpreadsheetApp.flush();

  return {
    status: "success",
    message: "Venta registrada exitosamente en fila " + targetRow,
    row: targetRow
  };
}

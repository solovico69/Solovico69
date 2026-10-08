/**
 * PROYECTO: Control Ethan - Sistema de Inventario y Ventas iPhone
 * DESARROLLO & ARQUITECTURA: Victor Solorzano
 * ASISTENCIA TÉCNICA: OpenCode for Obsidian & Antigravity IDE
 * ROL: Cliente API Google Apps Script - Sincronización en Tiempo Real y Caché Local
 */

const SheetsAPI = (function () {
  const SCRIPT_URL_KEY = 'control_ethan_gas_url';
  const CACHE_KEY = 'control_ethan_sheets_data';
  const PENDING_QUEUE_KEY = 'control_ethan_pending_tx';

  // Obtener URL configurada por el usuario
  function getScriptUrl() {
    return localStorage.getItem(SCRIPT_URL_KEY) || '';
  }

  function setScriptUrl(url) {
    if (url) {
      localStorage.setItem(SCRIPT_URL_KEY, url.trim());
    } else {
      localStorage.removeItem(SCRIPT_URL_KEY);
    }
  }

  // Obtener datos guardados en caché local (instantáneo)
  function getCachedData() {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  // Guardar datos en caché local
  function saveToCache(data) {
    if (!data) return;
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      timestamp: new Date().toISOString(),
      ...data
    }));
  }

  // Consultar todos los datos (Resumen, Catálogo, Entradas, Ventas)
  async function fetchAllData(force = false) {
    const url = getScriptUrl();
    if (!url) {
      return {
        isConfigured: false,
        data: getCachedData() || getFallbackCatalog()
      };
    }

    try {
      const endpoint = `${url}?action=getAllData&_t=${Date.now()}`;
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        mode: 'cors'
      });

      if (!response.ok) throw new Error('Error al conectar con Google Apps Script: ' + response.statusText);

      const result = await response.json();
      if (result.status === 'success') {
        saveToCache(result);
        return { isConfigured: true, success: true, data: result };
      } else {
        throw new Error(result.message || 'Error desconocido del script de Sheets');
      }
    } catch (err) {
      console.warn('Fallo al obtener datos en vivo de Google Sheet. Usando caché:', err);
      const cached = getCachedData();
      return {
        isConfigured: true,
        success: false,
        error: err.message,
        data: cached || getFallbackCatalog()
      };
    }
  }

  // Registrar nueva entrada en Google Sheets
  async function registrarEntrada(entradaData) {
    const url = getScriptUrl();

    // Actualización optimista en caché local
    const cached = getCachedData() || { entradas: [], resumen: { kpis: {}, productos: [] } };
    const tempItem = {
      id: 'ENT-PEND',
      fecha: entradaData.fecha,
      producto: entradaData.producto,
      cantidad: Number(entradaData.cantidad),
      aplicaTasa: entradaData.aplicaTasa,
      tasaBCV: Number(entradaData.tasaBCV) || 0,
      costoUnitarioBs: Number(entradaData.costoUnitarioBs) || 0,
      costoUnitarioUsd: Number(entradaData.costoUnitarioUsd) || 0,
      costoTotalUsd: Number(entradaData.costoUnitarioUsd) * Number(entradaData.cantidad)
    };

    if (!cached.entradas) cached.entradas = [];
    cached.entradas.unshift(tempItem);

    // Ajustar temporalmente el producto en la lista local si existe
    if (cached.resumen && cached.resumen.productos) {
      const p = cached.resumen.productos.find(x => x.producto === entradaData.producto);
      if (p) {
        p.entradas = (p.entradas || 0) + Number(entradaData.cantidad);
        p.stockActual = (p.stockActual || 0) + Number(entradaData.cantidad);
        p.costoTotal = (p.costoTotal || 0) + tempItem.costoTotalUsd;
        p.estadoStock = p.stockActual <= 0 ? 'Agotado' : (p.stockActual <= 3 ? 'Stock Bajo' : 'Disponible');
      }
    }
    saveToCache(cached);

    if (!url) {
      return { success: true, offline: true, message: 'Guardado en caché local (Falta URL de Apps Script)' };
    }

    try {
      const payload = {
        action: 'addEntrada',
        data: entradaData
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // Usar text/plain evita preflight OPTIONS en GAS
        body: JSON.stringify(payload),
        mode: 'cors'
      });

      const result = await response.json();
      if (result.status === 'success') {
        if (result.resumen) {
          saveToCache({
            resumen: result.resumen,
            entradas: result.entradas,
            ventas: result.ventas,
            catalogo: cached.catalogo
          });
        }
        return { success: true, result };
      } else {
        throw new Error(result.message);
      }
    } catch (err) {
      console.error('Error enviando entrada al Sheet:', err);
      queueOfflineTransaction('addEntrada', entradaData);
      return { success: true, offline: true, message: 'Guardado localmente. Se enviará al reconectar.' };
    }
  }

  // Registrar nueva venta en Google Sheets
  async function registrarVenta(ventaData) {
    const url = getScriptUrl();

    // Actualización optimista en caché local
    const cached = getCachedData() || { ventas: [], resumen: { kpis: {}, productos: [] } };
    const tempItem = {
      id: 'VNT-PEND',
      fecha: ventaData.fecha,
      producto: ventaData.producto,
      cantidad: Number(ventaData.cantidad),
      aplicaTasa: ventaData.aplicaTasa,
      tasaBCV: Number(ventaData.tasaBCV) || 0,
      precioUnitarioBs: Number(ventaData.precioUnitarioBs) || 0,
      precioUnitarioUsd: Number(ventaData.precioUnitarioUsd) || 0,
      totalVentaUsd: Number(ventaData.precioUnitarioUsd) * Number(ventaData.cantidad)
    };

    if (!cached.ventas) cached.ventas = [];
    cached.ventas.unshift(tempItem);

    // Ajustar temporalmente el producto en la lista local
    if (cached.resumen && cached.resumen.productos) {
      const p = cached.resumen.productos.find(x => x.producto === ventaData.producto);
      if (p) {
        p.salidas = (p.salidas || 0) + Number(ventaData.cantidad);
        p.stockActual = Math.max(0, (p.stockActual || 0) - Number(ventaData.cantidad));
        p.ventasTotal = (p.ventasTotal || 0) + tempItem.totalVentaUsd;
        p.estadoStock = p.stockActual <= 0 ? 'Agotado' : (p.stockActual <= 3 ? 'Stock Bajo' : 'Disponible');
      }
    }
    saveToCache(cached);

    if (!url) {
      return { success: true, offline: true, message: 'Guardado en caché local (Falta URL de Apps Script)' };
    }

    try {
      const payload = {
        action: 'addVenta',
        data: ventaData
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
        mode: 'cors'
      });

      const result = await response.json();
      if (result.status === 'success') {
        if (result.resumen) {
          saveToCache({
            resumen: result.resumen,
            entradas: result.entradas,
            ventas: result.ventas,
            catalogo: cached.catalogo
          });
        }
        return { success: true, result };
      } else {
        throw new Error(result.message);
      }
    } catch (err) {
      console.error('Error enviando venta al Sheet:', err);
      queueOfflineTransaction('addVenta', ventaData);
      return { success: true, offline: true, message: 'Guardado localmente. Se enviará al reconectar.' };
    }
  }

  // Cola de transacciones pendientes para offline
  function queueOfflineTransaction(action, data) {
    try {
      const queue = JSON.parse(localStorage.getItem(PENDING_QUEUE_KEY) || '[]');
      queue.push({ action, data, time: new Date().toISOString() });
      localStorage.setItem(PENDING_QUEUE_KEY, JSON.stringify(queue));
    } catch (e) {}
  }

  // Sincronizar cola pendiente cuando haya red
  async function processPendingQueue() {
    const url = getScriptUrl();
    if (!url) return;
    try {
      const queue = JSON.parse(localStorage.getItem(PENDING_QUEUE_KEY) || '[]');
      if (queue.length === 0) return;

      const remaining = [];
      for (const item of queue) {
        try {
          await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ action: item.action, data: item.data })
          });
        } catch (err) {
          remaining.push(item);
        }
      }
      localStorage.setItem(PENDING_QUEUE_KEY, JSON.stringify(remaining));
      if (queue.length > remaining.length) {
        fetchAllData(true);
      }
    } catch (e) {}
  }

  // Catálogo base precargado desde el archivo XLSX analizado
  function getFallbackCatalog() {
    return {
      timestamp: new Date().toISOString(),
      resumen: {
        kpis: {
          ventasTotales: 0,
          inversionTotal: 0,
          utilidadVentas: 0,
          stockDisponible: 0,
          margenPromedio: 0
        },
        productos: [
          { producto: 'iPhone 16 Pro Max', categoria: 'Serie 16 Pro', entradas: 0, salidas: 0, stockActual: 0, costoTotal: 0, ventasTotal: 0, gananciaNeta: 0, estadoStock: 'Agotado' },
          { producto: 'iPhone 16 Pro', categoria: 'Serie 16 Pro', entradas: 0, salidas: 0, stockActual: 0, costoTotal: 0, ventasTotal: 0, gananciaNeta: 0, estadoStock: 'Agotado' },
          { producto: 'iPhone 16 Plus', categoria: 'Serie 16 Estándar', entradas: 0, salidas: 0, stockActual: 0, costoTotal: 0, ventasTotal: 0, gananciaNeta: 0, estadoStock: 'Agotado' },
          { producto: 'iPhone 16', categoria: 'Serie 16 Estándar', entradas: 0, salidas: 0, stockActual: 0, costoTotal: 0, ventasTotal: 0, gananciaNeta: 0, estadoStock: 'Agotado' },
          { producto: 'iPhone 16e', categoria: 'Serie 16 Estándar', entradas: 0, salidas: 0, stockActual: 0, costoTotal: 0, ventasTotal: 0, gananciaNeta: 0, estadoStock: 'Agotado' },
          { producto: 'iPhone 15 Pro Max', categoria: 'Serie 15 Pro', entradas: 0, salidas: 0, stockActual: 0, costoTotal: 0, ventasTotal: 0, gananciaNeta: 0, estadoStock: 'Agotado' },
          { producto: 'iPhone 15 Pro', categoria: 'Serie 15 Pro', entradas: 0, salidas: 0, stockActual: 0, costoTotal: 0, ventasTotal: 0, gananciaNeta: 0, estadoStock: 'Agotado' },
          { producto: 'iPhone 15 Plus', categoria: 'Serie 15 Estándar', entradas: 0, salidas: 0, stockActual: 0, costoTotal: 0, ventasTotal: 0, gananciaNeta: 0, estadoStock: 'Agotado' },
          { producto: 'iPhone 15', categoria: 'Serie 15 Estándar', entradas: 0, salidas: 0, stockActual: 0, costoTotal: 0, ventasTotal: 0, gananciaNeta: 0, estadoStock: 'Agotado' },
          { producto: 'iPhone 14 Pro Max', categoria: 'Serie 14 Pro', entradas: 0, salidas: 0, stockActual: 0, costoTotal: 0, ventasTotal: 0, gananciaNeta: 0, estadoStock: 'Agotado' },
          { producto: 'iPhone 14 Pro', categoria: 'Serie 14 Pro', entradas: 0, salidas: 0, stockActual: 0, costoTotal: 0, ventasTotal: 0, gananciaNeta: 0, estadoStock: 'Agotado' },
          { producto: 'iPhone 14 Plus', categoria: 'Serie 14 Estándar', entradas: 0, salidas: 0, stockActual: 0, costoTotal: 0, ventasTotal: 0, gananciaNeta: 0, estadoStock: 'Agotado' },
          { producto: 'iPhone 14', categoria: 'Serie 14 Estándar', entradas: 0, salidas: 0, stockActual: 0, costoTotal: 0, ventasTotal: 0, gananciaNeta: 0, estadoStock: 'Agotado' },
          { producto: 'iPhone 13 Pro Max', categoria: 'Serie 13 Pro', entradas: 0, salidas: 0, stockActual: 0, costoTotal: 0, ventasTotal: 0, gananciaNeta: 0, estadoStock: 'Agotado' },
          { producto: 'iPhone 13 Pro', categoria: 'Serie 13 Pro', entradas: 0, salidas: 0, stockActual: 0, costoTotal: 0, ventasTotal: 0, gananciaNeta: 0, estadoStock: 'Agotado' },
          { producto: 'iPhone 13', categoria: 'Serie 13 Estándar', entradas: 0, salidas: 0, stockActual: 0, costoTotal: 0, ventasTotal: 0, gananciaNeta: 0, estadoStock: 'Agotado' },
          { producto: 'iPhone 13 mini', categoria: 'Serie 13 Estándar', entradas: 0, salidas: 0, stockActual: 0, costoTotal: 0, ventasTotal: 0, gananciaNeta: 0, estadoStock: 'Agotado' },
          { producto: 'iPhone 12 Pro Max', categoria: 'Serie 12 Pro', entradas: 0, salidas: 0, stockActual: 0, costoTotal: 0, ventasTotal: 0, gananciaNeta: 0, estadoStock: 'Agotado' },
          { producto: 'iPhone 12 Pro', categoria: 'Serie 12 Pro', entradas: 0, salidas: 0, stockActual: 0, costoTotal: 0, ventasTotal: 0, gananciaNeta: 0, estadoStock: 'Agotado' },
          { producto: 'iPhone 12', categoria: 'Serie 12 Estándar', entradas: 0, salidas: 0, stockActual: 0, costoTotal: 0, ventasTotal: 0, gananciaNeta: 0, estadoStock: 'Agotado' },
          { producto: 'iPhone 11', categoria: 'Serie 11 Estándar', entradas: 0, salidas: 0, stockActual: 0, costoTotal: 0, ventasTotal: 0, gananciaNeta: 0, estadoStock: 'Agotado' },
          { producto: 'iPhone SE (3.ª gen)', categoria: 'Serie SE', entradas: 0, salidas: 0, stockActual: 0, costoTotal: 0, ventasTotal: 0, gananciaNeta: 0, estadoStock: 'Agotado' }
        ]
      },
      catalogo: [
        { producto: 'iPhone 16 Pro Max', categoria: 'Serie 16 Pro' },
        { producto: 'iPhone 16 Pro', categoria: 'Serie 16 Pro' },
        { producto: 'iPhone 16 Plus', categoria: 'Serie 16 Estándar' },
        { producto: 'iPhone 16', categoria: 'Serie 16 Estándar' },
        { producto: 'iPhone 16e', categoria: 'Serie 16 Estándar' },
        { producto: 'iPhone 15 Pro Max', categoria: 'Serie 15 Pro' },
        { producto: 'iPhone 15 Pro', categoria: 'Serie 15 Pro' },
        { producto: 'iPhone 15 Plus', categoria: 'Serie 15 Estándar' },
        { producto: 'iPhone 15', categoria: 'Serie 15 Estándar' },
        { producto: 'iPhone 14 Pro Max', categoria: 'Serie 14 Pro' },
        { producto: 'iPhone 14 Pro', categoria: 'Serie 14 Pro' },
        { producto: 'iPhone 14 Plus', categoria: 'Serie 14 Estándar' },
        { producto: 'iPhone 14', categoria: 'Serie 14 Estándar' },
        { producto: 'iPhone 13 Pro Max', categoria: 'Serie 13 Pro' },
        { producto: 'iPhone 13 Pro', categoria: 'Serie 13 Pro' },
        { producto: 'iPhone 13', categoria: 'Serie 13 Estándar' },
        { producto: 'iPhone 13 mini', categoria: 'Serie 13 Estándar' },
        { producto: 'iPhone 12 Pro Max', categoria: 'Serie 12 Pro' },
        { producto: 'iPhone 12 Pro', categoria: 'Serie 12 Pro' },
        { producto: 'iPhone 12', categoria: 'Serie 12 Estándar' },
        { producto: 'iPhone 11', categoria: 'Serie 11 Estándar' },
        { producto: 'iPhone SE (3.ª gen)', categoria: 'Serie SE' }
      ],
      entradas: [],
      ventas: []
    };
  }

  return {
    getScriptUrl,
    setScriptUrl,
    getCachedData,
    fetchAllData,
    registrarEntrada,
    registrarVenta,
    processPendingQueue,
    getFallbackCatalog
  };
})();

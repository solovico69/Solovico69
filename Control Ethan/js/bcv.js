/**
 * PROYECTO: Control Ethan - Sistema de Inventario y Ventas iPhone
 * DESARROLLO & ARQUITECTURA: Victor Solorzano
 * ASISTENCIA TÉCNICA: OpenCode for Obsidian & Antigravity IDE
 * ROL: Módulo de Tasa de Cambio BCV, Conversiones y Visibilidad Condicional
 */

const BCVModule = (function () {
  const STORAGE_KEY = 'control_ethan_bcv_rate';
  const STORAGE_TIME_KEY = 'control_ethan_bcv_updated';
  const API_URL = 'https://ve.dolarapi.com/v1/dolares/oficial';

  let currentRate = 0;
  let lastUpdated = null;

  // Cargar tasa guardada en caché inicialmente
  function init() {
    const cachedRate = localStorage.getItem(STORAGE_KEY);
    const cachedTime = localStorage.getItem(STORAGE_TIME_KEY);
    if (cachedRate) {
      currentRate = parseFloat(cachedRate) || 0;
      lastUpdated = cachedTime ? new Date(cachedTime) : null;
    }
    fetchRate(); // Actualizar en segundo plano
  }

  // Consultar la tasa oficial de forma asíncrona
  async function fetchRate(force = false) {
    try {
      const response = await fetch(API_URL, { cache: force ? 'no-cache' : 'default' });
      if (!response.ok) throw new Error('Respuesta no válida del servidor BCV');
      const data = await response.json();

      if (data && (data.promedio || data.precio)) {
        currentRate = parseFloat(data.promedio || data.precio);
        lastUpdated = new Date();
        localStorage.setItem(STORAGE_KEY, currentRate.toString());
        localStorage.setItem(STORAGE_TIME_KEY, lastUpdated.toISOString());
        triggerRateUpdated();
        return { success: true, rate: currentRate, date: lastUpdated };
      }
    } catch (error) {
      console.warn('No se pudo conectar a la API del BCV en este momento. Usando caché:', error);
      if (currentRate > 0) {
        return { success: true, rate: currentRate, date: lastUpdated, fromCache: true };
      }
    }
    return { success: false, rate: currentRate };
  }

  // Establecer tasa manual
  function setManualRate(newRate) {
    const parsed = parseFloat(newRate);
    if (!isNaN(parsed) && parsed > 0) {
      currentRate = parsed;
      lastUpdated = new Date();
      localStorage.setItem(STORAGE_KEY, currentRate.toString());
      localStorage.setItem(STORAGE_TIME_KEY, lastUpdated.toISOString());
      triggerRateUpdated();
      return true;
    }
    return false;
  }

  function getRate() {
    return currentRate;
  }

  function getLastUpdatedFormatted() {
    if (!lastUpdated) return 'Sin datos';
    return lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + 
           ' (' + lastUpdated.toLocaleDateString() + ')';
  }

  // Conversiones
  function usdToBs(usdAmount, customRate = null) {
    const rate = customRate || currentRate;
    if (!rate || rate <= 0 || isNaN(usdAmount)) return 0;
    return parseFloat((usdAmount * rate).toFixed(2));
  }

  function bsToUsd(bsAmount, customRate = null) {
    const rate = customRate || currentRate;
    if (!rate || rate <= 0 || isNaN(bsAmount)) return 0;
    return parseFloat((bsAmount / rate).toFixed(2));
  }

  // Evento para actualizar inputs en la UI
  function triggerRateUpdated() {
    window.dispatchEvent(new CustomEvent('bcvRateUpdated', {
      detail: { rate: currentRate, updated: lastUpdated }
    }));
  }

  /**
   * Conecta los eventos de visibilidad condicional y auto-conversión para un formulario
   * @param {Object} config - IDs de los elementos
   */
  function bindFormConversion(config) {
    const chkAplica = document.getElementById(config.chkAplicaId);
    const containerTasa = document.getElementById(config.containerTasaId);
    const inputTasa = document.getElementById(config.inputTasaId);
    const inputBs = document.getElementById(config.inputBsId);
    const inputUsd = document.getElementById(config.inputUsdId);
    const inputCantidad = document.getElementById(config.inputCantidadId);
    const displayTotalUsd = document.getElementById(config.displayTotalUsdId);

    if (!chkAplica || !containerTasa || !inputTasa) return;

    // Control de visibilidad condicional
    function updateTasaVisibility() {
      if (chkAplica.checked) {
        containerTasa.classList.remove('hidden-field');
        containerTasa.classList.add('visible-field');
        if (!inputTasa.value || parseFloat(inputTasa.value) === 0) {
          inputTasa.value = currentRate > 0 ? currentRate.toFixed(2) : '';
        }
      } else {
        containerTasa.classList.remove('visible-field');
        containerTasa.classList.add('hidden-field');
      }
      recalculateTotals();
    }

    chkAplica.addEventListener('change', updateTasaVisibility);

    // Auto-conversión cuando el usuario escribe en USD
    if (inputUsd && inputBs) {
      inputUsd.addEventListener('input', () => {
        const usdVal = parseFloat(inputUsd.value);
        const rateVal = parseFloat(inputTasa.value) || currentRate;
        if (chkAplica.checked && rateVal > 0 && !isNaN(usdVal)) {
          inputBs.value = (usdVal * rateVal).toFixed(2);
        }
        recalculateTotals();
      });

      // Auto-conversión cuando el usuario escribe en Bs.
      inputBs.addEventListener('input', () => {
        const bsVal = parseFloat(inputBs.value);
        const rateVal = parseFloat(inputTasa.value) || currentRate;
        if (chkAplica.checked && rateVal > 0 && !isNaN(bsVal)) {
          inputUsd.value = (bsVal / rateVal).toFixed(2);
        }
        recalculateTotals();
      });

      // Recalcular si cambia la tasa manual
      inputTasa.addEventListener('input', () => {
        const rateVal = parseFloat(inputTasa.value) || 0;
        const usdVal = parseFloat(inputUsd.value);
        if (chkAplica.checked && rateVal > 0 && !isNaN(usdVal)) {
          inputBs.value = (usdVal * rateVal).toFixed(2);
        }
        recalculateTotals();
      });
    }

    if (inputCantidad) {
      inputCantidad.addEventListener('input', recalculateTotals);
    }

    function recalculateTotals() {
      if (!displayTotalUsd) return;
      const cant = parseFloat(inputCantidad ? inputCantidad.value : 1) || 0;
      const usd = parseFloat(inputUsd ? inputUsd.value : 0) || 0;
      const total = cant * usd;
      displayTotalUsd.textContent = '$' + total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    // Inicializar estado
    updateTasaVisibility();
  }

  return {
    init,
    fetchRate,
    setManualRate,
    getRate,
    getLastUpdatedFormatted,
    usdToBs,
    bsToUsd,
    bindFormConversion
  };
})();

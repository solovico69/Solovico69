/**
 * PROYECTO: Control Ethan - Sistema de Inventario y Ventas iPhone
 * DESARROLLO & ARQUITECTURA: Victor Solorzano
 * ASISTENCIA TÉCNICA: OpenCode for Obsidian & Antigravity IDE
 * ROL: Controlador Principal de la Aplicación, Vistas, Filtros y Eventos de Usuario
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Inicializar Módulos
  BCVModule.init();

  // Elementos DOM Principales
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const dockItems = document.querySelectorAll('.dock-item');
  const viewPanels = document.querySelectorAll('.view-panel');
  const statusIndicator = document.getElementById('statusIndicator');
  const statusText = document.getElementById('statusText');
  const statusDot = document.getElementById('statusDot');

  // Elementos de Autenticación
  const authOverlay = document.getElementById('authOverlay');
  const authTitle = document.getElementById('authTitle');
  const authSubtitle = document.getElementById('authSubtitle');
  const pinDots = document.querySelectorAll('.pin-dot');
  const keypadButtons = document.querySelectorAll('.key-btn[data-num]');
  const keyDelete = document.getElementById('keyDelete');
  const keyBiometric = document.getElementById('keyBiometric');
  const btnForgotPin = document.getElementById('btnForgotPin');

  // Modales
  const modalRecovery = document.getElementById('modalRecovery');
  const btnCancelRecovery = document.getElementById('btnCancelRecovery');
  const formRecovery = document.getElementById('formRecovery');

  // Estado Local
  let currentPinBuffer = '';
  let isSettingUpPin = !AuthModule.hasConfiguredPin();
  let tempSetupPin = '';
  let activeCategoryFilter = 'todas';
  let searchQuery = '';

  /* ==========================================================================
     1. GESTIÓN DE TEMA (CLARO / OSCURO)
     ========================================================================== */
  function initTheme() {
    const savedTheme = localStorage.getItem('control_ethan_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
  }

  function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('control_ethan_theme', newTheme);
    updateThemeIcon(newTheme);
    showToast(`Modo ${newTheme === 'dark' ? 'Oscuro' : 'Claro'} activado`, 'info');
  }

  function updateThemeIcon(theme) {
    if (!themeToggleBtn) return;
    if (theme === 'light') {
      themeToggleBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;
    } else {
      themeToggleBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;
    }
  }

  themeToggleBtn.addEventListener('click', toggleTheme);
  initTheme();

  /* ==========================================================================
     2. GESTIÓN DE ACCESO (PIN 4 DÍGITOS Y BIOMETRÍA IPHONE)
     ========================================================================== */
  function initAuthFlow() {
    isSettingUpPin = !AuthModule.hasConfiguredPin();
    currentPinBuffer = '';
    updatePinDots();

    if (isSettingUpPin) {
      authTitle.textContent = 'Crear PIN de Seguridad';
      authSubtitle.textContent = 'Ingresa un PIN de 4 dígitos para proteger tu inventario';
      keyBiometric.style.display = 'none';
      btnForgotPin.style.display = 'none';
    } else {
      authTitle.textContent = 'Control Ethan';
      authSubtitle.textContent = 'Ingresa tu PIN de 4 dígitos o usa tu huella';
      keyBiometric.style.display = 'flex';
      btnForgotPin.style.display = 'block';

      // Si la biometría está configurada, intentar automáticamente al abrir
      if (AuthModule.isBiometricConfigured()) {
        setTimeout(handleBiometricAuth, 350);
      }
    }
  }

  function updatePinDots() {
    pinDots.forEach((dot, index) => {
      dot.classList.remove('error');
      if (index < currentPinBuffer.length) {
        dot.classList.add('filled');
      } else {
        dot.classList.remove('filled');
      }
    });
  }

  function shakePinDots() {
    pinDots.forEach(d => {
      d.classList.add('error');
      d.classList.remove('filled');
    });
    setTimeout(() => {
      currentPinBuffer = '';
      updatePinDots();
    }, 450);
  }

  async function handleKeypadPress(num) {
    if (currentPinBuffer.length >= 4) return;
    currentPinBuffer += num;
    updatePinDots();

    if (currentPinBuffer.length === 4) {
      if (isSettingUpPin) {
        if (!tempSetupPin) {
          // Primer paso: guardar temporal y pedir confirmación
          tempSetupPin = currentPinBuffer;
          currentPinBuffer = '';
          authTitle.textContent = 'Confirma tu PIN';
          authSubtitle.textContent = 'Vuelve a escribir los 4 dígitos';
          setTimeout(updatePinDots, 200);
        } else {
          // Segundo paso: validar confirmación
          if (currentPinBuffer === tempSetupPin) {
            const recoveryAnswer = prompt('Escribe una palabra o clave secreta para recuperar tu PIN si lo olvidas:') || 'ethan';
            await AuthModule.setupPin(tempSetupPin, recoveryAnswer);
            showToast('PIN configurado exitosamente', 'success');
            unlockApp();
          } else {
            showToast('Los PINs no coinciden. Comienza de nuevo.', 'error');
            tempSetupPin = '';
            shakePinDots();
            authTitle.textContent = 'Crear PIN de Seguridad';
            authSubtitle.textContent = 'Ingresa un PIN de 4 dígitos';
          }
        }
      } else {
        // Validación de PIN existente
        const isValid = await AuthModule.verifyPin(currentPinBuffer);
        if (isValid) {
          unlockApp();
        } else {
          shakePinDots();
          showToast('PIN incorrecto', 'error');
        }
      }
    }
  }

  function handleDeleteKey() {
    if (currentPinBuffer.length > 0) {
      currentPinBuffer = currentPinBuffer.slice(0, -1);
      updatePinDots();
    }
  }

  async function handleBiometricAuth() {
    try {
      const success = await AuthModule.authenticateBiometrics();
      if (success) {
        showToast('Acceso biométrico verificado', 'success');
        unlockApp();
      }
    } catch (err) {
      console.warn('Fallo biométrico o cancelado por usuario');
    }
  }

  keypadButtons.forEach(btn => {
    btn.addEventListener('click', () => handleKeypadPress(btn.getAttribute('data-num')));
  });

  if (keyDelete) keyDelete.addEventListener('click', handleDeleteKey);
  if (keyBiometric) keyBiometric.addEventListener('click', handleBiometricAuth);

  // Olvidé mi PIN
  if (btnForgotPin) {
    btnForgotPin.addEventListener('click', () => {
      modalRecovery.classList.remove('hidden');
    });
  }

  if (btnCancelRecovery) {
    btnCancelRecovery.addEventListener('click', () => {
      modalRecovery.classList.add('hidden');
    });
  }

  if (formRecovery) {
    formRecovery.addEventListener('submit', async (e) => {
      e.preventDefault();
      const answer = document.getElementById('recAnswer').value;
      const newPin = document.getElementById('recNewPin').value;

      try {
        await AuthModule.resetPinWithRecovery(answer, newPin);
        modalRecovery.classList.add('hidden');
        showToast('PIN restablecido con éxito', 'success');
        unlockApp();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }

  function unlockApp() {
    authOverlay.classList.add('hidden');
    loadAppData();
  }

  /* ==========================================================================
     3. NAVEGACIÓN POR PESTAÑAS (DOCK)
     ========================================================================== */
  dockItems.forEach(item => {
    item.addEventListener('click', () => {
      const targetView = item.getAttribute('data-view');
      switchView(targetView);
    });
  });

  function switchView(viewId) {
    dockItems.forEach(item => {
      item.classList.toggle('active', item.getAttribute('data-view') === viewId);
    });

    viewPanels.forEach(panel => {
      panel.classList.toggle('active', panel.id === viewId);
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ==========================================================================
     4. GESTIÓN DE DATOS Y RENDERIZADO
     ========================================================================== */
  async function loadAppData() {
    // 1. Mostrar caché local de inmediato (< 100ms)
    const cached = SheetsAPI.getCachedData() || SheetsAPI.getFallbackCatalog();
    renderAll(cached);

    // 2. Sincronizar con Google Sheets en segundo plano
    syncWithSheets();
  }

  async function syncWithSheets() {
    updateStatusIndicator('syncing');
    const result = await SheetsAPI.fetchAllData();

    if (result.success && result.data) {
      renderAll(result.data);
      updateStatusIndicator('online');
    } else if (result.isConfigured === false) {
      updateStatusIndicator('local');
    } else {
      updateStatusIndicator('offline');
    }
  }

  function updateStatusIndicator(state) {
    if (!statusIndicator) return;
    if (state === 'online') {
      statusDot.className = 'status-dot';
      statusText.textContent = 'En vivo';
    } else if (state === 'syncing') {
      statusDot.className = 'status-dot';
      statusText.textContent = 'Sincronizando...';
    } else if (state === 'local') {
      statusDot.className = 'status-dot offline';
      statusText.textContent = 'Modo Local';
    } else {
      statusDot.className = 'status-dot offline';
      statusText.textContent = 'Sin conexión';
    }
  }

  function renderAll(data) {
    renderKPIs(data.resumen?.kpis);
    renderProducts(data.resumen?.productos || []);
    renderSeriesBars(data.resumen?.productos || []);
    populateProductDropdowns(data.catalogo || []);
    renderRecentLists(data.entradas || [], data.ventas || []);
  }

  function renderKPIs(kpis) {
    if (!kpis) return;
    const formatUSD = num => '$' + (Number(num) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    
    document.getElementById('kpiVentasTotales').textContent = formatUSD(kpis.ventasTotales);
    document.getElementById('kpiInversionTotal').textContent = formatUSD(kpis.inversionTotal);
    document.getElementById('kpiUtilidadVentas').textContent = formatUSD(kpis.utilidadVentas);
    document.getElementById('kpiStockDisponible').textContent = (kpis.stockDisponible || 0) + ' und';
    document.getElementById('kpiMargenPromedio').textContent = ((kpis.margenPromedio || 0) * 100).toFixed(1) + '%';
  }

  function renderSeriesBars(productos) {
    const container = document.getElementById('seriesBarsContainer');
    if (!container) return;

    // Agrupar stock por serie
    const seriesMap = {};
    let maxStock = 1;
    productos.forEach(p => {
      const cat = p.categoria || 'Otras';
      seriesMap[cat] = (seriesMap[cat] || 0) + (p.stockActual || 0);
      if (seriesMap[cat] > maxStock) maxStock = seriesMap[cat];
    });

    const entries = Object.entries(seriesMap).sort((a, b) => b[1] - a[1]);
    container.innerHTML = entries.map(([serie, stock]) => {
      const pct = Math.max(8, (stock / maxStock) * 100);
      return `
        <div class="series-bar-item">
          <div class="series-bar-label">
            <span>${serie}</span>
            <span><strong>${stock}</strong> und</span>
          </div>
          <div class="series-bar-track">
            <div class="series-bar-fill" style="width: ${stock > 0 ? pct : 0}%;"></div>
          </div>
        </div>
      `;
    }).join('');
  }

  function renderProducts(productos) {
    const container = document.getElementById('productListContainer');
    if (!container) return;

    const filtered = productos.filter(p => {
      const matchCat = activeCategoryFilter === 'todas' || 
                       (p.categoria && p.categoria.toLowerCase().includes(activeCategoryFilter.toLowerCase()));
      const matchSearch = !searchQuery || 
                          (p.producto && p.producto.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCat && matchSearch;
    });

    if (filtered.length === 0) {
      container.innerHTML = `<div style="text-align:center; padding:30px; color:var(--text-muted); font-size:0.85rem;">No se encontraron modelos con este filtro</div>`;
      return;
    }

    container.innerHTML = filtered.map(p => {
      let badgeClass = 'badge-disponible';
      let badgeLabel = 'Disponible';
      if (p.stockActual <= 0) {
        badgeClass = 'badge-agotado';
        badgeLabel = 'Agotado';
      } else if (p.stockActual <= 3) {
        badgeClass = 'badge-stock-bajo';
        badgeLabel = 'Stock Bajo';
      }

      return `
        <div class="product-card">
          <div class="product-card-left">
            <span class="product-name">${p.producto}</span>
            <span class="product-category">${p.categoria}</span>
            <div class="product-stats">
              <span>Entradas: <strong>${p.entradas || 0}</strong></span>
              <span>Vendidos: <strong>${p.salidas || 0}</strong></span>
            </div>
          </div>
          <div class="product-card-right">
            <span class="product-stock-badge ${badgeClass}">${p.stockActual || 0} und (${badgeLabel})</span>
            <span class="product-profit">+$${(p.gananciaNeta || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>
      `;
    }).join('');
  }

  // Filtros de Categorías
  const chipButtons = document.querySelectorAll('.chip-btn');
  chipButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      chipButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeCategoryFilter = btn.getAttribute('data-filter') || 'todas';
      const cached = SheetsAPI.getCachedData() || SheetsAPI.getFallbackCatalog();
      renderProducts(cached.resumen?.productos || []);
    });
  });

  // Buscador de Productos
  const searchInput = document.getElementById('searchProductInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.trim();
      const cached = SheetsAPI.getCachedData() || SheetsAPI.getFallbackCatalog();
      renderProducts(cached.resumen?.productos || []);
    });
  }

  function populateProductDropdowns(catalogo) {
    const selEntrada = document.getElementById('selectProductoEntrada');
    const selVenta = document.getElementById('selectProductoVenta');
    if (!selEntrada || !selVenta) return;

    const optionsHtml = '<option value="">-- Seleccionar iPhone --</option>' + 
      catalogo.map(item => `<option value="${item.producto}">${item.producto}</option>`).join('');

    selEntrada.innerHTML = optionsHtml;
    selVenta.innerHTML = optionsHtml;
  }

  function renderRecentLists(entradas, ventas) {
    const listEntradas = document.getElementById('recentEntradasList');
    const listVentas = document.getElementById('recentVentasList');

    if (listEntradas) {
      if (entradas.length === 0) {
        listEntradas.innerHTML = `<div style="padding:15px; color:var(--text-muted); font-size:0.8rem; text-align:center;">Sin registros recientes</div>`;
      } else {
        listEntradas.innerHTML = entradas.slice(0, 5).map(item => `
          <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 0; border-bottom:1px solid var(--border-subtle); font-size:0.82rem;">
            <div>
              <div style="font-weight:700;">${item.producto}</div>
              <div style="font-size:0.7rem; color:var(--text-muted);">${item.fecha || ''} &bull; ${item.cantidad} unidades</div>
            </div>
            <div style="text-align:right;">
              <div style="font-weight:800; color:var(--gold-primary);">$${(item.costoTotalUsd || 0).toFixed(2)}</div>
              ${item.aplicaTasa ? `<div style="font-size:0.68rem; color:var(--text-secondary);">${(item.costoUnitarioBs || 0)} Bs/u</div>` : ''}
            </div>
          </div>
        `).join('');
      }
    }

    if (listVentas) {
      if (ventas.length === 0) {
        listVentas.innerHTML = `<div style="padding:15px; color:var(--text-muted); font-size:0.8rem; text-align:center;">Sin ventas recientes</div>`;
      } else {
        listVentas.innerHTML = ventas.slice(0, 5).map(item => `
          <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 0; border-bottom:1px solid var(--border-subtle); font-size:0.82rem;">
            <div>
              <div style="font-weight:700;">${item.producto}</div>
              <div style="font-size:0.7rem; color:var(--text-muted);">${item.fecha || ''} &bull; ${item.cantidad} unidades</div>
            </div>
            <div style="text-align:right;">
              <div style="font-weight:800; color:var(--emerald-bright);">$${(item.totalVentaUsd || 0).toFixed(2)}</div>
              ${item.aplicaTasa ? `<div style="font-size:0.68rem; color:var(--text-secondary);">${(item.precioUnitarioBs || 0)} Bs/u</div>` : ''}
            </div>
          </div>
        `).join('');
      }
    }
  }

  /* ==========================================================================
     5. FORMULARIOS: ENTRADA Y VENTA
     ========================================================================== */
  // Conectar auto-conversión y visibilidad condicional BCV
  BCVModule.bindFormConversion({
    chkAplicaId: 'chkAplicaTasaEntrada',
    containerTasaId: 'containerTasaEntrada',
    inputTasaId: 'inputTasaEntrada',
    inputBsId: 'inputCostoBsEntrada',
    inputUsdId: 'inputCostoUsdEntrada',
    inputCantidadId: 'inputCantidadEntrada',
    displayTotalUsdId: 'displayTotalUsdEntrada'
  });

  BCVModule.bindFormConversion({
    chkAplicaId: 'chkAplicaTasaVenta',
    containerTasaId: 'containerTasaVenta',
    inputTasaId: 'inputTasaVenta',
    inputBsId: 'inputPrecioBsVenta',
    inputUsdId: 'inputPrecioUsdVenta',
    inputCantidadId: 'inputCantidadVenta',
    displayTotalUsdId: 'displayTotalUsdVenta'
  });

  // Pre-llenar fecha de hoy
  const todayStr = new Date().toISOString().split('T')[0];
  const inputFechaEntrada = document.getElementById('inputFechaEntrada');
  const inputFechaVenta = document.getElementById('inputFechaVenta');
  if (inputFechaEntrada) inputFechaEntrada.value = todayStr;
  if (inputFechaVenta) inputFechaVenta.value = todayStr;

  // Actualizar Ticker BCV en Header/Dashboard
  function updateBcvUI() {
    const rate = BCVModule.getRate();
    const rateEl = document.getElementById('bcvRateDisplay');
    const dateEl = document.getElementById('bcvDateDisplay');
    if (rateEl) rateEl.textContent = rate > 0 ? `${rate.toFixed(2)} Bs/$` : 'Consultando...';
    if (dateEl) dateEl.textContent = BCVModule.getLastUpdatedFormatted();
  }

  window.addEventListener('bcvRateUpdated', updateBcvUI);
  updateBcvUI();

  const btnRefreshBcv = document.getElementById('btnRefreshBcv');
  if (btnRefreshBcv) {
    btnRefreshBcv.addEventListener('click', async () => {
      btnRefreshBcv.classList.add('spinning');
      await BCVModule.fetchRate(true);
      btnRefreshBcv.classList.remove('spinning');
      showToast('Tasa BCV actualizada', 'info');
    });
  }

  // Envío Formulario Entrada
  const formEntrada = document.getElementById('formEntrada');
  if (formEntrada) {
    formEntrada.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = formEntrada.querySelector('button[type="submit"]');
      btn.disabled = true;
      btn.textContent = 'Guardando...';

      const payload = {
        fecha: inputFechaEntrada.value,
        producto: document.getElementById('selectProductoEntrada').value,
        cantidad: document.getElementById('inputCantidadEntrada').value,
        aplicaTasa: document.getElementById('chkAplicaTasaEntrada').checked,
        tasaBCV: document.getElementById('inputTasaEntrada').value,
        costoUnitarioBs: document.getElementById('inputCostoBsEntrada').value,
        costoUnitarioUsd: document.getElementById('inputCostoUsdEntrada').value
      };

      if (!payload.producto) {
        showToast('Selecciona un modelo de iPhone', 'error');
        btn.disabled = false;
        btn.textContent = 'Registrar Entrada';
        return;
      }

      const res = await SheetsAPI.registrarEntrada(payload);
      btn.disabled = false;
      btn.textContent = 'Registrar Entrada';

      if (res.success) {
        showToast(res.message || 'Entrada registrada en Sheet', 'success');
        formEntrada.reset();
        inputFechaEntrada.value = todayStr;
        document.getElementById('chkAplicaTasaEntrada').dispatchEvent(new Event('change'));
        const cached = SheetsAPI.getCachedData() || SheetsAPI.getFallbackCatalog();
        renderAll(cached);
        switchView('viewDashboard');
      } else {
        showToast(res.error || 'Error al registrar', 'error');
      }
    });
  }

  // Envío Formulario Venta
  const formVenta = document.getElementById('formVenta');
  if (formVenta) {
    formVenta.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = formVenta.querySelector('button[type="submit"]');
      btn.disabled = true;
      btn.textContent = 'Guardando...';

      const payload = {
        fecha: inputFechaVenta.value,
        producto: document.getElementById('selectProductoVenta').value,
        cantidad: document.getElementById('inputCantidadVenta').value,
        aplicaTasa: document.getElementById('chkAplicaTasaVenta').checked,
        tasaBCV: document.getElementById('inputTasaVenta').value,
        precioUnitarioBs: document.getElementById('inputPrecioBsVenta').value,
        precioUnitarioUsd: document.getElementById('inputPrecioUsdVenta').value
      };

      if (!payload.producto) {
        showToast('Selecciona un modelo de iPhone', 'error');
        btn.disabled = false;
        btn.textContent = 'Registrar Venta';
        return;
      }

      const res = await SheetsAPI.registrarVenta(payload);
      btn.disabled = false;
      btn.textContent = 'Registrar Venta';

      if (res.success) {
        showToast(res.message || 'Venta registrada en Sheet', 'success');
        formVenta.reset();
        inputFechaVenta.value = todayStr;
        document.getElementById('chkAplicaTasaVenta').dispatchEvent(new Event('change'));
        const cached = SheetsAPI.getCachedData() || SheetsAPI.getFallbackCatalog();
        renderAll(cached);
        switchView('viewDashboard');
      } else {
        showToast(res.error || 'Error al registrar venta', 'error');
      }
    });
  }

  /* ==========================================================================
     6. AJUSTES Y CONFIGURACIÓN (URL APPS SCRIPT, BIOMETRÍA)
     ========================================================================== */
  const inputGasUrl = document.getElementById('inputGasUrl');
  const btnSaveGasUrl = document.getElementById('btnSaveGasUrl');
  const btnSyncNow = document.getElementById('btnSyncNow');
  const btnSetupBiometrics = document.getElementById('btnSetupBiometrics');
  const btnResetData = document.getElementById('btnResetData');

  if (inputGasUrl) {
    inputGasUrl.value = SheetsAPI.getScriptUrl();
  }

  if (btnSaveGasUrl) {
    btnSaveGasUrl.addEventListener('click', () => {
      const url = inputGasUrl.value.trim();
      SheetsAPI.setScriptUrl(url);
      showToast('URL de Apps Script guardada', 'success');
      syncWithSheets();
    });
  }

  if (btnSyncNow) {
    btnSyncNow.addEventListener('click', async () => {
      showToast('Sincronizando con Google Sheets...', 'info');
      await syncWithSheets();
      showToast('Datos actualizados', 'success');
    });
  }

  if (btnSetupBiometrics) {
    btnSetupBiometrics.addEventListener('click', async () => {
      try {
        const ok = await AuthModule.registerBiometrics();
        if (ok) {
          showToast('Touch ID / Face ID configurado exitosamente', 'success');
        }
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }

  if (btnResetData) {
    btnResetData.addEventListener('click', () => {
      if (confirm('¿Estás seguro de restablecer el caché local? No se perderán datos en Google Sheets.')) {
        localStorage.removeItem('control_ethan_sheets_data');
        location.reload();
      }
    });
  }

  /* ==========================================================================
     7. TOAST NOTIFICACIONES
     ========================================================================== */
  function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 2800);
  }

  // Iniciar flujo de autenticación al arrancar
  initAuthFlow();

  // Registrar Service Worker para PWA en iOS
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch(err => {
        console.log('SW registration error:', err);
      });
    });
  }
});

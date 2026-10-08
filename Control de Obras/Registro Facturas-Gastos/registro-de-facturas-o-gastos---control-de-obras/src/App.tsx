import React, { useState, useEffect } from 'react';
import { GastoRecord, BdOptions } from './types';
import { Header } from './components/Header';
import { FormGastos } from './components/FormGastos';
import { HistorialOrdenes } from './components/HistorialOrdenes';
import { BdManagerModal } from './components/BdManagerModal';
import { GoogleSheetsModal, SheetsConfig } from './components/GoogleSheetsModal';
import { ToastNotification, ToastMessage } from './components/ToastNotification';
import { INITIAL_BD_OPTIONS } from './data/initialBd';
import { INITIAL_GASTOS } from './data/initialGastos';

export default function App() {
  const [darkMode, setDarkMode] = useState<boolean>(false);

  // Data state
  const [gastos, setGastos] = useState<GastoRecord[]>(INITIAL_GASTOS);
  const [bdOptions, setBdOptions] = useState<BdOptions>(INITIAL_BD_OPTIONS);
  const [bdModalOpen, setBdManagerOpen] = useState(false);
  const [sheetsModalOpen, setSheetsModalOpen] = useState(false);
  const [sheetsConnected, setSheetsConnected] = useState(false);
  const [saving, setSaving] = useState(false);

  // Toast notifications state
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: 'success' | 'error' | 'info', title: string, message: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const newToast: ToastMessage = { id, type, title, message };
    setToasts((prev) => [...prev, newToast]);

    // Auto dismiss after 6 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 6000);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Check Google Sheets connection status and enforce persistent URL sync
  const checkSheetsConfig = async () => {
    try {
      const res = await fetch('/api/sheets/config');
      if (res.ok) {
        const data: SheetsConfig = await res.json();
        let currentUrl = data.webAppUrl?.trim() || '';

        // Backup to localStorage
        if (currentUrl) {
          localStorage.setItem('persistent_webAppUrl', currentUrl);
        } else {
          // If server config lost URL, restore from client localStorage
          const cachedUrl = localStorage.getItem('persistent_webAppUrl');
          if (cachedUrl) {
            currentUrl = cachedUrl;
            await fetch('/api/sheets/config', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                webAppUrl: cachedUrl,
                spreadsheetId: data.spreadsheetId || '',
                sheetName: data.sheetName || 'Hoja 1',
                accessToken: data.accessToken || '',
                autoSync: true,
              }),
            });
          }
        }

        const connected = Boolean(currentUrl || (data.spreadsheetId?.trim() && data.accessToken?.trim()));
        setSheetsConnected(connected);
      }
    } catch (err) {
      console.warn('Could not check sheets config:', err);
    }
  };

  // Synchronize Dark Mode class on <html> tag
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Load data from Express backend API with Google Sheets live sync
  const fetchGastos = async () => {
    try {
      // Try active sync from sheets first if configured
      const syncRes = await fetch('/api/gastos/sync-from-sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (syncRes.ok) {
        const syncData = await syncRes.json();
        if (Array.isArray(syncData.gastos) && syncData.gastos.length > 0) {
          setGastos(syncData.gastos);
          return;
        }
      }
    } catch (e) {
      console.warn('Sync from sheets attempt failed, falling back to GET /api/gastos');
    }

    try {
      const res = await fetch(`/api/gastos?sync=true&_t=${Date.now()}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Fallo al conectar con el servidor');
      const data = await res.json();
      if (Array.isArray(data)) {
        setGastos(data);
      }
    } catch (error) {
      console.warn('Backend endpoint unavailable, using local memory state:', error);
    }
  };

  const fetchBd = async () => {
    try {
      const res = await fetch('/api/bd');
      if (!res.ok) throw new Error('Fallo al cargar base de datos');
      const data = await res.json();
      if (data && typeof data === 'object') {
        setBdOptions(data);
      }
    } catch (error) {
      console.warn('Backend BD endpoint unavailable, using initial options:', error);
    }
  };

  useEffect(() => {
    fetchGastos();
    fetchBd();
    checkSheetsConfig();
  }, []);

  // Save new expense records
  const handleSaveGastoRecords = async (
    newRecords: GastoRecord[],
    resetAll: boolean
  ): Promise<boolean> => {
    setSaving(true);
    try {
      const res = await fetch('/api/gastos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRecords),
      });

      if (!res.ok) {
        throw new Error('No se pudo guardar la información en el archivo de base de datos.');
      }

      const result = await res.json();
      const savedItems: GastoRecord[] = result.items || newRecords;

      // Update state locally
      setGastos((prev) => [...savedItems, ...prev]);

      // If backend updated BD options from new expenses, update state
      if (result.bd) {
        setBdOptions(result.bd);
      }

      if (result.sheetsSynced) {
        addToast(
          'success',
          '¡Guardado y Sincronizado!',
          `Se guardaron ${savedItems.length} ítem(s) en la base local y se enviaron directamente a tu Google Sheet.`
        );
      } else if (result.sheetsError) {
        addToast(
          'info',
          'Guardado localmente',
          `Se guardaron ${savedItems.length} ítem(s) en local, pero hubo un detalle con Google Sheets: ${result.sheetsError}`
        );
      } else {
        addToast(
          'success',
          '¡Registro guardado con éxito!',
          `Se guardaron ${savedItems.length} ítem(s) en la base local. Conecta Google Sheets arriba para sincronizar en tiempo real.`
        );
      }

      return true;
    } catch (err: any) {
      console.error('Error saving record:', err);
      // Fallback local save if server fails
      setGastos((prev) => [...newRecords, ...prev]);

      addToast(
        'error',
        'Error de conexión con el archivo',
        err.message || 'No se pudo conectar con el servidor backend.'
      );
      return true;
    } finally {
      setSaving(false);
    }
  };

  // Add new BD option
  const handleAddBdOption = async (category: keyof BdOptions, value: string) => {
    try {
      const res = await fetch('/api/bd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, value }),
      });

      if (res.ok) {
        const data = await res.json();
        setBdOptions(data.bd);
      } else {
        // Fallback update
        setBdOptions((prev) => {
          const current = prev[category] || [];
          if (!current.includes(value)) {
            return { ...prev, [category]: [...current, value] };
          }
          return prev;
        });
      }

      addToast('success', 'Opción registrada', `Se agregó "${value}" a la lista de ${category}.`);
    } catch (error) {
      // Fallback update
      setBdOptions((prev) => {
        const current = prev[category] || [];
        if (!current.includes(value)) {
          return { ...prev, [category]: [...current, value] };
        }
        return prev;
      });
      addToast('info', 'Guardado local', `Se registró "${value}" en la lista activa.`);
    }
  };

  // Sync BD options with Google Sheets BD tab
  const handleSyncBdOptions = async () => {
    try {
      const res = await fetch('/api/bd/sync', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.bd) {
          setBdOptions(data.bd);
        }
        addToast(
          'success',
          '¡Listas Sincronizadas!',
          'Se han cargado y reemplazado las opciones locales con las de la pestaña BD de Google Sheets.'
        );
      } else {
        throw new Error('Fallo al sincronizar con Google Sheets');
      }
    } catch (err: any) {
      addToast(
        'error',
        'Error de Sincronización',
        err.message || 'No se pudo conectar con la pestaña BD de Google Sheets.'
      );
    }
  };

  // Delete option from local BD
  const handleDeleteBdOption = async (category: keyof BdOptions, value: string) => {
    try {
      const response = await fetch('/api/bd', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, value }),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.bd) {
          setBdOptions(data.bd);
        }
        addToast('success', 'Opción Eliminada', `Se eliminó "${value}" de la lista.`);
      }
    } catch (error) {
      console.error('Error deleting option:', error);
    }
  };

  // Clear all local BD options
  const handleClearBdOptions = async () => {
    try {
      const response = await fetch('/api/bd/clear', { method: 'POST' });
      if (response.ok) {
        const data = await response.json();
        if (data.bd) {
          setBdOptions(data.bd);
        }
        addToast('info', 'Base Local Limpiada', 'Se limpiaron las opciones guardadas en la base local.');
      }
    } catch (error) {
      console.error('Error clearing BD options:', error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
      {/* Top Header Navigation & Logo */}
      <Header
        onOpenSheetsModal={() => setSheetsModalOpen(true)}
        sheetsConnected={sheetsConnected}
      />

      {/* Main Body Section */}
      <main className="pb-12 space-y-8">
        <FormGastos
          bdOptions={bdOptions}
          existingGastos={gastos}
          onSave={handleSaveGastoRecords}
          onOpenBdManager={() => setBdManagerOpen(true)}
          onOpenSheetsModal={() => setSheetsModalOpen(true)}
          onAddOption={handleAddBdOption}
          onRefreshData={fetchGastos}
          saving={saving}
        />

        {/* Sección: Historial de las Últimas 5 Órdenes (Solo Lectura) */}
        <HistorialOrdenes gastos={gastos} onRefreshData={fetchGastos} />
      </main>

      {/* BD Manager Modal */}
      <BdManagerModal
        isOpen={bdModalOpen}
        onClose={() => setBdManagerOpen(false)}
        bdOptions={bdOptions}
        onAddOption={handleAddBdOption}
        onDeleteOption={handleDeleteBdOption}
        onSyncBd={handleSyncBdOptions}
        onClearBd={handleClearBdOptions}
      />

      {/* Google Sheets Modal */}
      <GoogleSheetsModal
        isOpen={sheetsModalOpen}
        onClose={() => setSheetsModalOpen(false)}
        onConfigSaved={() => {
          checkSheetsConfig();
          fetchBd();
        }}
      />

      {/* Toast Notifications */}
      <ToastNotification toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

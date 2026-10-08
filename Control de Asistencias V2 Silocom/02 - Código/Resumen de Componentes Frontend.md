---
tipo: codigo
proyecto: Control de Asistencias V2 Silocom
seccion: Resumen de Componentes Frontend
creado: 2026-09-09
---

# Resumen de Componentes Frontend

> [!info] Stack
> React 19 + Vite 6 + TypeScript + Tailwind CSS v4 + lucide-react + motion. PWA con manifest y service worker.

## Estructura de carpetas

```
src/
├── App.tsx              # Orquestador principal
├── main.tsx             # Bootstrap + registro SW
├── types.ts             # Tipos del dominio
├── index.css            # Tailwind + estilos globales (dark)
├── vite-env.d.ts        # Tipos de Vite
├── components/          # UI (ver tabla)
├── services/            # storage, sheetsSync, notificationService, pushService
├── utils/               # geo (Haversine), device (ID dispositivo)
├── hooks/               # usePWAInstall
└── data/                # gasScript.ts (config del GAS / acciones)
```

## Componentes

| Componente | Archivo | Descripción |
| --- | --- | --- |
| `App` | `App.tsx` | Carga config/datos, resuelve admin, maneja marcaje y refresco en vivo |
| `Header` | `components/Header.tsx` | Cabecera con logo, hora, botones admin e instalar |
| `SilocomLogo` | `components/SilocomLogo.tsx` | Logo SVG |
| `GPSIndicator` | `components/GPSIndicator.tsx` | Estado de geolocalización (buscando/dentro/fuera) |
| `PunchCard` | `components/PunchCard.tsx` | Botones Entrada/Salida + estado de hoy + ID de dispositivo |
| `FeedbackModal` | `components/FeedbackModal.tsx` | Resultado del marcaje (éxito/error) |
| `LiveClock` | `components/LiveClock.tsx` | Reloj en vivo |
| `ShiftTimeline` | `components/ShiftTimeline.tsx` | Línea visual del turno 08:00–17:00 |
| `AdminModal` | `components/AdminModal.tsx` | Panel admin (5 pestañas) |
| `PWAInstallButton` | `components/PWAInstallButton.tsx` | Instalación PWA (incl. guía iOS) |

## Servicios

| Servicio | Archivo | Responsabilidad |
| --- | --- | --- |
| `StorageService` | `services/storage.ts` | `localStorage`: empleados, registros, device ID, flags diarios; datos semilla (VICTOR + EVALERO, ago-sep 2026) |
| `SheetsSyncService` | `services/sheetsSync.ts` | Lectura: GAS `obtenerDatos` → fallback **GViz** (`gviz/tq?sheet=`); Escritura: POST `text/plain` sin preflight |
| `NotificationService` | `services/notificationService.ts` | Avisos locales 07:45/08:30/16:30, una vez por día, check cada 20 s |
| `PushService` | `services/pushService.ts` | Suscripción Web Push (VAPID pública), guardado en GAS, `mostrarNotificacion` |

## Utilidades

| Utilidad | Archivo | Descripción |
| --- | --- | --- |
| `haversine` + validaciones | `utils/geo.ts` | Distancia al epicentro (km) y comprobación de radio (60 m) |
| `getDeviceId` | `utils/device.ts` | Genera/lee `DEV-XXXXXX` en local |

## Datos de configuración

| Módulo | Contenido |
| --- | --- |
| `data/gasScript.ts` | URL del webhook GAS (de env), sheet ID, y mapa de acciones (`registrarAsistencia`, `guardarSuscripcionPush`, etc.) |

## PWA / assets

| Archivo | Rol |
| --- | --- |
| `index.html` | Shell HTML, carga script y registra `sw.js` |
| `public/manifest.json` | Manifiesto (nombre, tema, iconos) |
| `public/sw.js` | Service worker: cache + push + `notificationclick` |
| `public/icons/` | Iconos generados por `scripts/generate-icons.js` |

## Flujo de inicio (App.tsx)

1. Lee env (`VITE_GOOGLE_APPS_SCRIPT_URL`, `VITE_GOOGLE_SHEET_ID`, `VITE_ADMIN_EMAIL`, `VITE_OFFICE_*`).
2. Carga config + empleados + registros (localStorage → GAS/GViz).
3. Detecta si el usuario es admin (email igual al configurado) y habilita el botón admin.
4. Registra el cron de notificaciones locales y la suscripción push si faltaba.
5. Renderiza tarjeta de marcaje + reloj + línea de turno.

## Notas de mantenimiento

- `package.json` aparece como `react-example` (resto del scaffol de Vite) — no afecta el funcionamiento.
- En `storage.ts`, `getEmpleados` filtra IDs como `mmorillo`/`cmendez` (legado de pruebas de la V1); revisarlos si esos empleados son reales.
- El frontend **no consume `GEMINI_API_KEY`** directamente (está declarada en `.env.example`; según `metadata.json` se usa como capacidad server-side/AI Studio).
---
tipo: documentacion
proyecto: Control de Asistencias V2 Silocom
seccion: Ficha Tecnica
creado: 2026-09-09
actualizado: 2026-09-10
---

# 06 - Ficha Tecnica

## Identificación

| Campo | Valor |
| --- | --- |
| Sistema | Control de Asistencias V2 Silocom |
| Empresa | Silocom, C.A. (RIF J-30725192-1) |
| Versión del GAS | 2.6 (sin triggers; horarios dinámicos gestionados por Railway) |
| Deploy | Railway — servidor Express persistente (`silocom-production.up.railway.app`) |
| Fecha de documentación | 2026-09-09 (actualizada 2026-09-10) |
| Estado | Activo (en pruebas) |

## Stack técnico

| Capa | Tecnología |
| --- | --- |
| Framework frontend | React 19 + Vite 6 + TypeScript |
| Estilos | Tailwind CSS v4 |
| Iconos / animaciones | lucide-react, motion |
| PWA | manifest.json + service worker (`public/sw.js`) |
| Servidor | **Express (Node.js) en Railway** — `server.ts` (compilado con esbuild a `dist/server.cjs`), sirve frontend + API + scheduler + Web Push (`web-push`) |
| Scheduler | `setInterval` cada 30 s en hora Caracas (Pendulum) — horarios dinámicos desde Sheets |
| Backend de datos | Google Apps Script v2.6 (`doGet`/`doPost`) — **sin triggers** |
| Almacenamiento | Google Sheets (3 hojas) + `push_subscriptions.json`/`server_config.json` (volumen Railway) + localStorage (caché frontend) |
| SDK notas / extras | `@google/genai` (en package.json; indica capacidades server-side Gemini en metadata.json) |

## Geocerca

| Parámetro | Valor |
| --- | --- |
| Latitud epicentro (README / Codigo.gs / geo.ts) | 10.494505 |
| Longitud epicentro | -66.831454 |
| Radio | 60 m (0.06 km) |
| Fórmula | Haversine (en `src/utils/geo.ts`, idéntica a la del GAS) |

> [!note] Coordenadas confirmadas (2026-09-09)
> Epicentro real: `10.494505, -66.831454` — **confirmado por el usuario y corregido en el GAS v2.6**.

## Horario y estados

| Evento | Hora | Estado resultante |
| --- | --- | --- |
| Entrada esperada | 08:00 | TEMPRANO (antes de 07:30), A TIEMPO (hasta 08:30), RETARDO (después) |
| Tolerancia | 30 min | — |
| Salida esperada | 17:00 | — |
| Cierre automático | 17:30 | SALIDA 17:00 con `CIERRE X SISTEMA`, ubicación `CIERRE AUTOMATICO / SISTEMA` |
| Avisos push (Railway) | 07:45 / 08:30 / 16:45 / 17:30 | Disparados por el **scheduler del servidor**, horarios leídos de `Configuracion` (Sheet) |

## Seguridad y antifraude

| Mecanismo | Detalle |
| --- | --- |
| ID de dispositivo | `DEV-XXXXXX` generado por `device.ts` y persistido en `localStorage` |
| Vínculo dispositivo–empleado | El primer marcaje vincula el dispositivo al ID del empleado; marcajes con otro dispositivo → `DISPOSITIVO_INVALIDO` (suplantación) |
| Validación de ubicación | Fuera del radio → `INVALID_UBICACION` (bloqueado) |
| Admin | Se valida contra la **celda D2** de `Configuracion` (valor: `silocomca` — un ID, NO un correo). El frontend aún acepta valores legacy (`admin`, correos); recomendado restringirlo a D2 (ver nota abajo) |
| API push | Header `x-push-secret` == `PUSH_API_SECRET` (`silocom_push_sec_2026`) — valida el `server.ts` de Railway |

> [!note] Regla de admin definida por el usuario (2026-09-09)
> El acceso admin se valida contra la **celda D2** de la hoja `Configuracion`: debe contener `silocomca` (un ID corto que el administrador conoce), **no** un correo. Pendiente: ajustar el frontend para que solo acepte el valor de D2 (hoy también acepta `admin` y correos).

## Variables de entorno (resumen)

Ver lista completa en [[05 - URLs y Accesos]]. Las críticas en producción (Railway): `GOOGLE_APPS_SCRIPT_URL`, `VITE_GOOGLE_APPS_SCRIPT_URL`, `VITE_GOOGLE_SHEET_ID`, `VITE_ADMIN_EMAIL`, VAPID (pública y privada), `PUSH_API_SECRET`, `PORT`.

> [!warning] Claves VAPID
> Las VAPID keys se inyectan por entorno en Railway (`VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`). Mantén la privada solo en Railway env vars — el `server.ts` valida que existan (sin fallback hardcodeado). Ver [[Solución de Problemas]].

## Scripts y comandos

| Comando | Uso |
| --- | --- |
| `npm install` | Instalar dependencias |
| `npm run dev` | Desarrollo (Vite, con `pushDevPlugin` para `/api/send-push` local) |
| `npm run build` | `vite build && esbuild server.ts` → `dist/` + `dist/server.cjs` |
| `npm start` | `node dist/server.cjs` (comando de arranque en Railway) |
| `npm run preview` | Previsualizar build |
| `node scripts/generate-icons.js` | Regenerar iconos PWA |

## Datos de referencia (build)

- `package.json`: name `react-example`, dependencias principales: `react`, `vite`, `tailwindcss`, `lucide-react`, `motion`, `web-push`, `express`, `dotenv`, `node-cron`, `pendulum`, `@google/genai`.
- `metadata.json`: permission `geolocation` + `MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API`.
- `vite.config.ts`: plugin de React + `pushDevPlugin` para emular `/api/send-push` en dev.
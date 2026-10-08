---
tipo: documentacion
proyecto: Control de Asistencias V2 Silocom
seccion: Arquitectura y Componentes
creado: 2026-09-09
actualizado: 2026-09-10
---

# 02 - Arquitectura y Componentes

## Diagrama de contexto

```
[ Empleado (celular/PWA) ]
        │  marcaje + ubicación + suscripción push
        ▼
[ Frontend React (servido por Express en Railway) ]
        │  lee/escribe (lectura via GAS / GViz; escritura via proxy)
        ▼
[ Google Sheets ]
        ▲
[ Google Apps Script v2.6 (webhook) ]
        ▲
[ Express Server (Railway) ───────────────────────────────────────────────┐
   ├─ sirve dist/ (frontend compilado) + SPA fallback                      │
   ├─ /api/attendance    → proxy a GAS (registrarAsistencia)               │
   ├─ /api/verify-admin  → proxy/fallback a GAS                            │
   ├─ /api/admin-summary → proxy a GAS (obtenerDatos)                      │
   ├─ /api/push-subscription → guarda suscripción local (JSON) → GAS       │
   ├─ /api/send-push     → web-push (VAPID) → Push Service del teléfono    │
   ├─ /api/send-notification → broadcast a todos los suscritos             │
   ├─ /api/sync-schedule → fuerza lectura de horarios desde Sheets         │
   └─ Scheduler (setInterval 30s, hora Caracas) ── dispara recordatorios ──┘
```

**Punto clave de la nueva arquitectura:** el servidor Express de Railway es **todo-en-uno**: sirve el frontend, expone la API REST, ejecuta el **scheduler autónomo** (setInterval cada 30 s en hora Caracas) y gestiona el Web Push. Ya **no se instalan triggers en Apps Script**; Railway lee los horarios dinámicos desde la hoja `Configuracion` y los aplica en tiempo real.

## Frontend (React)

| Componente / módulo | Archivo | Responsabilidad |
| --- | --- | --- |
| App | `src/App.tsx` | Orquestador: estado global (config, empleados, registros, admin, ubicación, notificaciones) |
| Entrada | `src/main.tsx` | Bootstrap de React + registro del service worker |
| Tipos | `src/types.ts` | `Empleado`, `RegistroAsistencia`, `ConfigSistema`, `ResultadoPunch`, `EstadoHoy`, etc. |
| Marcaje | `src/components/PunchCard.tsx` | Botón Entrada/Salida, validación de geocerca y envío del marcaje |
| GPS | `src/components/GPSIndicator.tsx` | Estado del GPS (buscando / dentro / fuera de rango) |
| Reloj | `src/components/LiveClock.tsx` | Reloj en vivo de la sede y línea del turno |
| Línea de turno | `src/components/ShiftTimeline.tsx` | Barra visual de 08:00 → 17:00 con eventos |
| Cabecera | `src/components/Header.tsx` | Título, logo, hora, botón admin y botón instalar PWA |
| Logo | `src/components/SilocomLogo.tsx` | Logo SVG de Silocom |
| Feedback | `src/components/FeedbackModal.tsx` | Modal de resultado del marcaje (éxito / error / fuera de rango) |
| Admin | `src/components/AdminModal.tsx` | Panel admin con 5 pestañas (Resumen, Métricas, Empleados, Configuración, Código) |
| Instalar PWA | `src/components/PWAInstallButton.tsx` | Botón de instalación de la PWA (iOS + navegadores) |
| Hook PWA | `src/hooks/usePWAInstall.ts` | Detección del evento `beforeinstallprompt` |
| Almacenamiento | `src/services/storage.ts` | `localStorage` de empleados/registros + datos semilla de desarrollo |
| Sincronización | `src/services/sheetsSync.ts` | Lectura vía GAS con fallback **GViz** y escritura vía GAS |
| Notificaciones locales | `src/services/notificationService.ts` | Programador de avisos locales (07:45/08:30/16:30) |
| Push | `src/services/pushService.ts` | Suscripción Web Push, envío a GAS/HTTP, `mostrarNotificacion` |
| Geolocalización | `src/utils/geo.ts` | Fórmula de **Haversine** y validación de radio |
| Dispositivo | `src/utils/device.ts` | Generación/lectura del ID de dispositivo `DEV-XXXXXX` |
| Datos GAS | `src/data/gasScript.ts` | Config del GAS (URL del webhook, sheet ID, acciones disponibles) |

## Servidor Express (Railway) — `server.ts`

Servidor **persistente** (Node.js, corre 24/7 en Railway). Middlewares: `express.json`, CORS habilitado, y helpers de hora Caracas.

| Endpoint | Método | Función |
| --- | --- | --- |
| `/api/vapid-public-key` | GET | Devuelve `{ publicKey }` (clave pública VAPID) |
| `/api/push-subscription` | POST | Guarda la suscripción en `push_subscriptions.json` (local) y la replica al GAS (`guardarSuscripcionPush`) |
| `/api/send-push` | POST | Valida `x-push-secret`/`secret`; despacha con `web-push` (soporta retardo `delaySeconds`); elimina endpoints caducados (404/410) |
| `/api/send-notification` | POST | Broadcast a todos los suscriptores guardados |
| `/api/attendance` | POST | Proxy: reenvía el marcaje al GAS (`registrarAsistencia`) |
| `/api/verify-admin` | POST | Verifica admin; fallback local (`silocomca`/`admin`) |
| `/api/admin-summary` | POST | Proxy al GAS (`obtenerDatos`); fallback dataset vacío |
| `/api/config` | GET/POST | Lee/guarda `server_config.json` (webhookUrl, VAPID, secreto) |
| `/api/test-webhook` | POST | PING al GAS webhook |
| `/api/schedule-status` | GET | Estado del scheduler y hora Caracas actual |
| `/api/sync-schedule` | POST | Fuerza la sincronización de horarios desde Sheets |

### Scheduler autónomo (sin triggers GAS)

- `setInterval` cada **30 s** en hora Caracas.
- Cada ciclo lee `obtenerConfiguracion` del GAS (máx. 1 vez cada 5 min) y actualiza los horarios:
  - `recordatorioEntrada` (07:45), `avisoOlvidoEntrada` (08:30), `avisoPrevioSalida` (16:45/16:30), `cierreAutomatico` (17:30).
- De lunes a viernes dispara: recordatorio de entrada, aviso de olvido inteligente (consulta `obtenerDatos` y avisa a los que NO marcaron entrada hoy), recordatorio de salida, y cierre automático (`ejecutarCierreAutomatico`).
- Usa banderas `lastDispatchedDate_*` para no repetir en el mismo día.

## Backend GAS v2.6 (`google-apps-script/Codigo.gs`)

> [!note] Versión 2.6 — sin triggers
> A partir de esta versión **NO se instalan activadores en Apps Script**. Railway gestiona el 100% de los horarios. El GAS queda como **base de datos e interfaz de lectura/escritura** sobre Google Sheets.

| Función | Acción | Propósito |
| --- | --- | --- |
| `doGet` | `obtenerConfiguracion`, `obtenerDatos` | Lecturas (config + registros/empleados) |
| `doPost` | `registrarAsistencia`, `guardarSuscripcionPush`, `ejecutarCierreAutomatico`, `eliminarTriggersHorarios` | Escrituras y operaciones |
| `leerBaseDeDatosCompleta` | — | Lee `Asistencias` + `Configuracion` + `DispositivosPush` |
| `registrarNuevaAsistencia` | — | Escribe un marcaje en `Asistencias` (A–F) |
| `guardarSuscripcionDispositivo` | — | Guarda la suscripción en hoja `DispositivosPush` |
| `ejecutarCierreAutomaticoTurnos` | — | Cierra turnos abiertos del día (17:00, `CIERRE_AUTOMATICO`) |
| `eliminarTriggersHorarios` | — | Elimina triggers GAS viejos (ya no se usan) |
| `obtenerConfiguracionDinamica` | — | Lee horarios dinámicos desde `Configuracion` (columnas: hora entrada/salida, recordatorio entrada, aviso olvido, aviso salida, cierre, lat/lng/radio) |

## API / antiguos serverless (Vercel)

La carpeta `api/` (serveless functions de Vercel, incluida `/api/send-push.ts`) quedó **obsoleta** tras la migración a Railway y debe eliminarse. El push ahora lo gestiona el `server.ts` de Express.

## PWA (`public/`)

- `manifest.json` — nombre, iconos, tema.
- `sw.js` — service worker: cache, notificaciones push, `notificationclick` (abre/focus la app).
- `icons/` — iconos generados con `scripts/generate-icons.js` (Node, canvas).

## Google Sheets

| Hoja | Contenido |
| --- | --- |
| `Asistencias` | Registros (ID, Nombre, Fecha y Hora, Tipo, Método, Estatus + DIA/MES) |
| `Configuracion` | Admin (D2), horarios (hora entrada/salida, recordatorio 07:45, aviso olvido 08:30, aviso salida, cierre), empleados desde fila 7 (A/B/C) y parámetros (lat/lng/radio) |
| `DispositivosPush` | Suscripciones push (FECHA_REGISTRO, ID, NOMBRE, ENDPOINT, P256DH, AUTH, ESTADO) |

## Patrones clave

- **Lectura resiliente**: GAS primero, **GViz** como fallback (`sheetsSync.ts`).
- **Escritura sin preflight**: `Content-Type: text/plain` al llamar al webhook GAS.
- **Antifraude**: el primer marcaje vincula el dispositivo (`DEV-XXXXXX`) al empleado; los siguientes marcajes deben coincidir con ese ID.
- **Preservación de fórmulas**: solo se escriben columnas A–F en `Asistencias`.
- **Push centralizado en Railway**: suscripciones en `push_subscriptions.json` (locales al servidor) + réplica a `DispositivosPush` en Sheets.
- **Horarios dinámicos**: el servidor leer los recordatorios del Sheets (no hardcodeados).
---
tipo: indice
proyecto: Control de Asistencias V2 Silocom
descripcion: Control de asistencia del personal Silocom con geocerca GPS, notificaciones push (Web Push + servidor Express en Railway) y sincronizacion con Google Sheets. Version V2 desplegada en Railway.
creditos: vsolorzano
creado: 2026-09-09
actualizado: 2026-09-10
estado: Activo
---

# Control de Asistencias V2 Silocom

Sistema de control de asistencia del personal de **Silocom, C.A.** con geocerca GPS de 60 m, validación de dispositivo antifraude, notificaciones push (Web Push vía servidor Express persistente en **Railway**) y sincronización en vivo con Google Sheets mediante Google Apps Script.

> [!info] Relación con la V1
> Esta es la **V2** del sistema [[README - Control de Asistencias Silocom|Control de Asistencias Silocom]]. La diferencia clave: la V1 usaba un proxy Node.js en Railway como **capa intermedia centralizada** para webhook y push, mientras que la V2 es una app **React + Vite + TypeScript** desplegada como **servidor Express todo-en-uno en Railway** que sirve el frontend, expone la API REST, ejecuta el **scheduler autónomo de horarios dinámicos** con `setInterval` (ya NO usa triggers de Apps Script) y gestiona Web Push con `web-push`.

## Estado actual

- **Desplegado y funcionando en Railway** como servidor Express persistente (Node.js 24/7).
- Los **horarios de recordatorios se leen dinámicamente desde Google Sheets** (`Configuracion`); al cambiar una hora en el Sheet, Railway la detecta automáticamente sin reinstalar código.
- **Sin triggers de Apps Script**: los recordatorios (07:45, 08:30, 16:30) y el cierre automático (17:30) los dispara el servidor Express de Railway mediante un bucle de monitorización cada 30 s en hora Caracas.
- El código fuente está respaldado en el ZIP `control_asistenciasv2.zip` (fuente de verdad) y en parte sincronizado en esta carpeta. La carpeta local aún conserva restos de la etapa Vercel (carpeta `api/`, `package.json` sin actualizar).

## Estructura de notas

### 01 - Documentación

- [[00 - Brief del Proyecto]]
- [[01 - Vision General del Sistema]]
- [[02 - Arquitectura y Componentes]]
- [[03 - Estructura de las Hojas de Calculo]]
- [[04 - Flujo de Trabajo]]
- [[05 - URLs y Accesos]]
- [[06 - Ficha Tecnica]]
- [[07 - Diseño e Interfaz]]
- [[08 - Guía PWA y Notificaciones Push]]
- [[09 - Despliegue y Migración a Railway]]

### 02 - Código

- [[Apps Script - CODIGO GAS v2.6]]
- [[Resumen de Componentes Frontend]]
- [[API Push - send-push (Express Railway)]]
- `server.ts` — servidor Express Railway (dentro de `control_asistenciasv2.zip`; ver `02 - Código/`)

### 04 - Guías

- [[Cómo Actualizar y Desplegar]]
- [[Cómo Usar el Panel de Administración]]
- [[Solución de Problemas]]

## Datos rápidos

| Dato | Valor |
| --- | --- |
| Empresa | Silocom, C.A. (RIF J-30725192-1) |
| Epicentro geocerca | 10.494505, -66.831454 |
| Radio geocerca | 60 m |
| Horario base | Entrada 08:00 / Salida 17:00, tolerancia 30 min |
| Cierre automático | 17:30 (disparado por Railway) |
| Deploy | **Railway** (`silocom-production.up.railway.app`) |
| Servidor | Express persistente (Node.js) — sirve frontend + API + scheduler + push |
| API push | `POST /api/send-push` (Servidor Express / web-push) |
| Scheduler | `setInterval` cada 30 s en hora Caracas — horarios dinámicos desde Sheets |
| Backend datos | Google Apps Script v2.6 (webhook de la hoja) |
| Hojas usadas | `Asistencias`, `Configuracion`, `DispositivosPush` |
| Admin | `silocomca` / `vsolorzano.silocom@gmail.com` |
| PWA | Sí (manifest + service worker + push) |

## Respaldo del código

La **fuente de verdad** es el archivo `control_asistenciasv2.zip` y `Codigo.gs Control de Asistencias V2.txt` (ambos actualizados el 2026-09-10 con la migración a Railway):

- `server.ts` — servidor Express Railway: sirve `dist/`, expone `/api/*` (vapid-public-key, push-subscription, send-push, send-notification, attendance, verify-admin, admin-summary, config, test-webhook, schedule-status, sync-schedule) y ejecuta el scheduler de horarios dinámicos desde Sheets con `setInterval`.
- `google-apps-script/Codigo.gs` — **GAS v2.6**: sin triggers, Railway centraliza todo; lee horarios dinámicos desde `Configuracion`.
- `package.json` — scripts `build` (`vite build && esbuild server.ts`) y `start` (`node dist/server.cjs`); dependencia `node-cron`.
- `public/` — PWA (manifest, service worker, iconos).
- `push_subscriptions.json` (generado en Railway) — suscripciones push locales del servidor.
- `.env.example` — variables de entorno Railway (PORT, GOOGLE_APPS_SCRIPT_URL, VAPID keys, PUSH_API_SECRET, ADMIN_EMAIL, VITE_*).

> [!warning] Sincronización pendiente en la carpeta
> La carpeta local de respaldo conserva restos de la etapa Vercel: carpeta `api/` (serverless functions, ya no se usan) y `package.json` con scripts antiguos (sin `build`/`start` de Railway). El contenido vigente está en `control_asistenciasv2.zip`.
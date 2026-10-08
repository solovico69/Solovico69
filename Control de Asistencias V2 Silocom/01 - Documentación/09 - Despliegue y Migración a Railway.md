---
tipo: documentacion
proyecto: Control de Asistencias V2 Silocom
seccion: Despliegue y Migración a Railway
creado: 2026-09-09
actualizado: 2026-09-10
---

# 09 - Despliegue y Migración a Railway

## Por qué se migró de Vercel a Railway

La V2 se reconstruyó como **app React + Vite + TypeScript** y se desplegó inicialmente en **Vercel** con serverless functions para Web Push (`api/send-push.ts`). Sin embargo, el modelo **serverless de Vercel** presentó problemas de **fiabilidad en las notificaciones push**: dependían de la cuota/timing de Google Apps Script triggers y del cold start de las functions, lo que hacía que las notificaciones **no llegaran de forma fiable**.

Se decidió migrar a **Railway** como servidor **Express persistente (Node.js 24/7)** que concentra toda la lógica:

- Sirve el frontend React compilado (`dist/`).
- Expone la API REST (proxy a GAS, push, config, etc.).
- Ejecuta el **scheduler autónomo** de recordatorios y cierre automático (setInterval cada 30 s en hora Caracas).
- Lee los **horarios dinámicamente desde Google Sheets** (ya no hardcodeados ni en triggers GAS).

> [!note] Costo
> Railway es de pago (a diferencia de Vercel gratis). Para una app empresarial como esta se decidió asumir el costo (~$5/mes) a cambio de estabilidad y control. Es la misma plataforma que usa la V1.

## Arquitectura V2 en Railway

```
[ Repositorio / ZIP (control_asistenciasv2.zip) ]
        │
        ▼
[ Railway — servidor Express persistente (Node.js) ]
   ├── sirve frontend: dist/ + SPA fallback
   ├── /api/attendance, /api/verify-admin, /api/admin-summary (proxy a GAS)
   ├── /api/push-subscription, /api/send-push, /api/send-notification (web-push)
   ├── /api/config, /api/test-webhook, /api/schedule-status, /api/sync-schedule
   └── Scheduler (setInterval 30s) → recordatorios + cierre automático
        │
        ▼
[ Google Apps Script v2.6 (webhook) ] ◄── base de datos Google Sheets
```

## Cómo está montado

| Elemento | Configuración |
| --- | --- |
| Servidor | Express (Node.js) — `server.ts` compilado con esbuild a `dist/server.cjs` |
| Build | `npm run build` = `vite build && esbuild server.ts --bundle ... --outfile=dist/server.cjs` |
| Start | `npm start` = `node dist/server.cjs` |
| Puerto | `PORT` (3000) — Railway asigna su propio puerto |
| Env vars (Railway) | `PORT`, `GOOGLE_APPS_SCRIPT_URL`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `PUSH_API_SECRET`, `ADMIN_EMAIL`, y `VITE_*` |
| Persistencia | `server_config.json` (config global) y `push_subscriptions.json` (suscripciones) — se generan en el volumen de Railway |
| PWA/HTTPS | Proporcionados por Railway (dominio `*.up.railway.app` con HTTPS) |

## Pasos para desplegar en Railway

1. Subir/duplicar el contenido del ZIP `control_asistenciasv2.zip` al repositorio o crear un proyecto Railway a partir del ZIP.
2. En Railway: **New Project** → Deploy de un servicio **Node/Express**.
3. **Build command**: `npm run build` — **Start command**: `npm start`.
4. Agregar las **variables de entorno** (ver `.env.example`):
   - `GOOGLE_APPS_SCRIPT_URL` = URL del webhook GAS (terminada en `/exec`).
   - `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `PUSH_API_SECRET`.
   - `VITE_GOOGLE_APPS_SCRIPT_URL`, `VITE_GOOGLE_SHEET_ID`, `VITE_ADMIN_EMAIL`, `VITE_OFFICE_*`.
5. **Deploy**. Railway compila y corre el servidor, que sirve la PWA y la API.
6. Actualizar el GAS (v2.6): pegar `Codigo.gs` y republicar. **Ya no se instalan triggers**.
7. Si quedaban triggers viejos en Apps Script, ejecutar `eliminarTriggersHorarios` desde el editor una vez.
8. En el panel admin de la app → Configuración: verificar conectividad con el webhook GAS y probar push.

## Diferencias clave vs etapa Vercel (migración)

| Aspecto | Vercel (anterior) | Railway (actual) |
| --- | --- | --- |
| Hosting | Estático + serverless functions | Servidor Express persistente |
| Push | `/api/send-push.ts` (serverless) | `server.ts` → `web-push` |
| Disparo de notificaciones | Triggers de Google Apps Script | Scheduler autónomo en el servidor (setInterval 30 s) |
| Horarios | Hardcodeados en GAS triggers | Lectura dinámica desde `Configuracion` en Sheets |
| Suscripciones push | Hoja `DispositivosPush` (solo GAS) | `push_subscriptions.json` local (Railway) + réplica a Sheets |
| Cierre automático | Trigger GAS 17:30 | Scheduler Railway → `ejecutarCierreAutomatico` |
| Padrón de permisos/cuota | Dependía de cuota GAS | Independiente del servidor |

## Pendientes / acciones recomendadas

- [x] **Migrado a Railway** y desplegado (`silocom-production.up.railway.app`) — 2026-09-10.
- [x] **GAS v2.6** sin triggers; Railway centraliza horarios dinámicos — 2026-09-10.
- [x] **Fix scroll** del modal "Empleados & Dispositivos" en móvil y ajustes de horarios — completado con AI Studio.
- [ ] **Sincronizar la carpeta local** con el ZIP `control_asistenciasv2.zip` (agregar `server.ts`, actualizar `package.json`/`.env.example`; eliminar carpeta obsoleta `api/`).
- [ ] Confirmar que la Vercel se dio de baja para evitar costos/duplicados.
- [ ] Decidir si se restaura la limpieza >90 días en el GAS v2.6.
- [ ] Verificar la hoja `DispositivosPush` usada (¿es la misma que gestiona Railway?).

## Ver también

- [[02 - Arquitectura y Componentes]] — piezas del sistema (incluye el nuevo `server.ts`).
- [[08 - Guía PWA y Notificaciones Push]] — cómo funciona el push.
- [[Cómo Actualizar y Desplegar]] — guía práctica de despliegue.
- [[Cómo Usar el Panel de Administración]] — pruebas y configuración desde la app.
- README V2 (esta carpeta) — índice y estado actualizado.
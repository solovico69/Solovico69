---
tipo: guia
proyecto: Control de Asistencias V2 Silocom
seccion: Guias
creado: 2026-09-09
actualizado: 2026-09-10
---

# Cómo Actualizar y Desplegar

> [!info] Contexto
> La V2 se despliega en **Railway** como un **servidor Express persistente** (`server.ts`) que sirve el frontend, expone `/api/*`, ejecuta el scheduler de horarios dinámicos y gestiona Web Push. El backend de datos es **Google Apps Script v2.6** (sin triggers). El código vive en el ZIP `control_asistenciasv2.zip` (fuente de verdad) y su respaldo en esta carpeta.

## 1. Actualizar el frontend / backend (React + Express)

1. Editar el código en la carpeta del proyecto (o extraer el ZIP `control_asistenciasv2.zip`).
2. Probar en local:

```bash
npm install
npm run dev
```

3. Verificar variables: copiar `.env.example` a `.env.local` y completar `VITE_GOOGLE_APPS_SCRIPT_URL`, `VITE_GOOGLE_SHEET_ID`, `VITE_ADMIN_EMAIL`, `VITE_OFFICE_*`, y las VAPID/secret para el servidor.
4. Hacer build y probar el servidor compilado:

```bash
npm run build
npm start   # arranca dist/server.cjs
```

5. Desplegar en **Railway** (ver sección 4) o subir los cambios al repositorio conectado — Railway hace deploy automático desde la rama principal.

## 2. Actualizar el servidor Express (`server.ts`)

- Vive en la raíz del proyecto; se compila con esbuild a `dist/server.cjs` (`npm run build`).
- Si cambia `PUSH_API_SECRET` o las VAPID keys:
  - Actualizar env vars en Railway (`VAPID_PRIVATE_KEY`, `VAPID_PUBLIC_KEY`, `VAPID_SUBJECT`, `PUSH_API_SECRET`).
  - **Nota**: se debe re-desplegar tras cambiar env vars (Railway aplica al redeploy).

## 3. Actualizar el Google Apps Script (v2.6)

1. Entrar a script.google.com → abrir el proyecto de la hoja "Control de Asistencias".
2. Reemplazar `Code.gs` con el contenido de `Codigo.gs Control de Asistencias V2.txt` (o `google-apps-script/Codigo.gs`) **v2.6** — sin triggers, horarios dinámicos.
3. Verificar la sección `CONFIG`:
   - Epicentro y radio correctos (`10.494505, -66.831454`, 60 m).
   - Admin (D2) = `silocomca`.
   - Horarios de recordatorios/cierre (los lee Railway dinámicamente).
4. **Implementar → Nueva implementación → App web**:
   - Ejecutar como: yo.
   - Quién tiene acceso: **Cualquier usuario** (el frontend escribe sin login).
5. Copiar la URL `/exec` y actualizar `GOOGLE_APPS_SCRIPT_URL` (Railway) y `VITE_GOOGLE_APPS_SCRIPT_URL` si cambió.
6. **Ya NO se instalan triggers en GAS** — el scheduler del servidor Railway se encarga. Si quedaron triggers viejos, eliminarlos (una vez) ejecutando `eliminarTriggersHorarios` desde el editor del script.

## 4. Desplegar desde cero en Railway

1. Preparar el proyecto: `server.ts`, `package.json` (scripts `build`/`start`), `dist/` (generada por `npm run build`) y `public/`.
2. Railway → **New Project** → deploy desde repositorio (o subir el ZIP/duplicar el servicio `silocom-production`).
3. Configurar en el servicio:
   - **Build command**: `npm run build`
   - **Start command**: `npm start`
   - **Port**: 3000 (Railway asigna su propio `PORT`).
4. Variables de entorno (mismas de `.env.example`).
5. (Recomendado) Montar un **volumen** para `push_subscriptions.json` y `server_config.json` si quieres persistirlos entre deploys.
6. Deploy. Verificar:
   - `https://silocom-production.up.railway.app` carga la app.
   - `GET /api/vapid-public-key` responde `{ publicKey }`.
   - `GET /api/schedule-status` responde con hora Caracas y estado del scheduler.
7. Si alguna URL cambió, actualizar el GAS y las env vars.

## 5. Checklist post-actualización

- [ ] La app carga y el GPS se activa.
- [ ] Un marcaje de prueba aparece en `Asistencias` (columnas A–F, G/H con fórmulas).
- [ ] La suscripción push aparece en `push_subscriptions.json` (Railway) y en `DispositivosPush` (Sheet).
- [ ] `GET /api/schedule-status` muestra la hora Caracas correcta y el scheduler activo.
- [ ] El push remoto llega al teléfono (probar con `delaySeconds` de ~30 s desde el panel admin).

## Ver también

- [[09 - Despliegue y Migración a Railway]] — decisiones de arquitectura y pendientes.
- [[Solución de Problemas]] — fallas comunes.
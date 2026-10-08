---
tipo: documentacion
proyecto: Control de Asistencias V2 Silocom
seccion: URLs y Accesos
creado: 2026-09-09
actualizado: 2026-09-10
---

# 05 - URLs y Accesos

## Producción

| Recurso | URL | Uso |
| --- | --- | --- |
| App (PWA) | https://silocom-production.up.railway.app | Frontend React + API servida por Express (Railway) |
| API push (Express) | `POST https://silocom-production.up.railway.app/api/send-push` | Endpoint de Web Push (lo ejecuta el scheduler interno del servidor) |
| API sincronización | `GET .../api/schedule-status` · `POST .../api/sync-schedule` | Estado y forzado de horarios dinámicos |
| Webhook GAS v2.6 | https://script.google.com/macros/s/AKfycbxt4gdvIDh-uqAf9AY0EIDbGMFOJ7Fr-VxQC_tnFEsq83nbGYtVGeE_Qqq5JMWW4CW28Q/exec | Backend de datos (v2.6, 2026-09-10) |

## Backend Google Apps Script

- URL del deploy: `https://script.google.com/macros/s/AKfycbxt4gdvIDh-uqAf9AY0EIDbGMFOJ7Fr-VxQC_tnFEsq83nbGYtVGeE_Qqq5JMWW4CW28Q/exec` (Web App **v2.6**, publicada el 2026-09-10).
- El backend (Railway) la recibe por `GOOGLE_APPS_SCRIPT_URL` y el frontend por `VITE_GOOGLE_APPS_SCRIPT_URL`.
- La copia de respaldo del script: `Codigo.gs Control de Asistencias V2.txt` y `google-apps-script/Codigo.gs` (v2.6 — sin triggers).

## Google Sheets

- ID de la hoja objetivo: el mismo de la V1 — `1XyImKassfjtHq0PIzlScmPBdJCq21TBpwdM0_KNJR5s` (hoja "Control de Asistencias"). **Nota**: la V2 puede usar la misma hoja o una nueva; confirmar con `VITE_GOOGLE_SHEET_ID`.
- Hojas: `Asistencias`, `Configuracion`, `DispositivosPush`.

## Variables de entorno (`.env.example` — para Railway)

| Variable | Descripción | Ejemplo |
| --- | --- | --- |
| `PORT` | Puerto del servidor (Railway lo inyecta) | `3000` |
| `GOOGLE_APPS_SCRIPT_URL` | Webhook GAS v2.6 | `https://script.google.com/macros/s/.../exec` |
| `VITE_GOOGLE_APPS_SCRIPT_URL` | Webhook GAS (embebido en el frontend) | `https://script.google.com/macros/s/.../exec` |
| `VITE_GOOGLE_SHEET_ID` | ID del Sheets | `1XyImKas...KNJR5s` |
| `VITE_ADMIN_EMAIL` | Email admin (frontend) — la fuente oficial del admin es la celda D2 del Sheets (ver abajo) | `vsolorzano.silocom@gmail.com` |
| `VITE_OFFICE_LAT` | Latitud epicentro | `10.494505` |
| `VITE_OFFICE_LNG` | Longitud epicentro | `-66.831454` |
| `VITE_OFFICE_RADIUS_METERS` | Radio geocerca | `60` |
| `VAPID_PUBLIC_KEY` | Clave pública VAPID (backend) | `BPzypta9empk_NjjOH_QA9UFQvK1ebLcIM2ZYtU6HE2bhYZG7ypV_Xl3i_7jWEV9mfR1NKsNeOFjjzfieJuG6l8` |
| `VAPID_PRIVATE_KEY` | Clave privada VAPID (solo backend/máquina) | — |
| `VAPID_SUBJECT` | Contacto del push | `mailto:...@gmail.com` |
| `PUSH_API_SECRET` | Secreto de la API push | `silocom_push_sec_2026` |
| `ADMIN_EMAIL` | Email admin (backend, fallback del verify-admin) | `vsolorzano.silocom@gmail.com` |
| `GEMINI_API_KEY` | API key de Gemini (declarada; en uso por capacidades server-side de la app) | — |

## Accesos

| Acceso | Quién | Cómo |
| --- | --- | --- |
| Panel de administración | Admin según **celda D2** de `Configuracion` (valor: `silocomca`) | Botón admin en la cabecera de la app + ID `silocomca` (no un correo) |
| Dashboard Railway | vsolorzano | railway.app (proyecto silocom-production) |
| Script GAS | vsolorzano | script.google.com (proyecto del vínculo, v2.6) |
| Sheets | vsolorzano / empresa | Google Sheets "Control de Asistencias" |

## Pendientes por confirmar

- [x] URL del webhook GAS v2.6 (`/exec`): `https://script.google.com/macros/s/AKfycbxt4gdvIDh-uqAf9AY0EIDbGMFOJ7Fr-VxQC_tnFEsq83nbGYtVGeE_Qqq5JMWW4CW28Q/exec` — **publicada 2026-09-10**.
- [x] Coordenadas del epicentro: `10.494505, -66.831454` — **confirmadas** y corregidas en el GAS (2026-09-09).
- [x] Deploy en Railway: `silocom-production.up.railway.app` — **2026-09-10**.
- [ ] Confirmar si la V2 usa la misma hoja que la V1 o una copia.
- [ ] **Dar de baja el proyecto Vercel** (`silocom.vercel.app`) para evitar duplicados/costos.
- [ ] Ajustar el frontend para validar el admin **solo** contra la celda D2 (`silocomca`) y quitar los valores legacy (`admin`, correos).
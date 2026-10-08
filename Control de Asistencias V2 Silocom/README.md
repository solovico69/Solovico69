# Silocom - Sistema de Control de Asistencias

Sistema corporativo de registro de asistencias y control de jornadas laborales con geofencing satelital y sincronización en tiempo real con Google Sheets para **Silocom C.A.** (RIF: J-30725192-1).

Desarrollado bajo el sistema de diseño **Obsidian Pulse Enterprise** (`DESIGN.md`), desplegado como **servidor Express persistente en Railway** (sirve el frontend React + API + scheduler de notificaciones + Web Push). El backend de datos es **Google Apps Script v2.6** (webhook sobre Google Sheets, sin triggers).

---

## 🚀 Características Principales

- **Geofencing Satelital de Alta Precisión**:
  - Epicentro de Sede Silocom: `Lat: 10.494505`, `Lng: -66.831454`
  - Perímetro de seguridad: Radio máximo de **60 metros** (`0.06 km`).
  - Cálculo geodésico exacto mediante la **Fórmula de Haversine** idéntica a `Codigo.gs`.
  - Interruptor de prueba *"Probar en Sede"* para simulaciones en entornos de testing.

- **Marcaje de Jornada (Entrada & Salida)**:
  - Botón primario **🟢 ENTRADA** (Iniciar Jornada) con destello esmeralda `#10b981`.
  - Botón secundario **🔵 SALIDA** (Finalizar Jornada) con destello azul dodger `#0284c7`.
  - Animación de validación biométrica/radar (`#38bdf8`) durante el marcaje.
  - Horarios oficiales: Entrada 08:00, Salida 17:00, Tolerancia 30 min, Cierre automático a las 17:30 (hora oficial 17:00:00). Los horarios de recordatorios se leen **dinámicamente** de la hoja `Configuracion`.

- **Notificaciones push (servidor Express en Railway)**:
  - Scheduler propio (`setInterval` cada 30 s, hora Caracas) — **sin triggers de Apps Script**.
  - Recordatorios 07:45, aviso de olvido 08:30 (solo a quienes no marcaron), aviso de salida y cierre 17:30.

- **Seguridad de Terminal y Huella Digital de Dispositivo (`idDispositivo`)**:
  - Detección y vinculación de terminal móvil en el primer marcaje (`DEV-XXXXXX`).
  - Detección y bloqueo de intentos de suplantación desde equipos no autorizados.
  - Opción administrativa de restablecimiento de dispositivo por cambio de equipo.

- **Sincronización en Tiempo Real con Google Sheets**:
  - Compatible con el Webhook de Google Apps Script (`doPost` / `doGet`) — **GAS v2.6**.
  - Respaldo local inmediato garantizado contra fallas de red.
  - Pre-cargado con el histórico de registros provisto en el Google Sheet de Silocom.

- **Panel de Administración & Auditoría**:
  - Acceso seguro mediante verificación de ID de Administrador (`silocomca`, celda D2 de `Configuracion`).
  - **Resumen de Asistencias**: Tabla completa con filtros por mes, empleado, tipo de marcaje y exportación a CSV.
  - **Días Asistidos & Métricas**: Cuadro `DIAS_ASISTIDOS` (días asistidos, días laborables, días faltantes y porcentaje de asistencia).
  - **Cierre X Sistema**: Ejecución manual/automática de cierre para empleados con turnos abiertos.
  - **Configurador de Variables**: Prueba de conectividad en vivo con la Web App de Apps Script.

---

## 🛠️ Variables de Entorno (Railway & Local)

Copia `.env.example` a `.env` o configúralas en la sección **Variables** de tu servicio en Railway:

| Variable | Descripción | Valor por Defecto |
| :--- | :--- | :--- |
| `PORT` | Puerto del servidor (Railway lo asigna) | `3000` |
| `GOOGLE_APPS_SCRIPT_URL` | URL de la Web App desplegada en Google Apps Script (backend) | *(Pegar URL terminada en `/exec`)* |
| `VITE_GOOGLE_APPS_SCRIPT_URL` | URL de la Web App (embebida en el frontend) | *(Igual a la anterior)* |
| `VITE_GOOGLE_SHEET_ID` | ID de la hoja de Google Sheets en Google Drive | *(ID extraído de la URL del Sheet)* |
| `VITE_ADMIN_EMAIL` | Correo del Administrador principal de Silocom | `vsolorzano.silocom@gmail.com` |
| `VITE_OFFICE_LAT` | Latitud de la oficina de Silocom | `10.494505` |
| `VITE_OFFICE_LNG` | Longitud de la oficina de Silocom | `-66.831454` |
| `VITE_OFFICE_RADIUS_METERS` | Radio de tolerancia de geofencing en metros | `60` |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT` | Claves Web Push | — |
| `PUSH_API_SECRET` | Secreto de la API push | `silocom_push_sec_2026` |

---

## 📋 Configuración de Google Sheets (Apps Script)

1. Abre tu Google Sheets en Google Drive.
2. Asegúrate de tener las hojas llamadas:
   - `Asistencias` (Columnas: ID/Usuario, Nombre, Tipo, Fecha y Hora, Ubicación, Estado).
   - `Configuracion` (Celda D2: ID del Administrador, E4:E11: Horarios, Fila 7: Lista de empleados).
   - `DispositivosPush` (suscripciones Web Push).
3. Ve a **Extensiones** > **Apps Script**.
4. Pega el contenido del archivo `google-apps-script/Codigo.gs` (**v2.6**) incluido en este respaldo.
5. Haz clic en **Implementar** > **Nueva implementación**:
   - Tipo: **Aplicación web**
   - Ejecutar como: **Yo** (tu cuenta de Google)
   - Quién tiene acceso: **Cualquier persona** (*Anyone*)
6. Copia la URL de la aplicación web resultante (terminada en `/exec`).
7. Pega esa URL en `GOOGLE_APPS_SCRIPT_URL` y `VITE_GOOGLE_APPS_SCRIPT_URL` en tu proyecto de Railway.
8. **No instales triggers**: los horarios los gestiona el servidor Railway (scheduler dinámico).

---

## 📦 Despliegue en Railway

1. Prepara el proyecto: `server.ts`, `package.json` (scripts `build`/`start`), `public/` (PWA) y `src/`.
2. En [Railway](https://railway.app): **New Project** → deploy desde repositorio (o servicio duplicado de `silocom-production`).
3. Configura en el servicio:
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
   - **Port**: `3000`
4. En **Variables**, agrega las variables indicadas arriba (incluye VAPID keys y `PUSH_API_SECRET`).
5. Haz clic en **Deploy**. Tu aplicación estará en línea con HTTPS (`*.up.railway.app`) y soporte móvil completo.
6. Verifica: `GET /api/vapid-public-key` y `GET /api/schedule-status` deben responder OK.
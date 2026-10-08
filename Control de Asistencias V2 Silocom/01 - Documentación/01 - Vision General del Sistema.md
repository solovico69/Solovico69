---
tipo: documentacion
proyecto: Control de Asistencias V2 Silocom
seccion: Vision General del Sistema
creado: 2026-09-09
actualizado: 2026-09-10
---

# 01 - Vision General del Sistema

## Qué es

Sistema de control de asistencia del personal de Silocom con **geocerca GPS**, diseñado como **PWA** (instalable en el teléfono) y desplegado en **Railway** como servidor Express persistente. Es la evolución de la V1: misma lógica de marcaje, pero ahora con notificaciones push confiables gestionadas por un servidor Node.js 24/7 que además centraliza los horarios dinámicos (sin triggers de Apps Script).

## Piezas del sistema

| Pieza | Tecnología | Rol |
| --- | --- | --- |
| Frontend | React 19 + Vite 6 + TypeScript + Tailwind CSS v4 | PWA de marcaje, panel admin, notificaciones locales |
| Servidor | Express (Node.js) en Railway — `server.ts` | Sirve el frontend, expone `/api/*`, ejecuta el **scheduler autónomo** y despacha Web Push (`web-push`) |
| Backend de datos | Google Apps Script v2.6 (`doGet`/`doPost`) | Registra marcajes, administra empleados y suscripciones push; lee horarios de `Configuracion` |
| Almacenamiento | Google Sheets (`Asistencias`, `Configuracion`, `DispositivosPush`) | Datos operativos en vivo |
| Scheduler | `setInterval` cada 30 s en hora Caracas (dentro del servidor) | Recordatorios 07:45/08:30/16:30 y cierre 17:30 leyendo horarios dinámicos desde Sheets |
| Service Worker | `public/sw.js` | Push, notificaciones y cache de la PWA |

## Flujo a muy alto nivel (marcaje)

1. Empleado abre la PWA y pulsa **Entrada** (o Salida).
2. El frontend obtiene la geolocalización (`navigator.geolocation`).
3. Calcula distancia al epicentro con `haversine()` (utilidad `geo.ts`).
4. Si está dentro del radio (60 m) y no hay bloqueo de suplantación, construye el registro.
5. Envía el registro a la URL del GAS con `Content-Type: text/plain` (evita CORS preflight).
6. El GAS (`doPost` → `registrarAsistencia`) escribe en `Asistencias` (columnas A–F, preservando fórmulas).
7. La app refresca los datos (GAS `obtenerDatos` o fallback GViz) y muestra el nuevo estado.

## Flujo a muy alto nivel (notificaciones push)

1. El usuario acepta permisos; `pushService` registra el `ServiceWorkerRegistration` y guarda la suscripción: el servidor Railway la almacena en `push_subscriptions.json` y la replica a la hoja `DispositivosPush` (GAS `guardarSuscripcionPush`).
2. El **servidor Express de Railway** corre un scheduler cada 30 s en hora Caracas que lee los horarios dinámicos de la hoja `Configuracion` (recordatorio entrada 07:45, aviso olvido 08:30, aviso salida 16:45/16:30, cierre 17:30).
3. Al llegar la hora, el servidor llama a `web-push` con las **VAPID keys** y despacha la notificación a todos los suscriptores (filtrando el aviso de olvido a quienes aún no marcaron entrada).
4. A las **17:30** dispara `ejecutarCierreAutomatico` en el GAS v2.6 para cerrar turnos abiertos.

## Principales capacidades del frontend

- **Marcaje con geocerca**: botones Entrada/Salida con validación GPS.
- **Estado en vivo**: reloj, línea del turno (ShiftTimeline), indicador GPS, estado de hoy.
- **Panel de administración** (solo admin): pestañas Resumen, Métricas, Empleados, Configuración y Código (GAS + Railway).
- **Notificaciones**: locales programadas + suscripción push gestionada por Railway, con modo "prueba en sede" para testing.
- **PWA instalable**: manifest + service worker + iconos generados por script.

## Modo de datos

- **Lectura**: intenta primero el GAS (`obtenerDatos`); si falla (ej. rate limit), usa **GViz** como fallback leyendo la hoja directamente vía `tq` (requiere hoja visible).
- **Escritura**: siempre vía GAS (webhook `/exec`).
- **Horarios**: ya no se hardcodean en triggers; el servidor lee `Configuracion` (Sheet) y los aplica dinámicamente, incluso al cambiar las horas sin redeploy.

## Observaciones importantes

- La V2 **no** realiza la limpieza de registros >90 días que sí tenía la V1: el GAS v2.6 no incluye `limpiarRegistrosAntiguos`. Se documenta en [[09 - Despliegue y Migración a Railway]].
- El rol admin se valida contra la **celda D2** de la hoja `Configuracion` (valor: `silocomca` — un ID corto, no un correo). El frontend además acepta valores legacy (`admin`, correos); recomendado restringirlo únicamente al valor de D2 (ver [[06 - Ficha Tecnica]]).
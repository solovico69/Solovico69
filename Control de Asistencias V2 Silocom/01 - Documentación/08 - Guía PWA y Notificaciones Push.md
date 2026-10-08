---
tipo: documentacion
proyecto: Control de Asistencias V2 Silocom
seccion: Guía PWA y Notificaciones Push
creado: 2026-09-09
actualizado: 2026-09-10
---

# 08 - Guía PWA y Notificaciones Push

## Qué es la PWA

La app es una **Progressive Web App**: se instala en el celular desde el navegador (Chrome/Android o Safari/iOS), funciona a pantalla completa y puede recibir **notificaciones push** aunque no esté abierta activamente.

## Arquitectura del push (2 capas)

### Capa 1 — Notificaciones locales (desde la app)

El `notificationService` de la app agenda avisos mientras el navegador/teléfono tiene la página viva (complemento):

| Hora | Aviso |
| --- | --- |
| 07:45 | Recordatorio de entrada |
| 08:30 | Aviso de olvido (solo si no hay entrada registrada) |
| 16:30 | Aviso de salida |

- Revisa cada **20 s** y dispara cada aviso **una vez por día** (flags en `localStorage`).
- Se muestran con `showNotification` del service worker (`sw.js`).

### Capa 2 — Push remoto (desde el servidor Express de Railway) — PRINCIPAL

1. El **servidor Express de Railway** (`server.ts`) corre un **scheduler** (`setInterval` cada 30 s, hora Caracas vía Pendulum).
2. Lee los horarios dinámicos de la hoja `Configuracion` (máx. 1 vez cada 5 min): recordatorio entrada, aviso olvido, aviso salida, cierre.
3. Al llegar la hora (lunes a viernes), construye el mensaje y llama a `web-push` con las VAPID keys para despachar la notificación a los suscriptores de `push_subscriptions.json` + `DispositivosPush`.
4. **Aviso de olvido inteligente**: consulta `obtenerDatos` del GAS y solo avisa a los empleados que **aún no marcaron entrada** hoy.
5. El dispositivo recibe la notificación y `sw.js` la muestra (y al tocarla abre la app).
6. Sin triggers de Apps Script: si cambias una hora en el Sheet, Railway la aplica automáticamente.

## Flujo de suscripción

1. El usuario acepta el permiso de notificaciones.
2. `pushService.subscribeDevice()`:
   - Registra/obtiene el `ServiceWorkerRegistration (sw.js)`.
   - Llama `registration.pushManager.subscribe` con `userVisibleOnly` y la **clave VAPID pública** (`BPzypta9empk...`).
   - Envía la suscripción a `POST /api/push-subscription` en Railway → se guarda en `push_subscriptions.json` y se replica al GAS (`guardarSuscripcionPush`) → hoja `DispositivosPush`.
3. Cuando el servidor quiere avisar, usa los suscriptores guardados localmente (y el GAS como respaldo).

## Dónde están las claves

| Clave | Dónde |
| --- | --- |
| VAPID pública | `.env.example` (`VAPID_PUBLIC_KEY`), usada por el frontend y el servidor |
| VAPID privada | Variable de entorno **en Railway** (`VAPID_PRIVATE_KEY`) — el `server.ts` la lee de env, sin fallback hardcodeado |
| `PUSH_API_SECRET` | En Railway env vars (`PUSH_API_SECRET`) — valida llamadas a `/api/send-push` |

## Pruebas disponibles (panel admin)

- **Prueba en Sede**: simula estar dentro del radio (útil si pruebas desde fuera de la oficina).
- **Prueba de notificación**: dispara una notificación local con cuenta regresiva (30 s, configurable).
- **Probar push remoto**: desde el panel (pestaña Configuración) o llamando a `POST /api/send-push` con `delaySeconds`.
- **Estado del scheduler**: `GET /api/schedule-status` muestra la hora Caracas del servidor y los últimos despachos (útil para depurar).

## Requisitos para que el push funcione

- La app debe estar **instalada o abierta al menos una vez** y el usuario debe **aceptar notificaciones**.
- Cada dispositivo debe tener su suscripción en `push_subscriptions.json` (Railway) y/o `DispositivosPush` (Sheet).
- En Android/Chrome, la PWA debe estar instalada (o el navegador abierto) para recibir push de forma fiable.
- En iOS, la PWA debe estar **instalada en el home screen** para recibir push (Safari 16.4+).
- El dominio debe estar en HTTPS (Railway lo da por defecto en `*.up.railway.app`).

## Solución de problemas rápida

| Problema | Causa probable | Fix |
| --- | --- | --- |
| No llega push remoto | Claves VAPID ausentes o mal en Railway, o secreto incorrecto | Verificar `VAPID_PUBLIC_KEY`/`VAPID_PRIVATE_KEY`/`PUSH_API_SECRET` en Railway env vars |
| No llega push local | Permiso denegado o app cerrada | Reinstalar PWA y aceptar notificaciones |
| `401` en `/api/send-push` | Header `x-push-secret` incorrecto | Corregir secreto (debe coincidir con `PUSH_API_SECRET`) |
| Push llega a otra hora | Zona horaria fuera de Caracas | Verificar con `GET /api/schedule-status` (Railway usa hora Caracas) |
| Suscripción obsoleta | Endpoint eliminado por el navegador | El servidor descarta suscriptores con 404/410 automáticamente |

Ver más en [[Solución de Problemas]].
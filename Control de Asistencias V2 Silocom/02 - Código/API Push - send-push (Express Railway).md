---
tipo: codigo
proyecto: Control de Asistencias V2 Silocom
seccion: API Push (Express / Railway)
creado: 2026-09-09
actualizado: 2026-09-10
---

# API Push - send-push (Express en Railway)

> [!info] Archivo
> Endpoint `POST /api/send-push` del servidor `server.ts` (Express) desplegado en **Railway**. Sustituyó a la antigua Serverless Function de Vercel `api/send-push.ts` (carpeta `api/`, obsoleta).

## Propósito

Recibe peticiones de despacho de notificaciones (internas del scheduler o pruebas) y entrega **Web Push** al dispositivo del empleado a través del Push Service del navegador usando `web-push` con las VAPID keys del servidor. En la arquitectura actual, el servidor **dispara por sí mismo** los recordatorios (no depende del GAS).

## Endpoint

| Campo | Valor |
| --- | --- |
| Ruta | `POST /api/send-push` |
| Producción | `https://silocom-production.up.railway.app/api/send-push` |
| Dev local | `/api/send-push` emulado por `pushDevPlugin` en `vite.config.ts` |
| Health | `GET /api/vapid-public-key` devuelve `{ publicKey }` |

## Autenticación

- Header requerido: `x-push-secret: <PUSH_API_SECRET>` (o campo `secret` en el body).
- Valor esperado: `silocom_push_sec_2026` (variable de entorno de Railway).
- Sin el header correcto → `401`.

## Payload (POST)

```json
{
  "endpoint": "https://fcm.googleapis.com/fcm/send/...",
  "p256dh": "base64...",
  "auth": "base64...",
  "title": "Recordatorio",
  "body": "Es hora de marcar tu entrada",
  "delaySeconds": 0
}
```

| Campo | Obligatorio | Descripción |
| --- | --- | --- |
| `endpoint` | sí | Push endpoint del suscriptor (de `push_subscriptions.json` / `DispositivosPush`) |
| `p256dh` | sí | Clave pública de la suscripción |
| `auth` | sí | Secreto de la suscripción |
| `title` | no | Título de la notificación |
| `body` | no | Cuerpo de la notificación |
| `delaySeconds` | no | Retardo (s) antes de enviar (útil para pruebas) |

## Respuestas

| Caso | Código |
| --- | --- |
| `POST` correcto | `200` |
| Falta `x-push-secret`/`secret` o inválido | `401` |
| Falta `endpoint` | `400` |
| Suscriptor inválido/expirado | Se elimina automáticamente (404/410) y se continúa con el resto |

## Seguridad y despliegue

- Las VAPID keys viven **solo en env vars de Railway**: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `PUSH_API_SECRET` — **sin fallback hardcodeado** (ver [[06 - Ficha Tecnica]]).
- CORS habilitado para el origen del frontend (pruebas desde el navegador).

## Cómo probarla

```bash
# Health (clave pública VAPID)
curl https://silocom-production.up.railway.app/api/vapid-public-key

# Despacho (payload de ejemplo con retardo de 5 s)
curl -X POST https://silocom-production.up.railway.app/api/send-push \
  -H "Content-Type: application/json" \
  -H "x-push-secret: silocom_push_sec_2026" \
  -d '{
    "endpoint": "https://fcm.googleapis.com/fcm/send/PUSH_ENDPOINT",
    "p256dh": "TU_P256DH",
    "auth": "TU_AUTH",
    "title": "Prueba",
    "body": "Hola desde Railway",
    "delaySeconds": 5
  }'
```

> [!tip] Dónde conseguir el endpoint/p256dh/auth
> En la hoja `DispositivosPush` (columnas ENDPOINT, P256DH, AUTH), o desde el panel admin → pestaña Configuración → "Probar notificación".

## Ver también

- `server.ts` — servidor Express (dentro de `control_asistenciasv2.zip`).
- [[09 - Despliegue y Migración a Railway]] — contexto de la migración.
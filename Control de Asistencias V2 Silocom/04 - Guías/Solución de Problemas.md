---
tipo: guia
proyecto: Control de Asistencias V2 Silocom
seccion: Guias
creado: 2026-09-09
actualizado: 2026-09-10
---

# Solución de Problemas

## 1. El marcaje dice "fuera de zona" (INVALID_UBICACION)

**Posibles causas y fixes:**

| Causa | Fix |
| --- | --- |
| GPS impreciso en interiores | Acercarse a una ventana, activar WiFi/GPS de alta precisión |
| El epicentro configurado no coincide con la sede | Verificar `VITE_OFFICE_LAT/LNG`, el `.env` de Railway y la sección `CONFIG` del GAS (epicentro vigente: `10.494505, -66.831454`) |
| Radio demasiado pequeño | Ajustar `VITE_OFFICE_RADIUS_METERS` (60 m) o el valor en el GAS |
| Permiso de ubicación denegado | Reinstalar la PWA y aceptar el permiso |

> [!tip] Prueba sin GPS
> Activa **Prueba en Sede** en el panel admin (Configuración) para simular estar dentro del radio.

## 2. El marcaje falla con "dispositivo no vinculado" (DISPOSITIVO_INVALIDO)

- El empleado marcó antes desde otro teléfono y el `DEV-XXXXXX` quedó asociado al anterior.
- Fix: en el panel admin → **Empleados** → actualizar el dispositivo vinculado (o eliminar el registro de `localStorage` del teléfono anterior y re-marcar la primera vez con el nuevo).

## 3. No llegan notificaciones push

**Cadena a revisar (en orden):**

1. **Permiso**: PWA instalada y notificaciones aceptadas (en iOS: Safari 16.4+, app en Home Screen).
2. **Suscripción**: ¿aparece una fila en `DispositivosPush` con el endpoint del teléfono? Si no, reinstalar y aceptar permisos.
3. **Servidor arriba**: Rail tenga el servicio `silocom-production` **Up** (visitar la URL de la app).
4. **VAPID keys**: `VAPID_PUBLIC_KEY`/`VAPID_PRIVATE_KEY` configuradas en Railway env vars; si se cambiaron, hay que **re-suscribir** los dispositivos (la clave pública quedó embebida en el frontend).
5. **Horarios**: el scheduler lee los horarios de la hoja `Configuracion` — verificar con `GET /api/schedule-status` (hora Caracas + últimos despachos).
6. **Zona horaria**: el servidor SIEMPRE trabaja en hora Caracas (UTC-4) — no ajustar horarios "a ojo".

## 4. El push remoto da 401

- Header `x-push-secret` incorrecto o faltante.
- Verificar que `PUSH_API_SECRET` en Railway coincida con el valor usado al llamar `/api/send-push`.

## 5. La app no carga datos (pantalla en blanco en el panel)

1. El GAS (`obtenerDatos`) puede estar en **rate limit** → la app hace fallback a **GViz**. Verifica que la hoja esté **visible/compartida** para lectura (none/anyone con link).
2. `VITE_GOOGLE_APPS_SCRIPT_URL` mal escrita o implementación vieja → re-implementar el script (v2.6) y actualizar la env var.
3. Revisar la consola del navegador (F12): errores CORS o `404` en `gviz/tq`.

## 6. Los marcajes no aparecen en el Sheets

- Confirmar el **ID de hoja** (`VITE_GOOGLE_SHEET_ID`) y el nombre exacto de las hojas (`Asistencias`).
- Si escribes desde la app pero no aparece: revisar el **deploy del GAS** (¿apuntó a la implementación `/exec` correcta?).
- Revisar que la fila se escribió en A–F (si ves datos en G/H pero no en A–F, el script está escribiendo mal la fila o hay un header que desalinea columnas).

## 7. Cierre automático no ocurre a las 17:30

- Verificar con `GET /api/schedule-status` que el scheduler de Railway está activo y la hora Caracas es correcta.
- Confirmar que `Configuracion` (hoja) tiene el valor de cierre (17:30) en la columna correcta — el servidor lo lee dinámicamente.
- El cierre solo aplica a turnos con ENTRADA y sin SALIDA del día.
- **Ya no dependen de triggers GAS**: si quedaron triggers viejos de la v2.5, pueden ejecutarse duplicados — eliminarlos con `eliminarTriggersHorarios`.

## 8. Seguridad / pendientes conocidos

| Pendiente | Riesgo | Acción recomendada |
| --- | --- | --- |
| Validación de admin del frontend acepta `admin`/correos además del valor de D2 (`silocomca`) | Acceso admin más amplio de lo definido | El acceso oficial se valida en la **celda D2** del Sheets (debe ser `silocomca`); ajustar el frontend para validar solo D2 |
| Sin limpieza de registros >90 días (ausente en v2.6) | La hoja `Asistencias` crece indefinidamente | Reincorporar `limpiarRegistrosAntiguos` de la V1 |
| Restos de la etapa Vercel en la carpeta local (`api/`, `package.json` sin actualizar) | Confusión al hacer cambios | Sincronizar la carpeta con el ZIP `control_asistenciasv2.zip` y eliminar `api/` |
| Proyecto Vercel aún activo | Posible duplicado/costo | Dar de baja el proyecto Vercel si ya no se usa |

## 9. Preguntas frecuentes

**¿La app funciona sin internet?** No — necesita la conexión para GPS, GAS y push (la PWA cachea la UI, pero el marcaje requiere conexión).

**¿Puedo marcar desde casa?** Solo si activas Prueba en Sede (solo admin). En operación normal: solo dentro de los 60 m.

**¿Dos personas pueden usar el mismo teléfono?** No deberían: el primer marcaje vincula el dispositivo a un solo empleado.

**¿Cómo verifico que llegó el push remoto?** Panel admin → Configuración → prueba de notificación local (30 s) y luego una prueba remota (el servidor Railway la despacha con `web-push`).
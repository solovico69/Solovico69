---
tipo: documentacion
proyecto: Control de Asistencias V2 Silocom
seccion: Flujo de Trabajo
creado: 2026-09-09
actualizado: 2026-09-10
---

# 04 - Flujo de Trabajo

## 1. Primera visita / instalación

1. El empleado abre la PWA (`silocom-production.up.railway.app`) o la instala desde el navegador.
2. La app pide **permiso de ubicación** y (si el usuario aprueba) **permiso de notificaciones** (Web Push, gestionado por el servidor Railway).
3. Se genera el ID de dispositivo (`DEV-XXXXXX`) con `device.ts` y se guarda en `localStorage`.
4. La app carga configuración + datos (GAS `obtenerDatos`, o fallback GViz).

## 2. Marcaje de entrada

1. Usuario pulsa **Entrada** en `PunchCard`.
2. `geo.ts` calcula la distancia al epicentro (Haversine, radio 60 m).
3. Si está **dentro** del radio:
   - Se envía `registrarAsistencia` al GAS (POST, `Content-Type: text/plain`, sin preflight CORS).
   - El GAS valida el `idDispositivo` contra el empleado:
     - Si el empleado **no existe**: error `EMPLOYEE_NOT_FOUND` (salvo alta desde admin).
     - Si el empleado existe pero el dispositivo **no coincide**: error de suplantación (`DISPOSITIVO_INVALIDO`).
   - El GAS calcula el estado (TEMPRANO / A TIEMPO / RETARDO según tolerancia de 30 min) y escribe en `Asistencias` A–F.
4. La app muestra el resultado en `FeedbackModal` y refresca el estado en vivo.
5. **Si el empleado no estaba registrado**, en el registro el backend `vincularDispositivo`/alta automática lo crea en `Configuracion` con el celular actual (en la V2 el alta es automática al marcar, tal como en V1).

## 3. Marcaje de salida

1. Usuario pulsa **Salida**; misma validación GPS y de dispositivo.
2. El GAS registra `SALIDA` y calcula estado de salida.
3. Si el usuario olvidó marcar salida, a las **17:30** el **scheduler de Railway** llama a `ejecutarCierreAutomatico` (GAS v2.6) y lo cierra:
   - Fecha/hora de salida registrada como `17:00`.
   - Ubicación `CIERRE AUTOMATICO / SISTEMA`, estado `CIERRE X SISTEMA`.

## 4. Notificaciones

### Locales (desde la app)
El `notificationService` agenda en el navegador (complemento):

| Hora | Aviso |
| --- | --- |
| 07:45 | Recordatorio de entrada |
| 08:30 | Aviso de olvido de entrada (solo si aún no marcó) |
| 16:30 | Aviso previo a la salida |

Se revisa cada 20 s; cada aviso se dispara **una vez por día** (flags en `localStorage`).

### Remotas (desde el servidor Railway — sin triggers GAS)
El **servidor Express de Railway** ejecuta un scheduler (`setInterval` cada 30 s, hora Caracas) que lee los horarios dinámicos desde la hoja `Configuracion` y dispara:

| Hora (por defecto) | Evento |
| --- | --- |
| 07:45 | Push de recordatorio de entrada |
| 08:30 | Push de aviso de olvido (solo a quienes NO marcaron hoy) |
| 16:45 / 16:30 | Push de aviso de salida |
| 17:30 | `ejecutarCierreAutomatico` + push de cierre |

Cada evento usa `web-push` con las VAPID keys del servidor → Push Service → dispositivo suscrito (suscripciones en `push_subscriptions.json` + `DispositivosPush`).

> [!note] Horarios dinámicos
> Los horarios NO están hardcodeados: se leen de `Configuracion`. Si cambias la hora del recordatorio en el Sheet, Railway la detecta en ≤ 5 min sin redeploy.

## 5. Administración

El admin (vsolorzano.silocom@gmail.com) abre el panel con el botón de la cabecera:

- **Resumen**: total empleados, marcajes de hoy, estado en vivo.
- **Métricas**: días asistidos, puntualidad, retrasos, por período (con días laborables base = 22).
- **Empleados**: alta manual, edición, vínculo de dispositivo.
- **Configuración**: horarios, tolerancias, epicentro/radio, y pruebas — incluye **"Prueba en Sede"** (simula estar dentro del radio sin GPS real) y **prueba de notificación con cuenta regresiva**.
- **Código**: consulta rápida del Código GAS y del `server.ts` (Railway).

## 6. Ciclo diario (resumen)

| Hora | Evento |
| --- | --- |
| 07:45 | Push remoto (Railway): recordatorio entrada |
| 08:00 | Hora base de entrada |
| 08:30 | Tolerancia de entrada; push de aviso si no marcó |
| 16:30 | Push de aviso de salida |
| 17:00 | Hora base de salida |
| 17:30 | Cierre automático de turnos abiertos (vía scheduler Railway → GAS) + push de cierre |
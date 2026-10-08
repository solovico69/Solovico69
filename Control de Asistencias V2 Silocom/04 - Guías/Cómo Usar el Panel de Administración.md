---
tipo: guia
proyecto: Control de Asistencias V2 Silocom
seccion: Guias
creado: 2026-09-09
actualizado: 2026-09-10
---

# Cómo Usar el Panel de Administración

> [!info] Acceso
> Botón de **admin** en la cabecera de la app (solo visible para el admin). El acceso se valida contra la **celda D2** de la hoja `Configuracion` (valor actual: `silocomca` — un ID, no un correo). El frontend también acepta el email de `VITE_ADMIN_EMAIL` y valores legacy; pendiente restringirlo solo a D2.

## Pestañas del panel

### 1. Resumen

- Total de empleados registrados.
- Marcajes de hoy (entradas/salidas) y estado actual del turno.
- Últimos registros (hora, ubicación, estado).

**Uso típico**: confirmar que los marcajes de prueba están entrando bien y que el estado (TEMPRANO/A TIEMPO/RETARDO) se calcula correctamente.

### 2. Métricas

- Días asistidos por empleado en el período.
- Puntualidad de entrada; retrasos.
- Nota: los días laborables del cálculo usan una base de **22 días** (valor fijo en el frontend). Ajustar si el mes real tiene días distintos.

**Uso típico**: verificar la asistencia acumulada mientras pruebas; comparar contra la hoja.

### 3. Empleados

- Lista de empleados con su ID, nombre y tipo.
- **Alta manual** de nuevo empleado.
- **Editar** nombre/tipo.
- **Vincular dispositivo** (para asignar el `DEV-XXXXXX` correcto).

> [!warning] Alta automática vs manual
> Si un empleado marca sin estar registrado, el sistema lo da de alta automáticamente **en el momento del primer marcaje** (con el dispositivo actual). Si prefieres controlar el alta, crea el empleado aquí **antes** de que marque.

**Uso típico**: registrar a un empleado nuevo y asegurar que su dispositivo quede vinculado.

### 4. Configuración

- **Horarios y tolerancias**: hora de entrada/salida, tolerancias, hora de cierre. **Nota**: estos valores viven en la hoja `Configuracion` y los lee el servidor Railway (scheduler) dinámicamente — cambiar la hora aquí surte efecto sin redeploy.
- **Epicentro y radio** de la geocerca (lat/lng/radio en metros).
- **Prueba en Sede**: simula estar dentro del radio aunque tu GPS esté fuera (ideal para probar marcajes sin ir a la oficina). Actívala → marca Entrada/Salida → desactívala.
- **Prueba de notificación local**: dispara una notificación con cuenta regresiva (por defecto 30 s) para validar que el push local funciona.
- **Prueba de push remoto / estado del scheduler**: dispara un push vía Railway (`/api/send-push`) o consulta `GET /api/schedule-status` para ver hora Caracas y últimos despachos.

**Uso típico**: calibración de la geocerca y validación del flujo de notificaciones.

### 5. Código

- Acceso rápido al **Codigo GAS v2.6** vigente (acciones disponibles).
- Resumen del **server.ts (Railway)**: endpoints `/api/*` y del scheduler de horarios.

**Uso típico**: consultar qué acciones expone el backend sin abrir script.google.com ni Railway.

## Flujo de prueba recomendado (fase actual)

1. Configuración → **Prueba en Sede** activada.
2. Marca **ENTRADA** → verifica en el panel **Resumen** → revisa la hoja `Asistencias`.
3. Espera la **prueba de notificación** (30 s) para validar el push local.
4. Revisa `DispositivosPush` para ver la suscripción del teléfono.
5. Dispara un push **remoto** (configuración / GAS) y confirma que llega con la app cerrada o en segundo plano.
6. Marca **SALIDA** y verifica el cierre automático (o simula olvidar la salida y espera 17:30).

## Buenas prácticas

- Desactiva **Prueba en Sede** cuando termines de probar: de lo contrario cualquier persona podría marcar desde cualquier lugar.
- Revisa periódicamente `DispositivosPush` y elimina suscripciones huérfanas (cambios de teléfono).
- Los horarios se gestionan desde la hoja `Configuracion` — Railway los aplica dinámicamente (máx. 5 min de retardo).
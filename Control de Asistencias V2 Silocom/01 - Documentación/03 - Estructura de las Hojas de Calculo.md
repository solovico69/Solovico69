---
tipo: documentacion
proyecto: Control de Asistencias V2 Silocom
seccion: Estructura de las Hojas de Calculo
creado: 2026-09-09
actualizado: 2026-09-10
---

# 03 - Estructura de las Hojas de Calculo

> [!info] Hojas del sistema
> El GAS v2.6 usa tres hojas: `Asistencias`, `Configuracion` y `DispositivosPush`. La configuración de nombres está en la sección `CONFIG` del script (`HOJA_ASISTENCIAS`, `HOJA_CONFIG`, `HOJA_PUSH`). Los horarios de `Configuracion` se leen dinámicamente desde el servidor Railway (scheduler).

## Hoja `Asistencias`

Registros de marcaje, uno por fila. El script escribe **solo columnas A–F** para no pisar las fórmulas de G/H.

| Col | Campo | Ejemplo |
| --- | --- | --- |
| A | ID del empleado (cédula o ID interno) | `vsolorzano` |
| B | Nombre | `VICTOR SOLORZANO` |
| C | Tipo de marcaje | `ENTRADA` / `SALIDA` |
| D | Fecha y hora | `2026-09-09T08:05:00.000Z` (ISO) |
| E | Coordenadas | `10.494505, -66.831454` |
| F | Estado | `TEMPRANO` / `A TIEMPO` / `RETARDO` / `CIERRE X SISTEMA` |
| G | Fórmula DIA | Derivada de D (no se escribe desde el script) |
| H | Fórmula MES | Derivada de D (no se escribe desde el script) |

## Hoja `Configuracion`

| Ubicación | Contenido |
| --- | --- |
| `D2` | ID del administrador. Valor actual: `silocomca` — la validación de acceso admin se hace contra este valor (no contra un correo) |
| `E4:E11` | Parámetros de horario: `HORA_ENTRADA`, `HORA_SALIDA`, `TOLERANCIA_ENTRADA`, `TOLERANCIA_SALIDA`, `CIERRE_AUTOMATICO` (17:30), etc. |
| Filas desde la 7 (A/B/C) | Empleados: `ID` / `NOMBRE` / `TIPO` (o cédula, según el alta) |
| Otros | Parámetros dinámicos de geocerca (latitud, longitud, radio) leídos como clave/valor |

> [!note] Empleados en `Configuracion`
> La lista de empleados vive en esta hoja (desde la fila 7 en adelante) y no en una hoja aparte. `obtenerDatos` la devuelve como parte del payload y el frontend la guarda en `localStorage`.

## Hoja `DispositivosPush` (nueva en V2)

Suscripciones Web Push de los dispositivos.

| Col | Campo |
| --- | --- |
| A | FECHA_REGISTRO |
| B | ID_USUARIO (ID del empleado) |
| C | NOMBRE |
| D | ENDPOINT (URL del Push Service) |
| E | P256DH (clave pública de la suscripción) |
| F | AUTH (secreto de la suscripción) |
| G | ESTADO (activo/inactivo) |

## Cómo las lee el frontend

1. **GAS** (`obtenerDatos`): devuelve `{ registros, empleados, configuracion, resumen }` en una sola llamada.
2. **Fallback GViz**: si el GAS falla, `sheetsSync.ts` consulta las hojas directamente:
   - `https://docs.google.com/spreadsheets/d/{ID}/gviz/tq?sheet=Asistencias`
   - `https://docs.google.com/spreadsheets/d/{ID}/gviz/tq?sheet=Configuracion`
   - Requiere que la hoja esté **visible/compartida** con acceso de lectura.

## Datos semilla (frontend)

- Empleados: `vsolorzano` (VICTOR SOLORZANO, Coordinador General/IT) y `evalero` (EVALERO SILOCOM).
- Registros de ejemplo: del 20/08/2026 al 07/09/2026 para ambos usuarios (los genera `storage.ts` si `localStorage` está vacío).
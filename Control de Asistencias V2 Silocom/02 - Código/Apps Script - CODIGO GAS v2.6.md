---
tipo: codigo
proyecto: Control de Asistencias V2 Silocom
seccion: Apps Script (Backend GAS)
creado: 2026-09-09
actualizado: 2026-09-10
---

# Apps Script - CODIGO GAS v2.6

> [!info] Fuentes
> - Código vigente: `Codigo.gs Control de Asistencias V2.txt` (2026-09-10) y `google-apps-script/Codigo.gs` (v2.6)
> - Los dos archivos de la carpeta están sincronizados con la versión v2.6 (migración Railway).

## Descripción general

Backend de datos del sistema, publicado como **Web App** (`/exec`) accesible por el frontend y por el servidor Railway. Maneja: marcajes, empleados, vínculo de dispositivo, suscripciones push, cierre automático y lectura de datos para el panel.

> [!important] Sin triggers (v2.6)
> A partir de la **v2.6** el GAS **NO instala triggers horarios**. El **servidor Express de Railway** (scheduler `setInterval` cada 30 s en hora Caracas) lee los horarios dinámicos desde la hoja `Configuracion` y dispara los recordatorios y el cierre automático. El GAS queda como **base de datos e interfaz** sobre Sheets.

## Configuración (sección CONFIG)

| Constante | Valor (v2.6) |
| --- | --- |
| `HOJA_ASISTENCIAS` | `Asistencias` |
| `HOJA_CONFIG` | `Configuracion` |
| `HOJA_PUSH` | `DispositivosPush` |
| `PUSH_API_SECRET` | `silocom_push_sec_2026` |
| `ADMIN_EMAIL` (celda D2 de `Configuracion`) | `silocomca` — la validación admin se hace contra este valor (ID, no correo) |
| Epicentro | `10.494505, -66.831454` (radio 60 m) |

> [!note] Ya no existe `URL_VERCEL_PUSH`
> El push lo despacha directamente el servidor Railway (`web-push` con VAPID keys). El GAS solo guarda/consulta suscriptores en `DispositivosPush`.

## Endpoints

### `doGet(e)` — consultas y pruebas

| Acción (`?action=`) | Uso |
| --- | --- |
| `ping` | Health check para el frontend |
| `obtenerConfiguracion` | Devuelve horarios/geocerca/admin (lo consume el scheduler de Railway) |
| `obtenerDatos` | Registros + empleados + config + resumen |
| `obtenerEmpleados` | Lista de empleados |

### `doPost(e)` — operaciones

| Acción (`action`) | Notas |
| --- | --- |
| `registrarAsistencia` | Valida ubicación/estado; escribe A–F en `Asistencias` |
| `guardarEmpleado` | Alta/edición de empleado en `Configuracion` |
| `vincularDispositivo` | Vincula `idDispositivo` y `celular` al empleado |
| `ejecutarCierreAutomatico` | Cierra turnos abiertos (SALIDA 17:00, `CIERRE X SISTEMA`) — lo invoca el scheduler de Railway |
| `obtenerDatos` | Misma lectura que GET |
| `obtenerConfiguracion` | Misma lectura que GET |
| `guardarSuscripcionPush` | Guarda `{endpoint, p256dh, auth}` en `DispositivosPush` (lo invoca Railway al recibir una suscripción) |
| `eliminarTriggersHorarios` | Elimina triggers viejos de la v2.5 (limpieza única, ya no se usan) |

## Lógica clave

### Registrar asistencia

1. Recibe `{ idEmpleado, tipo, lat, lng, idDispositivo, timestamp }`.
2. Valida empleado y dispositivo (antifraude: `DISPOSITIVO_INVALIDO` si no coincide).
3. Calcula distancia con **Haversine** contra epicentro configurado (radio 60 m) → `INVALID_UBICACION` si fuera.
4. Calcula estado según horario/tolerancia (TEMPRANO / A TIEMPO / RETARDO).
5. Escribe fila en `Asistencias` (solo A–F; G/H son fórmulas DIA/MES que se preservan).
6. Devuelve el registro guardado.

### Cierre automático (17:30 — invocado por Railway)

- Busca empleados con ENTRADA y sin SALIDA del día.
- Registra SALIDA con hora `17:00`, coordenadas `CIERRE AUTOMATICO / SISTEMA` y estado `CIERRE X SISTEMA`.
- En v2.6 lo llama el **scheduler del servidor** (`POST /exec` con action `ejecutarCierreAutomatico`), no un trigger.

### Lectura de configuración dinámica (para Railway)

`obtenerConfiguracion` devuelve: hora entrada/salida, tolerancias, recordatorio entrada (07:45), aviso olvido (08:30), aviso salida (16:45/16:30), cierre (17:30), lat/lng/radio y admin. El servidor consulta esto cada ≤5 min y aplica cambios sin redeploy.

## Consideraciones / advertencias

> [!warning] Ausente en v2.6: limpieza de registros antiguos
> La V1 tenía `limpiarRegistrosAntiguos` (>90 días). Esta versión no lo incluye: `Asistencias` crecerá indefinidamente. Decide si conviene restaurarlo.

> [!warning] Triggers viejos
> Si el proyecto GAS aún tiene triggers de la v2.5 (07:45, 08:30, 16:30, 17:30), ejecuta `eliminarTriggersHorarios` una vez para evitar duplicados con el scheduler de Railway.

## Despliegue

1. Editar en script.google.com (proyecto de la hoja "Control de Asistencias").
2. **Implementar → Nueva implementación → App web**:
   - Ejecutar como: yo (cuenta de vsolorzano).
   - Acceso: cualquiera (para que el frontend anónimo escriba).
3. Copiar URL `/exec` y ponerla en `GOOGLE_APPS_SCRIPT_URL` (Railway) y `VITE_GOOGLE_APPS_SCRIPT_URL`. Ver [[05 - URLs y Accesos]].

## Ver también

- [[09 - Despliegue y Migración a Railway]] — por qué Railway reemplazó a Vercel y los triggers.
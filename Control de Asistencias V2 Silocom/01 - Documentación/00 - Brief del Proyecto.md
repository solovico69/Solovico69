---
tipo: documentacion
proyecto: Control de Asistencias V2 Silocom
seccion: Brief del Proyecto
creado: 2026-09-09
actualizado: 2026-09-10
---

# 00 - Brief del Proyecto

## Problema

Silocom, C.A. necesita llevar el control de asistencia del personal a distancia: saber **quién está en la oficina (sede principal)** y **cuándo llega/sale**, de forma confiable y sin depender de cuadernos o llamadas. Además, en la V2 se quiere **avisar al personal automáticamente** (recordatorios de entrada/salida y cierre del turno) vía notificaciones push en el teléfono, algo que la V1 no cubría plenamente.

## Solución

Una **PWA de marcaje con geocerca GPS** (radio 60 m alrededor de la sede):

- El empleado abre la app desde el celular, marca **Entrada** o **Salida** y el sistema:
  1. Calcula la distancia al epicentro con la fórmula de **Haversine**.
  2. Exige estar dentro del radio (60 m) y tener la ubicación activa.
3. Genera un **ID de dispositivo** (`DEV-XXXXXX`) la primera vez y lo vincula al empleado para evitar que otro teléfono marque por él (antifraude).
4. Envía el marcaje al backend de **Google Apps Script** v2.6, que lo escribe en la hoja `Asistencias`.
- El sistema calcula en vivo el estado del día (Entrada, Salida, Falta, Cierre por sistema) y ofrece un **panel de administración** con resumen, métricas, gestión de empleados y configuración.
- **Notificaciones push (vía servidor Express en Railway)**: el servidor Express de Railway (Node.js, 24/7) ejecuta un **scheduler autónomo** (setInterval cada 30 s en hora Caracas) que lee los horarios dinámicos desde Google Sheets y dispara recordatorios de entrada (07:45), avisos de olvido de entrada (08:30), recordatorios de salida (16:30/16:45) y **cierre automático** (17:30) vía Web Push. La app también programa avisos locales como complemento.

## Usuarios

| Usuario | Rol | Necesidad |
| --- | --- | --- |
| Personal Silocom | Empleado | Marcar entrada/salida rápido desde el teléfono |
| Victor Solorzano (vsolorzano.silocom@gmail.com) | Administrador | Ver asistencias, métricas, empleados y configuración; recibir avisos y verificar marcajes en la hoja |

## Datos manejados

- Empleados (nombre, cédula, ID de dispositivo vinculado, tipo).
- Registros de asistencia (empleado, tipo de marcaje, fecha/hora, coordenadas, estado).
- Suscripciones push (endpoint, llaves, estado) en la hoja `DispositivosPush`.
- Configuración (coordenadas de oficina, radio, horarios, admin).

## Reglas de negocio

- Solo se marca **dentro** de la geocerca (60 m). Fuera de rango → marcaje bloqueado (`INVALID_UBICACION`).
- Un dispositivo solo puede marcar por el empleado al que está vinculado.
- Primera vez: si el empleado no existe, se da de alta automáticamente con el celular actual.
- Entrada esperada 08:00 y salida 17:00, con 30 min de tolerancia (estados `TEMPRANO`, `A TIEMPO`, `RETARDO`).
- A las **17:30** se cierran automáticamente los turnos que quedaron abiertos (salida registrada como `CIERRE AUTOMATICO / SISTEMA`).
- La escritura en `Asistencias` preserva las fórmulas de las columnas G/H (solo escribe columnas A–F).

## Alcance / No alcance

**Incluye:** marcaje GPS, vínculo de dispositivo, panel admin (5 pestañas), métricas por período, notificaciones locales y push remotas, cierre automático, PWA instalable.

**No incluye:** gestión de incidencias, reportes formales de nómina, integración con otros sistemas (se mantiene aislado con su Sheets propio).
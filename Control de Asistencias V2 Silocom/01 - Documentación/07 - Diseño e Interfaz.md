---
tipo: documentacion
proyecto: Control de Asistencias V2 Silocom
seccion: Diseño e Interfaz
creado: 2026-09-09
actualizado: 2026-09-10
---

# 07 - Diseño e Interfaz

## Identidad visual

- **Estética**: dark tech / dashboard, fondo oscuro (azul muy oscuro `#090d16` aprox.), paneles con bordes sutiles y glow.
- **Acentos**: verde esmeralda / sky (#10b981 / #0284c7 aprox.) para estados y acciones.
- **Tipografías**: Manrope / Space Grotesk (títulos) y JetBrains Mono (números, horas, coordenadas) — fuente mono heredada de la estética V1.
- **Marca**: logo Silocom (SVG en `SilocomLogo.tsx`) + nombre "Silocom" en cabecera.

## Pantalla principal (tarjeta de marcaje)

- **Cabecera** (`Header.tsx`): logo, nombre del sistema, reloj en vivo, botón de instalación PWA y botón de **admin** (solo visible si el usuario es admin).
- **Reloj y línea de turno** (`LiveClock.tsx` + `ShiftTimeline.tsx`): hora actual en grande, día, y barra que muestra el avance del turno 08:00 → 17:00 con marcadores de entrada/salida.
- **Indicador GPS** (`GPSIndicator.tsx`): estado de la geolocalización:
  - Buscando (spinner) → Dentro de la zona (verde) → Fuera de zona (rojo/ámbar).
- **Tarjeta de marcaje** (`PunchCard.tsx`):
  - Botón **ENTRADA** (verde) y botón **SALIDA** (sky).
  - Muestra el estado de hoy (Entrada registrada, Salida pendiente, Falta, Cierre por sistema).
  - Muestra el ID del empleado/device vinculado.
- **Modal de feedback** (`FeedbackModal.tsx`): resultado del marcaje:
  - Éxito (con hora y estado), error de ubicación (fuera de rango), error de dispositivo (suplantación), o errores de red.
  - En caso de éxito muestra "marcaje registrado" con detalle de fecha/coordenadas.

## Panel de administración (`AdminModal.tsx`) — 5 pestañas

| Pestaña | Contenido |
| --- | --- |
| **Resumen** | Total de empleados, marcajes de hoy, estado actual, últimos registros |
| **Métricas** | Días asistidos, puntualidad, retrasos por empleado (período; días laborables base 22) |
| **Empleados** | Lista, alta manual, edición de nombre/tipo, vínculo de dispositivo |
| **Configuración** | Horarios y tolerancias, epicentro/radio, pruebas: **Prueba en Sede** (simula GPS dentro del radio), **prueba de notificación** (cuenta regresiva), prueba de push remoto y estado del scheduler Railway |
| **Código** | Acceso rápido al código GAS (v2.6) y al `server.ts` de Railway |

## Notificaciones

- **Permisos**: al primer uso se solicita permiso de notificaciones (además del de ubicación).
- **Avisos locales**: recordatorio entrada 07:45, olvido 08:30, salida 16:30 (una vez por día).
- **Push remoto**: notificaciones del sistema (mismas horas + cierre 17:30) llegan vía Web Push aunque la app no esté abierta activamente.

## PWA

- Instalable en móvil (manifest + icons).
- `PWAInstallButton` muestra el botón de instalar cuando el navegador lo permite (incluye guía iOS).
- El service worker cachea la app y maneja `notificationclick` (abre y enfoca la app).

## Responsividad

- Diseño móvil-first con Tailwind: tarjeta de marcaje centrada, paneles apilados; en desktop muestra un layout más ancho con tarjetas en fila.
- La PWA está pensada para uso principal en el celular del empleado.
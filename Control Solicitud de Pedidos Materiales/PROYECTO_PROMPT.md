# 🏗️ PROYECTO: Control Solicitud de Pedidos Materiales

## PROMPT MAESTRO PARA ANTIGRAVITYIDE

> Este documento es la instrucción completa que AntigravityIDE debe leer para implementar todo el proyecto. Copia y pega este prompt completo en AntigravityIDE como instrucción principal.

---

## 📌 FICHA IDENTIFICATIVA DEL PROYECTO

```
PROYECTO: Control Solicitud de Pedidos Materiales
DESARROLLO & ARQUITECTURA: Victor Solorzano
ASISTENCIA TÉCNICA: Opencode for Obsidian & Antigravity IDE
ROL: Controlador Principal - Frontend PWA + Backend GAS
```

---

## 🎯 RESUMEN DEL PROYECTO

Una **aplicación web PWA** (Progressive Web App) para la gestión de solicitudes de materiales de construcción. La app permite a ingenieros y arquitectos registrar solicitudes de materiales que se sincronizan automáticamente con un **Google Sheets** como base de datos backend.

### Componentes:
1. **Frontend PWA** (web-frontend/) - Aplicación web instalable en móvil y escritorio
2. **Backend GAS** (gas-backend/) - Google Apps Script como API Web App
3. **Google Sheets** - Base de datos con 5 hojas

### Flujo principal:
- Ingeniero abre la app → Selecciona obra, sector, material → Ingresa cantidad → Guarda → Se sincroniza automáticamente con Google Sheets
- La app carga instantáneamente usando **caché del navegador** (IndexedDB) y se sincroniza en segundo plano
- Los usuarios pueden agregar **nuevos materiales, ingenieros, obras y sectores** directamente a Base_Datos desde la app

---

## 📁 ESTRUCTURA DE ARCHIVOS

La carpeta completa se encuentra en: `C:\Users\vicos\Desktop\Mis_Proyectos_ConIA\Solovico69\Control Solicitud de Pedidos Materiales\`

```
Control Solicitud de Pedidos Materiales/
├── Control Solicitud de Pedidos Materiales.xlsx    ← Archivo fuente (.xlsx)
├── README.md                                        ← Guía completa de despliegue
├── gas-backend/
│   ├── Code.gs                                      ← Backend Google Apps Script
│   └── appsscript.json                              ← Manifiesto GAS
├── web-frontend/
│   ├── index.html                                   ← PWA principal (completo)
│   ├── sw.js                                        ← Service Worker
│   ├── manifest.json                                ← Configuración PWA
│   ├── package.json                                 ← Para Vercel
│   ├── js/
│   │   ├── app.js                                   ← Lógica principal
│   │   └── modules/
│   │       ├── sheets-api.js                        ← API communication
│   │       ├── storage.js                           ← localStorage + IndexedDB
│   │       └── sync.js                              ← Motor de sincronización
├── .github/
│   └── workflows/
│       └── deploy-vercel.yml                        ← CI/CD Pipeline
└── stitch_formulario_solicitud_de_materiales/
    ├── code.html                                    ← HTML original de Stitch (referencia)
    ├── DESIGN.md                                    ← Sistema de diseño
    └── screen.png                                   ← Captura
```

---

## 🏗️ ARQUITECTURA TÉCNICA

### 1. Backend: Google Apps Script Web App

Ubicado en `gas-backend/Code.gs`. Funciona como API REST.

**Funciones principales:**
- `doGet(e)` - Sirve datos iniciales, obtiene encabezados, lee hojas
- `doPost(e)` - Recibe formularios, envía datos a Sheets
- `getHeaders(sheetName)` - Obtiene encabezados por nombre (NO por número de columna)
- `getColumnIndex_(sheetName, headerName)` - Encuentra columna por nombre
- `readSheetData_(sheetName)` - Lee datos con detección por encabezados
- `appendRowData_(sheetName, data)` - Escribe fila usando encabezados
- `addToBaseDatos(entry)` - Agrega nuevo material/ingeniero/obra
- `getHeaderRowIndex_(sheetName)` - Detecta la fila de encabezados (tolera títulos)
- `insertSolicitudLines_(lines)` - Inserta partidas respetando columnas formuladas
- `addToBaseDatosCatalog_(entry)` - Agrega a Base_Datos por columna-catálogo independiente
- `onInstall()` / `onOpen()` - Menú contextual en Sheets

**Todas las funciones de lectura/escritura usan NOMBRES DE ENCABEZADO, nunca números de columna.**

### 2. Frontend: PWA con Vanilla JS

Tres módulos JS separados:

#### `js/modules/storage.js`
- **localStorage**: Guarda permanentemente el Sheet ID y Web App URL
- **IndexedDB**: Cache temporal de datos del Sheets (TTL: 5 minutos)
- **Stale-while-revalidate**: La app carga cache primero, actualiza en segundo plano

#### `js/modules/sheets-api.js`
- Comunicación con GAS Web App via `fetch()`
- `get(action)` - Peticiones GET
- `post(action, body)` - Peticiones POST
- `getInitData()` - Datos iniciales con cache
- `getBaseDatos()` - Datos de referencia para dropdowns
- `submitSolicitud(data)` - Envía formulario
- `addToBaseDatos(entry)` - Agrega a Base_Datos
- **Header-based detection**: Mapea datos por nombre de encabezado

#### `js/modules/sync.js`
- Motor de sincronización periódica (cada 30s)
- Detecta online/offline
- Cola de operaciones pendientes si hay error
- Actualiza UI con indicadores de estado de sincronización
- **Offline-first**: Funciona sin conexión, sincroniza al reconectar

#### `js/app.js`
- Lógica principal de la UI
- Gestión de filas de materiales (máx 30)
- Validación de formulario
- Modal de éxito con folio
- Formulario para agregar a Base_Datos
- Tema claro/oscuro con persistencia

### 3. Google Sheets (Backend Data)

**5 hojas:**
1. `Solicitudes` - Datos principales de cada solicitud (10 columnas)
2. `Entrada_Materiales` - Registro de entrada de materiales
3. `Salida_Materiales` - Registro de salida/despacho
4. `Invetario_Materiales` - Inventario con cálculo automático (Entrada - Salida = Disponibilidad)
5. `Base_Datos` - Tabla de referencia con encabezados: ARQUITECTO/INGENIERO, OBRAS, SECTOR DE LA OBRA, MATERIAL, METRICA

---

## 🔧 INSTRUCCIONES PARA ANTIGRAVITYIDE

### Tarea 1: Revisar el Backend GAS

1. Abre `gas-backend/Code.gs`
2. **Analiza cada función** y verifica que:
   - Los nombres de encabezado en `getHeaders()` coincidan con los del Excel
   - Las funciones `doGet` y `doPost` manejen todos los cases
   - La detección de cambios en columnas funcione correctamente
3. Si es necesario, **ajusta los nombres de encabezado** para que coincidan exactamente con la hoja Base_Datos del Excel
4. Verifica que `appsscript.json` tenga los scopes correctos

### Tarea 2: Optimizar el Frontend PWA

1. Abre `web-frontend/index.html`
2. Verifica que todos los elementos tengan IDs correctos
3. Revisa que los módulos JS estén correctamente enlazados
4. Asegúrate de que el Service Worker registre correctamente

### Tarea 3: Configurar el flujo de datos

1. **Al cargar la app:**
   - Leer `localStorage` para Sheet ID y Web App URL
   - Si no existen → Mostrar pantalla de configuración
   - Si existen → Cargar datos desde IndexedDB (instantáneo) → Sincronizar con Sheets en segundo plano

2. **Para los dropdowns (Ingenieros, Obras, Sectores, Materiales, Métricas):**
   - Leer de `Base_Datos` del Sheets
   - Poblar `<datalist>` y `<select>` dinámicamente
   - Si el usuario escribe algo que no existe → Ofrecer opción de agregar a Base_Datos

3. **Para el formulario de solicitud:**
   - Validar campos obligatorios antes de enviar
   - Preparar datos mapeados por nombre de encabezado
   - Enviar via POST a GAS Web App
   - Mostrar modal de éxito con folio generado
   - Resetear formulario para nueva solicitud

4. **Para agregar a Base_Datos:**
   - El usuario puede agregar nuevo material, ingeniero, obra o sector
   - Verificar si ya existe antes de agregar
   - Enviar via POST a `addToBaseDatos`
   - Actualizar dropdowns automáticamente

### Tarea 4: Configurar despliegue

1. **GitHub**: Crear repositorio con todos los archivos de `web-frontend/`
2. **Vercel**: Conectar el repositorio y desplegar
3. **Google Sheets**: Subir el .xlsx y crear el GAS Web App
4. **Configuración inicial**: El primer usuario ingresa el Spreadsheet ID y la Web App URL en localStorage

---

## 🔑 DETALLES CLAVE DE IMPLEMENTACIÓN

### Header-Based Detection (CRÍTICO)

**NUNCA** uses números de columna fija. Siempre usa nombres de encabezado:

```javascript
// ✅ CORRECTO
const headers = getHeaders('Solicitudes');
const materialIdx = headers.indexOf('MATERIAL') + 1; // 1-indexed

// ❌ INCORRECTO (se rompe si mueves columnas)
const material = data[6]; // ← ROTO
```

### Estrategia de Cache

```
1. Usuario abre app
2. localStorage → ¿Hay Sheet ID? → No → Pantalla de configuración
3. Sí → IndexedDB → ¿Hay datos cacheados (< 5 min)? → Mostrar instantáneamente
4. En segundo plano → Fetch a GAS Web App → Actualizar cache → Actualizar UI
```

### Detección de Encabezados (Header-Based)

El backend GAS localiza la fila de cabecera de forma heurística (`getHeaderRowIndex_()`),
tolera filas de título y mapea TODA lectura/escritura por nombre de encabezado:
- Nunca usar números de columna fija (`data[6]`)
- `getColumnIndex_(sheetName, header)` resuelve el índice por nombre
- La inserción en `Solicitudes` salta las columnas formuladas (`N#`, `N# SOLICITUD`) y propaga sus fórmulas

### Stale-While-Revalidate

```javascript
// En storage.js
async function getStaleWhileRevalidate(key, fetchFn) {
  const cached = await getCache(key);
  if (cached) {
    fetchFn(); // Actualizar en segundo plano
    return cached; // Mostrar inmediatamente
  }
  return fetchFn(); // No hay cache, obtener del servidor
}
```

---

## 📊 ENCABEZADOS DEL GOOGLE SHEETS (REFERENCIA)

### Hoja: Solicitudes
```
N# | N# SOLICITUD | FECHA | SOLICITANTE | OBRA | SECTOR DE LA OBRA | MATERIAL | METRICA | CANTIDAD | APROBADO
```

### Hoja: Base_Datos
```
ARQUITECTO/INGENIERO | OBRAS | SECTOR DE LA OBRA | MATERIAL | METRICA
```

### Hoja: Entrada_Materiales
```
N# | MATERIAL | METRICA | CANTIDAD | FECHA
```

### Hoja: Salida_Materiales
```
N# | OBRA | MATERIAL | METRICA | CANTIDAD | FECHA
```

### Hoja: Invetario_Materiales
```
MATERIAL | CANT ENTRADA | CANT SALIDA | DISPONIBILIDAD
```

---

## 🚀 PASOS DE DESPLIEGUE (PARA ANTIGRAVITYIDE)

### Paso 1: Verificar el Excel
El archivo `.xlsx` en la carpeta tiene la estructura completa. Verifica:
- 5 hojas con encabezados correctos
- Base_Datos tiene ~40 materiales listados
- Solicitudes está vacía (solo encabezados) - será el destino de los formularios

### Paso 2: Crear Google Sheets + GAS
1. Subir el .xlsx a Google Drive → Google Sheets
2. Abrir Apps Script en el Sheets
3. Pegar `gas-backend/Code.gs`
4. Implementar como Web App (Acceso: Cualquier persona)
5. **Anotar el Spreadsheet ID** de la URL
6. **Anotar la Web App URL** (termina en `/exec`)

### Paso 3: Configurar Frontend
1. El primer usuario configura el Spreadsheet ID y Web App URL
2. Se guarda en `localStorage` (permanente)
3. La app carga los datos y se conecta

### Paso 4: GitHub + Vercel
1. Subir `web-frontend/` a GitHub
2. Conectar a Vercel
3. Despliegue automático con cada push

### Paso 5: PWA
1. El Service Worker (`sw.js`) cachea assets estáticos
2. El `manifest.json` permite instalación como app
3. Funciona offline con datos cacheados

---

## 🎨 DISEÑO (Industrial Precision)

### Paleta de colores:
- **Primario**: `#0F2942` (Acero estructural)
- **Secundario**: `#F59E0B` (Ámbar de seguridad)
- **Terciario**: `#059669` (Esmeralda)
- **Fondo**: `#F8FAFC` (Canvas claro)
- **Modo oscuro**: `#0F172A` fondo, `#E2E8F0` texto

### Tipografía:
- Títulos: Plus Jakarta Sans (bold 600/700)
- UI: Inter (regular 400, semibold 600)
- Números: monospace (`tabular-nums`)

### Componentes:
- Cards con bordes sutiles y sombras tipo CAD
- Botones con efecto gradiente hover
- Sync pill indicador de estado
- Progress bar para capacidad de líneas

---

## 🔐 SEGURIDAD Y NOTAS

- **CORS**: Configurado en `buildResponse_()` del GAS para aceptar peticiones de cualquier origen
- **Autenticación**: No requiere login por usuario (uso interno)
- **Offline**: Service Worker permite uso sin internet
- **Cache TTL**: 5 minutos por defecto (configurable)
- **Máximo de líneas**: 30 partidas por solicitud

---

## ❓ PREGUNTAS PARA VERIFICAR ANTES DE IMPLEMENTAR

1. ¿Los encabezados en `Code.gs` coinciden EXACTAMENTE con los del Excel?
2. ¿El GAS debe manejar la conversión del .xlsx a formato Sheets nativo?
3. ¿Se necesita algún campo adicional en Base_Datos?
4. ¿La app debe tener usuario/login o es completamente abierta?
5. ¿Los 5 proyectos actuales (Torre Alvear, Complejo Logístico, etc.) son correctos?
6. ¿Se necesitan gráficos o dashboards adicionales en el futuro?

---

> **Nota**: Este prompt es auto-contenido. AntigravityIDE debe leer todos los archivos en la carpeta del proyecto y usar este documento como guía maestra. La implementación debe priorizar:
> 1. Correctitud de la conexión con Google Sheets
> 2. Detección por encabezados (no números de columna)
> 3. UX fluida con caché y sincronización
> 4. PWA fully functional

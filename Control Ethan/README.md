# Control Ethan &bull; Sistema de Gestión de Inventario y Ventas iPhone

```
/**
 * PROYECTO: Control Ethan - Sistema de Inventario y Ventas iPhone
 * DESARROLLO & ARQUITECTURA: Victor Solorzano
 * ASISTENCIA TÉCNICA: OpenCode for Obsidian & Antigravity IDE
 * ROL: Documentación Técnica de Despliegue y Manual de Configuración
 */
```

Aplicación Web Progresiva (**PWA**) de alta gama diseñada con paleta de lujo en **Verde Esmeralda** y **Oro Satinado**, creada para gestionar entradas, ventas y stock en tiempo real directamente con **Google Sheets**.

---

## 📱 Características Principales

- **Acceso Biométrico en iPhone:** Soporte nativo para **Face ID** y **Touch ID** mediante la API WebAuthn en modo PWA.
- **Seguridad con PIN de 4 Dígitos:** Configuración inicial, teclado numérico estilo iOS y sistema de recuperación con palabra clave.
- **Tasa BCV Dual (Automática + Manual):** 
  - Consulta automática en vivo desde el Banco Central de Venezuela.
  - Switch condicional *"Aplica Tasa"* que muestra u oculta el campo de tasa y realiza conversión bidireccional inmediata (USD a Bs. y viceversa).
- **Protección Estricta de Fórmulas:** El backend de Google Apps Script mapea dinámicamente las columnas por su nombre exacto de encabezado y salta las columnas formuladas (`ID Entrada`, `ID Venta`, `Costo Total ($)`, `Total Venta ($)`), garantizando que las fórmulas nativas de Google Sheets jamás se sobreescriban.
- **Caché Instantáneo & Modo Offline:** Carga en menos de 100 ms usando `localStorage` y actualiza en segundo plano.
- **Diseño Moderno & Temas:** Selector dinámico de Modo Claro y Modo Oscuro, con muelle flotante (*dock*) inferior interactivo estilo iOS.

---

## 🚀 Paso 1: Configurar Google Apps Script (Backend)

Tu hoja de Google Sheets está identificada con el ID:
`1XA_RhgURM3Kj4DaJ4IRBQQ2R604OsH62kRM3TMJJIRs`

1. Abre tu hoja en Google Sheets:
   [https://docs.google.com/spreadsheets/d/1XA_RhgURM3Kj4DaJ4IRBQQ2R604OsH62kRM3TMJJIRs/edit](https://docs.google.com/spreadsheets/d/1XA_RhgURM3Kj4DaJ4IRBQQ2R604OsH62kRM3TMJJIRs/edit)
2. En el menú superior, ve a: **Extensiones > Apps Script**.
3. Borra el código existente y pega todo el contenido de [`apps-script/Code.js`](file:///c:/Users/Victor%20Solorzano/Desktop/Mis_Proyectos_ConIA/Solovico69/Control%20Ethan/apps-script/Code.js).
4. Haz clic en **Guardar** (icono de disquete).
5. Arriba a la derecha, haz clic en **Implementar > Nueva implementación**.
6. En el engranaje ⚙️ de *Tipo*, selecciona **Aplicación web**.
7. Configura los siguientes campos:
   - **Descripción:** `Control Ethan API v1`
   - **Ejecutar como:** `Yo (tu correo de Google)`
   - **Quién tiene acceso:** `Cualquier usuario` *(Anyone - necesario para que la app móvil pueda sincronizar)*.
8. Haz clic en **Implementar** y autoriza los permisos requeridos por Google.
9. **Copia la URL de la aplicación web** generada (termina en `/exec`).

---

## 🌐 Paso 2: Vincular la URL en la App

1. Abre la aplicación en tu navegador o celular.
2. Ingresa a la pestaña **Ajustes** (último icono del dock).
3. Pega la URL del paso anterior en el campo **URL del Web App (Google Apps Script)** y pulsa **Guardar URL**.
4. Pulsa el botón **Sincronizar** para cargar los datos en vivo de tu Google Sheet.

---

## 📦 Paso 3: Subir a GitHub y Desplegar en Vercel (100% Gratuito)

### En GitHub:
```bash
git init
git add .
git commit -m "feat: Control Ethan PWA v1.0.0"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/control-ethan.git
git push -u origin main
```

### En Vercel:
1. Inicia sesión en [vercel.com](https://vercel.com) con tu cuenta de GitHub.
2. Haz clic en **Add New... > Project**.
3. Selecciona tu repositorio `control-ethan`.
4. Deja la configuración por defecto y haz clic en **Deploy**.
5. ¡Listo! Vercel te proporcionará una URL segura con HTTPS (ejemplo: `https://control-ethan.vercel.app`).

---

## 📲 Paso 4: Instalar en iPhone con Huella / Face ID

1. Abre la URL de Vercel en **Safari** en tu iPhone.
2. Toca el botón **Compartir** (icono de cuadro con flecha hacia arriba en la barra inferior de Safari).
3. Desplázate hacia abajo y selecciona **"Agregar a pantalla de inicio"** (*Add to Home Screen*).
4. Pulsa **Agregar**.
5. Abre la app desde tu pantalla de inicio como una aplicación nativa.
6. En el primer inicio, define tu **PIN de 4 dígitos** y tu palabra secreta.
7. Ve a la pestaña **Ajustes** y pulsa **"Activar / Probar Touch ID o Face ID"**.
8. A partir de ese momento, cada vez que abras la app podrás entrar con un solo toque de tu sensor biométrico.

---

Desarrollado con dedicación por **Victor Solorzano**.

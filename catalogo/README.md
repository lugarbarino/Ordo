# Ordo Catálogo

Herramienta de gestión de productos, pedidos y presupuestos para empresas.  
Incluye un catálogo público para que los clientes hagan pedidos.

Deploy: [ordo-taupe.vercel.app](https://ordo-taupe.vercel.app)

---

## Rutas

| Ruta | Descripción |
|------|-------------|
| `/catalogo` | Landing pública + login |
| `/catalogo/admin` | Panel de administración |
| `/catalogo/:slug` | Catálogo público del cliente |
| `/catalogo/:slug/nosotros` | Página "Nosotros" del cliente |

---

## Estructura de archivos

```
catalogo/
├── src/
│   ├── App.jsx                          → Rutas de toda la app (Catálogo + Marca)
│   ├── pages/
│   │   ├── Catalogo/
│   │   │   ├── Admin.jsx                → Panel admin (requiere auth)
│   │   │   ├── Landing.jsx              → Landing + login
│   │   │   ├── Public.jsx               → Catálogo público por slug
│   │   │   └── Nosotros.jsx             → Página nosotros pública
│   │   └── Marca/                       → Producto Ordo Marca (ver su propio README)
│   ├── components/
│   │   ├── Landing.jsx                  → Componente visual de la landing
│   │   ├── PexelsPicker.jsx             → Picker de imágenes de Pexels
│   │   └── admin/
│   │       ├── layout/
│   │       │   ├── Layout.jsx           → Layout del panel admin
│   │       │   └── Sidebar.jsx          → Sidebar con navegación
│   │       ├── panels/
│   │       │   ├── DashboardPanel.jsx   → Panel principal
│   │       │   ├── ProductosPanel.jsx   → CRUD de productos
│   │       │   ├── PedidosPanel.jsx     → Gestión de pedidos
│   │       │   ├── PresupuestoModal.jsx → Modal para armar presupuestos
│   │       │   ├── ProductoModal.jsx    → Modal crear/editar producto
│   │       │   ├── ConfigPanel.jsx      → Config de empresa (slug, colores, logo, banner)
│   │       │   ├── DesignPanel.jsx      → Personalización visual avanzada (tokens)
│   │       │   ├── PdfPanel.jsx         → Generación de PDF
│   │       │   └── CuentaPanel.jsx      → Cuenta del usuario
│   │       └── ui/                      → Componentes UI internos (Button, Input, Card, etc.)
│   ├── store/
│   │   ├── useAppStore.js               → Estado global: user, empresa, panel activo, toast
│   │   ├── useProductosStore.js         → CRUD y filtros de productos
│   │   └── usePedidosStore.js           → Pedidos + cache de presupuestos (persiste en localStorage)
│   └── lib/
│       ├── supabase.js                  → Cliente de Supabase (anon key pública, no es secreto)
│       └── utils.js                    → Utilidades varias
```

---

## Base de datos (Supabase)

### Tablas principales

| Tabla | Descripción |
|-------|-------------|
| `empresas` | Una fila por empresa registrada |
| `productos` | Productos del catálogo, vinculados a `empresa_id` |
| `pedidos` | Pedidos de clientes, vinculados a `empresa_id` |

### Tabla `empresas` — campos importantes

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `slug` | text | URL única de la empresa (`/catalogo/:slug`) |
| `color` | text | Color de marca en hex (`#3872fa` por defecto) |
| `logo_url` | text | URL del logo en Supabase Storage |
| `banner_url` | text | URL del banner en Supabase Storage |
| `tokens` | jsonb | Design tokens personalizados (ver abajo) |
| `email_contacto` | text | Email para recibir pedidos |
| `whatsapp` | text | Número de WhatsApp de contacto |

### Design tokens (`empresa.tokens`)

Se guardan en `empresas.tokens` como JSON. Controlan la apariencia visual del catálogo público:

```json
{
  "fontFamily": "Inter, sans-serif",
  "fontFamilyHeading": "Georgia, serif",
  "fontScale": "1",
  "radiusCard": "12px",
  "radiusBtn": "8px",
  "colorText": "#1c1c1c",
  "colorBorder": "#e8e8e8",
  "colorBgSoft": "#f5f5f3",
  "servicios": ["Entrega a domicilio", "Envíos a todo el país", "Todos los medios de pago"]
}
```

Para aplicarlos en el frontend se usan CSS variables en `:root` (ver `useAppStore.js → applyTokens`).

---

## Estado global (`useAppStore`)

```js
const { user, empresa, panel, setPanel, showToast, cargarEmpresa, guardarEmpresa } = useAppStore()
```

- `user` — usuario autenticado de Supabase
- `empresa` — datos de la empresa del usuario
- `panel` — panel activo en el admin (`'dashboard'`, `'productos'`, `'pedidos'`, etc.)
- `showToast(message, type)` — muestra un toast (`type`: `'ok'` o `'err'`)
- `cargarEmpresa()` — carga la empresa del usuario y aplica tokens/color de marca
- `guardarEmpresa(campos)` — guarda cambios en la empresa

---

## Stores de productos y pedidos

### `useProductosStore`
- `productos` — lista completa
- `cargar(empresaId)` — carga desde Supabase
- `guardar(datos, id, empresaId)` — crea o edita un producto
- `eliminar(ids, empresaId)` — elimina por array de ids
- `productosFiltrados()` — filtra por búsqueda (nombre, categoría, código)
- `seleccionados` — Set de ids seleccionados (para acciones en lote)

### `usePedidosStore`
- `pedidos` — lista completa
- `cargar(empresaId)` — carga desde Supabase
- `pedidosFiltrados()` — filtra por tab (`'Pendiente'` o `'Respondido'`)
- `responder(pedidoId, respuesta, empresaId)` — marca pedido como respondido
- `presupCache` — cache de presupuestos en progreso (persiste en localStorage)
- `guardarPresupCache(pedidoId, precios, nota)` — guarda borrador de presupuesto

---

## Deploy

**La única forma correcta:**
```bash
git add <archivos>
git commit -m "descripción"
git push origin main
```
Vercel detecta el push a `main` y hace el deploy solo. **No usar `vercel --prod` desde la CLI.**

---

## Variables de entorno

```
# catalogo/.env  (no se sube a GitHub)
VITE_PEXELS_API_KEY=...
```

La key de Supabase está en `src/lib/supabase.js` — es la `anon key` pública, no es un secreto.

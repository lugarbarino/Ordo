# Ordo

Herramienta para diseñadores gráficos y estudios de branding.  
Deploy: [ordo-taupe.vercel.app](https://ordo-taupe.vercel.app)

---

## Productos

### Ordo Catálogo (`/catalogo/`)
Gestión de productos, pedidos y presupuestos para empresas. Incluye catálogo público para clientes.

### Ordo Marca (`/catalogo/src/pages/Marca/`)
Herramienta de branding. El diseñador gestiona el proceso completo y comparte links con el cliente para recibir feedback.

**Flujo:** Brief → Exploración → Finalistas → Manual de marca

---

## Estructura del proyecto

```
/Ordo
├── catalogo/               → App principal (React + Vite + Tailwind)
│   └── src/pages/Marca/   → Producto Ordo Marca
│       ├── Proyecto.jsx    → Layout principal + Dashboard
│       ├── PanelManual.jsx → Manual de marca (editor)
│       └── Cliente/        → Vistas públicas para el cliente
├── admin/                  → Panel admin de catálogo (React + Vite)
├── marca/                  → App standalone de Marca (React + Vite)
└── supabase/               → Funciones serverless
```

---

## Stack

- **Frontend:** React 18 + Vite + Tailwind CSS
- **Backend:** Supabase (auth + base de datos + storage)
- **Deploy:** Vercel (auto-deploy desde rama `main`)

---

## Base de datos — cosas importantes

### Colores de marca
Los colores **no tienen tabla propia**. Se guardan como un array JSON dentro de `manual_marca.colores`.

Estructura de cada color:
```json
{
  "hex": "#0F766E",
  "nombre": "Principal",
  "esAcento": true,
  "esDark": false,
  "esLight": false
}
```

Para obtener el color acento de un proyecto:
```js
const { data } = await db.from('manual_marca')
  .select('colores')
  .eq('proyecto_id', proyectoId)
  .single()

const acento = data?.colores?.find(c => c.esAcento)
```

> ⚠️ No buscar en `colores_marca` — esa tabla es de la versión antigua en `/marca/`.

### Tablas principales de Marca
| Tabla | Descripción |
|-------|-------------|
| `proyectos_marca` | Proyectos de branding por cliente |
| `cuentas_marca` | Cuenta del diseñador |
| `manual_marca` | Manual completo (colores, tipografías, logos, etc.) |
| `brief_preguntas` | Preguntas del brief |
| `brief_respuestas` | Respuestas del cliente |
| `brief_referencias` | Links e imágenes de referencia |

---

## Deploy

La única forma correcta de deployar:
```bash
git add <archivos>
git commit -m "descripción"
git push origin main
```
Vercel detecta el push y hace el deploy automáticamente. **No usar `vercel --prod` desde la CLI.**

---

## Variables de entorno

Cada app tiene su propio `.env` (no se sube a GitHub):

```
# catalogo/.env y admin/.env
VITE_PEXELS_API_KEY=...
```

La key de Supabase está hardcodeada en `src/lib/supabase.js` — es la `anon key` pública, no es un secreto.

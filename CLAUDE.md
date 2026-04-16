# CLAUDE.md — Contexto del proyecto Ordo

Leé esto COMPLETO antes de hacer cualquier cosa.

---

## ⚠️ Reglas de trabajo — NO ignorar

1. **NUNCA hacer deploy con `vercel --prod` desde la CLI.** El deploy debe salir siempre de GitHub → Vercel automático.
2. **SIEMPRE subir los cambios a GitHub antes de dar por terminada una tarea.** Commit + push a `main`.
3. **NUNCA dejar código solo en un worktree.** Si usás un worktree, mergeá a `main` al terminar y borrá la rama.
4. **NUNCA crear archivos o carpetas nuevas sin commitearlas.** Si creás algo, va a GitHub.
5. Antes de empezar cualquier tarea, corré `git status` para ver el estado real del repo.

---

## 🧠 Contexto del proyecto

**Ordo** es una herramienta para diseñadores gráficos y estudios de branding en Argentina.  
Dueña del proyecto: **Lucia Garbarino** (no es desarrolladora).  
Repo: https://github.com/lugarbarino/Ordo  
Deploy: Vercel (conectado a GitHub, rama `main`)

---

## 📁 Estructura del proyecto

```
/Ordo
├── catalogo/       → App principal (React + Vite). Incluye rutas de Marca dentro.
├── admin/          → Panel admin de catálogo (React + Vite)
├── marca/          → App standalone de Marca (React + Vite) ← recién agregada a git
└── supabase/       → Funciones serverless
```

### Ordo tiene dos productos:

**1. Ordo Catálogo** (`/catalogo/`)
- Gestión de productos, pedidos y presupuestos
- Panel admin en `/admin/`
- Catálogo público para clientes

**2. Ordo Marca** (`/catalogo/src/pages/Marca/` y `/marca/`)
- Herramienta de branding para diseñadores
- Flujo: Brief → Exploración → Finalistas → Manual de marca
- Dashboard en `/catalogo/src/pages/Marca/Proyecto.jsx`
- El diseñador comparte links con sus clientes para recibir feedback

---

## 🛠️ Stack

- **Frontend:** React 18 + Vite + Tailwind CSS
- **Backend:** Supabase (auth + base de datos + storage)
- **Deploy:** Vercel (auto-deploy desde `main`)
- **Package manager:** npm

---

## 🎨 Estilo visual

- Colores principales: `#1c1c1c` (negro), `#f5f5f3` (fondo), `#e8e8e8` (bordes)
- Tipografía: la del sistema, sin fuentes externas salvo excepciones
- Estilo: limpio, minimalista, sin gradientes morados, sin exceso de bordes redondeados
- Los componentes usan Tailwind directamente (sin shadcn/ui)

---

## 🗄️ Base de datos (Supabase)

Tablas relevantes de Marca:
- `proyectos_marca` — proyectos de branding por cliente
- `cuentas_marca` — cuenta del diseñador
- `manual_marca` — manual completo (colores, tipografías, logos, etc. como JSON)
- `brief_preguntas`, `brief_respuestas`, `brief_referencias`

### ⚠️ Importante — Colores de marca
Los colores NO tienen tabla propia. Se guardan como array JSON en `manual_marca.colores`:
```json
{ "hex": "#0F766E", "nombre": "Principal", "esAcento": true, "esDark": false, "esLight": false }
```
Para obtener el color acento:
```js
const { data } = await db.from('manual_marca').select('colores').eq('proyecto_id', id).single()
const acento = data?.colores?.find(c => c.esAcento)
```
No buscar en `colores_marca` — esa tabla es de la versión antigua en `/marca/`.

---

## 📋 Estado actual del proyecto

- [ ] Subir `marca/` a GitHub (carpeta local nunca commiteada)
- [ ] Mejorar el diseño del dashboard de Marca (`/catalogo/src/pages/Marca/Proyecto.jsx`)
- [ ] Conectar Vercel a `main` correctamente para auto-deploy

---

## 🚀 Cómo hacer deploy

**La única forma correcta:**
```bash
git add <archivos>
git commit -m "descripción del cambio"
git push origin main
```
Vercel detecta el push y hace el deploy solo. Listo.

import { useState, useRef } from 'react'
import { FileText, Upload, Sparkles, Table2, CheckCircle2, X } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'
import { useProductosStore } from '../../store/useProductosStore'
import { db, SUPABASE_URL } from '../../lib/supabase'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { Tabs } from '../ui/Tabs'

const TABS = [
  { value: 'pdf', label: 'PDF con IA' },
  { value: 'csv', label: 'CSV / Excel' },
]

// CSV column aliases → canonical field
const ALIASES = {
  nombre: ['nombre', 'name', 'producto', 'product', 'descripcion corta', 'titulo'],
  codigo: ['codigo', 'code', 'sku', 'ref', 'referencia', 'cod', 'código'],
  categoria: ['categoria', 'category', 'rubro', 'familia', 'categoría'],
  descripcion: ['descripcion', 'description', 'detalle', 'descripción', 'descripcion larga'],
  precio: ['precio', 'price', 'importe', 'valor', 'costo', 'pvp'],
  stock: ['stock', 'disponibilidad', 'availability', 'existencia'],
  imagen_url: ['imagen_url', 'imagen', 'image', 'foto', 'url_imagen', 'image_url'],
}

function detectarColumnas(headers) {
  const map = {} // canonical → index
  headers.forEach((h, i) => {
    const norm = h.toLowerCase().trim()
    for (const [campo, alias] of Object.entries(ALIASES)) {
      if (alias.some(a => norm.includes(a)) && !(campo in map)) {
        map[campo] = i
      }
    }
  })
  return map
}

function parsearCSV(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim())
  if (lines.length < 2) return { headers: [], rows: [] }
  const split = line => {
    const cols = []; let cur = ''; let inQ = false
    for (const ch of line) {
      if (ch === '"') { inQ = !inQ }
      else if (ch === ',' && !inQ) { cols.push(cur.trim()); cur = '' }
      else cur += ch
    }
    cols.push(cur.trim())
    return cols
  }
  const headers = split(lines[0])
  const rows = lines.slice(1).map(split)
  return { headers, rows }
}

// ── PDF Tab ────────────────────────────────────────────────────────────────

function PdfTab() {
  const { empresa, showToast } = useAppStore()
  const { cargar } = useProductosStore()
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [resultado, setResultado] = useState(null)
  const fileRef = useRef()

  const handleUpload = async () => {
    if (!file || !empresa) return
    setLoading(true); setResultado(null)
    const path = `${empresa.id}/${Date.now()}_${file.name}`
    const { error: upErr } = await db.storage.from('pdfs').upload(path, file, { upsert: true })
    if (upErr) { showToast('Error al subir PDF: ' + upErr.message, 'err'); setLoading(false); return }
    const pdf_url = `${SUPABASE_URL}/storage/v1/object/public/pdfs/${path}`
    const { data: { session } } = await db.auth.getSession()
    const res = await fetch(`${SUPABASE_URL}/functions/v1/extraer-pdf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
      body: JSON.stringify({ pdf_url, empresa_id: empresa.id })
    })
    const json = await res.json()
    if (!res.ok) { showToast('Error al procesar: ' + (json.error || 'unknown'), 'err'); setLoading(false); return }
    setResultado(json); await cargar(empresa.id)
    showToast(`${json.insertados || 0} productos importados`)
    setLoading(false)
  }

  return (
    <div className="space-y-5">
      {/* Cómo funciona */}
      <div className="bg-[#f8f9fa] rounded-xl p-4 text-sm text-[#555] space-y-1.5">
        <p className="font-semibold text-[#111] flex items-center gap-1.5"><Sparkles size={14} className="text-[var(--brand)]" /> ¿Cómo funciona?</p>
        <p>Subís tu catálogo en PDF → la IA lee todas las páginas → te muestra los productos encontrados → confirmás cuáles importar.</p>
      </div>

      <div
        className="border-2 border-dashed border-[#e3e3e3] rounded-xl p-8 text-center cursor-pointer hover:border-[var(--brand)] transition-colors"
        onClick={() => fileRef.current?.click()}
      >
        {file ? (
          <div className="flex items-center justify-center gap-2 text-sm font-medium text-[#111]">
            <FileText size={18} className="text-[var(--brand)]" /> {file.name}
          </div>
        ) : (
          <div>
            <Upload size={28} className="mx-auto mb-2 text-[#ccc]" />
            <p className="text-sm text-[#888]">Hacé click para elegir un PDF</p>
            <p className="text-xs text-[#bbb] mt-1">Máx 20MB</p>
          </div>
        )}
      </div>
      <input type="file" ref={fileRef} accept=".pdf" className="hidden" onChange={e => { setFile(e.target.files[0]); setResultado(null) }} />

      <Button variant="primary" loading={loading} onClick={handleUpload} disabled={!file} className="w-full justify-center">
        {loading ? 'Procesando con IA...' : 'Importar productos'}
      </Button>

      {resultado && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm text-emerald-700">
          <CheckCircle2 size={16} /> Se importaron <strong>{resultado.insertados}</strong> productos correctamente.
        </div>
      )}
    </div>
  )
}

// ── CSV Tab ────────────────────────────────────────────────────────────────

function CsvTab() {
  const { empresa, showToast } = useAppStore()
  const { cargar } = useProductosStore()
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null) // { productos, mapa, total }
  const [importando, setImportando] = useState(false)
  const [resultado, setResultado] = useState(null)
  const [seleccionados, setSeleccionados] = useState(new Set())
  const fileRef = useRef()

  const procesarCSV = (f) => {
    setFile(f); setResultado(null)
    const reader = new FileReader()
    reader.onload = (e) => {
      const { headers, rows } = parsearCSV(e.target.result)
      const mapa = detectarColumnas(headers)
      const productos = rows
        .filter(r => r.some(c => c))
        .map(r => {
          const p = {}
          for (const [campo, idx] of Object.entries(mapa)) p[campo] = r[idx] || ''
          return p
        })
        .filter(p => p.nombre)
      setPreview({ productos, mapa, total: rows.length })
      setSeleccionados(new Set(productos.map((_, i) => i)))
    }
    reader.readAsText(f, 'UTF-8')
  }

  const handleImportar = async () => {
    if (!preview || !empresa) return
    setImportando(true)
    const lista = preview.productos
      .filter((_, i) => seleccionados.has(i))
      .map(p => ({ ...p, empresa_id: empresa.id }))

    const { error } = await db.from('productos').insert(lista)
    if (error) { showToast('Error al importar: ' + error.message, 'err'); setImportando(false); return }
    await cargar(empresa.id)
    setResultado(lista.length)
    setPreview(null); setFile(null)
    showToast(`${lista.length} productos importados`)
    setImportando(false)
  }

  const toggleSel = (i) => {
    const s = new Set(seleccionados)
    s.has(i) ? s.delete(i) : s.add(i)
    setSeleccionados(s)
  }

  const campos = preview ? Object.keys(preview.mapa) : []

  return (
    <div className="space-y-5">
      {/* Cómo funciona */}
      <div className="bg-[#f8f9fa] rounded-xl p-4 text-sm text-[#555] space-y-1.5">
        <p className="font-semibold text-[#111] flex items-center gap-1.5"><Table2 size={14} className="text-[var(--brand)]" /> Formato</p>
        <p>Exportá desde Excel como CSV. Las columnas pueden estar en cualquier orden — las detectamos automáticamente.</p>
      </div>

      {!preview ? (
        <>
          <div
            className="border-2 border-dashed border-[#e3e3e3] rounded-xl p-8 text-center cursor-pointer hover:border-[var(--brand)] transition-colors"
            onClick={() => fileRef.current?.click()}
          >
            {file ? (
              <div className="flex items-center justify-center gap-2 text-sm font-medium text-[#111]">
                <Table2 size={18} className="text-[var(--brand)]" /> {file.name}
              </div>
            ) : (
              <div>
                <Upload size={28} className="mx-auto mb-2 text-[#ccc]" />
                <p className="text-sm text-[#888]">Hacé click para elegir un CSV</p>
                <p className="text-xs text-[#bbb] mt-1">.csv exportado desde Excel o Google Sheets</p>
              </div>
            )}
          </div>
          <input type="file" ref={fileRef} accept=".csv,text/csv" className="hidden"
            onChange={e => e.target.files[0] && procesarCSV(e.target.files[0])} />
        </>
      ) : (
        <div className="space-y-4">
          {/* Header info */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">{preview.productos.length} productos detectados</p>
              <p className="text-xs text-[#888]">Columnas: {campos.join(', ')}</p>
            </div>
            <button onClick={() => { setPreview(null); setFile(null) }}
              className="p-1.5 rounded-lg hover:bg-[#f0f0f0] cursor-pointer bg-transparent border-none text-[#888]">
              <X size={16} />
            </button>
          </div>

          {/* Preview table */}
          <div className="border border-[#e3e3e3] rounded-xl overflow-hidden">
            <div className="overflow-x-auto max-h-72 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="bg-[#f8f9fa] sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left w-8">
                      <input type="checkbox"
                        checked={seleccionados.size === preview.productos.length}
                        onChange={() => setSeleccionados(
                          seleccionados.size === preview.productos.length
                            ? new Set()
                            : new Set(preview.productos.map((_, i) => i))
                        )} className="cursor-pointer" />
                    </th>
                    {campos.map(c => (
                      <th key={c} className="px-3 py-2 text-left font-semibold text-[#888] uppercase tracking-wide whitespace-nowrap">{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.productos.map((p, i) => (
                    <tr key={i} className="border-t border-[#f0f0f0] hover:bg-[#fafafa]">
                      <td className="px-3 py-2">
                        <input type="checkbox" checked={seleccionados.has(i)} onChange={() => toggleSel(i)} className="cursor-pointer" />
                      </td>
                      {campos.map(c => (
                        <td key={c} className="px-3 py-2 text-[#444] truncate max-w-[160px]">{p[c] || '—'}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <Button variant="primary" loading={importando} onClick={handleImportar}
            disabled={seleccionados.size === 0} className="w-full justify-center">
            Importar {seleccionados.size} producto{seleccionados.size !== 1 ? 's' : ''}
          </Button>
        </div>
      )}

      {resultado && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm text-emerald-700">
          <CheckCircle2 size={16} /> Se importaron <strong>{resultado}</strong> productos correctamente.
        </div>
      )}
    </div>
  )
}

// ── Panel principal ────────────────────────────────────────────────────────

export function PdfPanel() {
  const [tab, setTab] = useState('pdf')

  return (
    <div className="max-w-xl">
      <h2 className="text-xl font-bold mb-1">Cargar productos</h2>
      <p className="text-sm text-[#666] mb-5">Importá tu catálogo desde un PDF o un archivo CSV.</p>

      <div className="mb-5">
        <Tabs tabs={TABS} active={tab} onChange={setTab} />
      </div>

      <Card className="p-6">
        {tab === 'pdf' ? <PdfTab /> : <CsvTab />}
      </Card>
    </div>
  )
}

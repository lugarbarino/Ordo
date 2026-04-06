import { useState, useEffect, useRef } from 'react'
import { Search, X, Image, Video, Loader2 } from 'lucide-react'

const PEXELS_KEY = import.meta.env.VITE_PEXELS_API_KEY || ''

async function buscarFotos(query, page = 1) {
  const r = await fetch(
    `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=20&page=${page}&orientation=landscape`,
    { headers: { Authorization: PEXELS_KEY } }
  )
  const d = await r.json()
  return d.photos || []
}

async function buscarVideos(query, page = 1) {
  const r = await fetch(
    `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=20&page=${page}&orientation=landscape`,
    { headers: { Authorization: PEXELS_KEY } }
  )
  const d = await r.json()
  return d.videos || []
}

function getVideoUrl(video) {
  // prefer HD mp4, fallback to SD
  const files = video.video_files || []
  const hd = files.find(f => f.quality === 'hd' && f.file_type === 'video/mp4')
  const sd = files.find(f => f.quality === 'sd' && f.file_type === 'video/mp4')
  const any = files.find(f => f.file_type === 'video/mp4')
  return (hd || sd || any)?.link || ''
}

export function PexelsPicker({ open, onClose, onSelect }) {
  const [tab, setTab] = useState('fotos')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [hovered, setHovered] = useState(null)
  const inputRef = useRef()

  useEffect(() => {
    if (open) {
      setResults([])
      setQuery('')
      setTab('fotos')
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open])

  const buscar = async (q = query) => {
    if (!q.trim()) return
    setLoading(true)
    setResults([])
    const data = tab === 'fotos' ? await buscarFotos(q) : await buscarVideos(q)
    setResults(data)
    setLoading(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') buscar()
  }

  const handleTabChange = (t) => {
    setTab(t)
    setResults([])
    if (query.trim()) {
      setLoading(true)
      const fn = t === 'fotos' ? buscarFotos : buscarVideos
      fn(query).then(d => { setResults(d); setLoading(false) })
    }
  }

  const handleSelect = (item) => {
    if (tab === 'fotos') {
      onSelect({ type: 'image', url: item.src.original, thumb: item.src.medium })
    } else {
      const url = getVideoUrl(item)
      onSelect({ type: 'video', url, thumb: item.image })
    }
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-2xl sm:rounded-2xl flex flex-col overflow-hidden shadow-xl"
           style={{ maxHeight: '90vh', height: 580 }}>

        {/* Header */}
        <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-[#e3e3e3] flex-shrink-0">
          <div className="flex-1">
            <div className="text-sm font-bold text-[#111] mb-2">Buscar en Pexels</div>
            <div className="flex gap-2">
              {/* Tabs */}
              <div className="inline-flex gap-1 bg-[#f1f2f4] p-0.5 rounded-lg text-xs">
                {[{ v: 'fotos', icon: Image, label: 'Fotos' }, { v: 'videos', icon: Video, label: 'Videos' }].map(({ v, icon: Icon, label }) => (
                  <button key={v} onClick={() => handleTabChange(v)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition-colors border-none cursor-pointer
                      ${tab === v ? 'bg-white text-[#111] shadow-sm' : 'bg-transparent text-[#666] hover:text-[#111]'}`}>
                    <Icon size={11} /> {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <button onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[#f0f0f0] cursor-pointer bg-transparent border-none text-[#666]">
            <X size={18} />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3 flex-shrink-0">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#aaa]" />
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={tab === 'fotos' ? 'Buscá fotos, ej: "montañas", "café"…' : 'Buscá videos, ej: "ciudad", "naturaleza"…'}
                className="w-full pl-8 pr-3 py-2 text-sm border border-[#e3e3e3] rounded-lg focus:outline-none focus:border-[var(--brand)] bg-[#f8f9fa]"
              />
            </div>
            <button
              onClick={() => buscar()}
              disabled={!query.trim() || loading}
              className="px-4 py-2 text-sm font-semibold bg-[var(--brand)] text-white rounded-lg disabled:opacity-40 cursor-pointer border-none hover:opacity-90 transition-opacity">
              Buscar
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {loading && (
            <div className="flex items-center justify-center h-32">
              <Loader2 size={24} className="animate-spin text-[#aaa]" />
            </div>
          )}

          {!loading && results.length === 0 && !query && (
            <div className="flex flex-col items-center justify-center h-32 text-[#aaa]">
              <Search size={28} className="mb-2" />
              <p className="text-sm">Buscá {tab === 'fotos' ? 'una foto' : 'un video'} para el banner</p>
            </div>
          )}

          {!loading && results.length === 0 && query && (
            <div className="flex items-center justify-center h-32 text-[#aaa] text-sm">
              Sin resultados para "{query}"
            </div>
          )}

          {!loading && results.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {results.map((item) => {
                const thumb = tab === 'fotos' ? item.src?.medium : item.image
                const id = item.id
                return (
                  <div
                    key={id}
                    className="relative rounded-xl overflow-hidden cursor-pointer group aspect-video bg-[#f0f0f0]"
                    onMouseEnter={() => setHovered(id)}
                    onMouseLeave={() => setHovered(null)}
                    onClick={() => handleSelect(item)}
                  >
                    <img src={thumb} alt="" className="w-full h-full object-cover" />
                    {tab === 'videos' && (
                      <div className="absolute top-2 left-2">
                        <div className="bg-black/60 rounded px-1.5 py-0.5 flex items-center gap-1">
                          <Video size={10} className="text-white" />
                          <span className="text-[10px] text-white font-medium">Video</span>
                        </div>
                      </div>
                    )}
                    <div className={`absolute inset-0 bg-black/30 flex items-center justify-center transition-opacity
                      ${hovered === id ? 'opacity-100' : 'opacity-0'}`}>
                      <span className="bg-white text-[#111] text-xs font-semibold px-3 py-1.5 rounded-lg">
                        Usar {tab === 'fotos' ? 'foto' : 'video'}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-[#f0f0f0] flex-shrink-0">
          <p className="text-[10px] text-[#bbb] text-center">
            Fotos y videos de <a href="https://www.pexels.com" target="_blank" rel="noreferrer" className="underline">Pexels</a>.
            Necesitás agregar tu API key en <code className="bg-[#f0f0f0] px-1 rounded">.env</code> como{' '}
            <code className="bg-[#f0f0f0] px-1 rounded">VITE_PEXELS_API_KEY</code>
          </p>
        </div>
      </div>
    </div>
  )
}

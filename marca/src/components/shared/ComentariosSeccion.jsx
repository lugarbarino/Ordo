import { useState, useEffect } from 'react'
import { MessageSquare, Send } from 'lucide-react'
import { db } from '../../lib/supabase'

export function ComentariosSeccion({ proyectoId, seccion }) {
  const [comentarios, setComentarios] = useState([])
  const [texto, setTexto] = useState('')
  const [autor, setAutor] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!proyectoId || !open) return
    cargar()
  }, [proyectoId, seccion, open])

  const cargar = async () => {
    const { data } = await db
      .from('comentarios_manual')
      .select('*')
      .eq('proyecto_id', proyectoId)
      .eq('seccion', seccion)
      .order('created_at', { ascending: true })
    setComentarios(data || [])
  }

  const enviar = async () => {
    if (!texto.trim()) return
    setEnviando(true)
    await db.from('comentarios_manual').insert({
      proyecto_id: proyectoId,
      seccion,
      texto: texto.trim(),
      autor: autor.trim() || 'Cliente',
    })
    setTexto('')
    await cargar()
    setEnviando(false)
  }

  const count = comentarios.length

  return (
    <div className="mt-8">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 text-sm font-medium text-[#666] hover:text-[#111] transition-colors cursor-pointer bg-transparent border-none p-0"
      >
        <MessageSquare size={15} />
        {open ? 'Cerrar comentarios' : `Comentarios${count > 0 ? ` (${count})` : ''}`}
      </button>

      {open && (
        <div className="mt-4 border border-[#e3e3e3] rounded-xl p-5 space-y-4 bg-white">
          {comentarios.length === 0 && (
            <p className="text-sm text-[#aaa]">Aún no hay comentarios en esta sección.</p>
          )}
          {comentarios.map(c => (
            <div key={c.id} className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-[#f1f1f1] flex items-center justify-center text-xs font-bold text-[#666] flex-shrink-0">
                {c.autor?.[0]?.toUpperCase() || 'C'}
              </div>
              <div>
                <div className="text-xs font-semibold text-[#444]">{c.autor || 'Cliente'}</div>
                <div className="text-sm text-[#333] mt-0.5">{c.texto}</div>
              </div>
            </div>
          ))}

          <div className="pt-2 border-t border-[#f1f1f1] space-y-2">
            <input
              value={autor}
              onChange={e => setAutor(e.target.value)}
              placeholder="Tu nombre (opcional)"
              className="w-full px-3 py-2 text-sm border border-[#e3e3e3] rounded-lg outline-none focus:border-[#aaa] bg-white"
            />
            <div className="flex gap-2">
              <textarea
                value={texto}
                onChange={e => setTexto(e.target.value)}
                placeholder="Dejá tu comentario..."
                rows={2}
                className="flex-1 px-3 py-2 text-sm border border-[#e3e3e3] rounded-lg outline-none focus:border-[#aaa] resize-none bg-white"
                onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) enviar() }}
              />
              <button
                onClick={enviar}
                disabled={enviando || !texto.trim()}
                className="px-3 py-2 rounded-lg bg-[#191A23] text-white text-sm font-medium cursor-pointer disabled:opacity-40 flex-shrink-0 border-none"
              >
                <Send size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

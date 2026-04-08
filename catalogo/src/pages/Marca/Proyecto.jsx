import { useParams, useNavigate } from 'react-router-dom'

export default function MarcaProyecto() {
  const { proyectoId } = useParams()
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-[#f5f5f3] flex flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-2xl font-black text-[#1c1c1c]">Proyecto {proyectoId}</h1>
      <p className="text-[#888] text-sm">Próximamente — gestión del proyecto.</p>
      <button onClick={() => navigate('/marca/admin')}
        className="text-sm text-[#1c1c1c] underline bg-transparent border-none cursor-pointer">
        ← Volver al admin
      </button>
    </div>
  )
}

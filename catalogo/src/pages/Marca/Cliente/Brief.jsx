import { useParams } from 'react-router-dom'

export default function Brief() {
  const { nombre } = useParams()
  return (
    <div className="min-h-screen bg-[#f8f8f8] flex flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-2xl font-black text-[#1c1c1c]">Brief — {nombre}</h1>
      <p className="text-[#6b7a90] text-sm">Próximamente.</p>
    </div>
  )
}

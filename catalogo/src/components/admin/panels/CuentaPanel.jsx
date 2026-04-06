import { useState, useRef } from 'react'
import { Camera, Mail, Lock, Trash2 } from 'lucide-react'
import { db, SUPABASE_URL } from '../../../lib/supabase'
import { useAppStore } from '../../../store/useAppStore'

export function CuentaPanel() {
  const { user, empresa, setUser } = useAppStore()
  const [fotoUploading, setFotoUploading] = useState(false)
  const [emailVal, setEmailVal] = useState(user?.email || '')
  const [emailMsg, setEmailMsg] = useState('')
  const [emailLoading, setEmailLoading] = useState(false)
  const [passActual, setPassActual] = useState('')
  const [passNueva, setPassNueva] = useState('')
  const [passMsg, setPassMsg] = useState('')
  const [passLoading, setPassLoading] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deleteText, setDeleteText] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)
  const DELETE_PHRASE = 'Quiero borrar mi cuenta'
  const fileRef = useRef()

  const avatarUrl = user?.user_metadata?.avatar_url

  const subirFoto = async (file) => {
    if (!file || !user) return
    setFotoUploading(true)
    const ext = file.name.split('.').pop()
    const path = `avatars/${user.id}.${ext}`
    const { error: upErr } = await db.storage.from('logos').upload(path, file, { upsert: true })
    if (upErr) { setFotoUploading(false); return }
    const url = `${SUPABASE_URL}/storage/v1/object/public/logos/${path}`
    await db.auth.updateUser({ data: { avatar_url: url } })
    const { data: { user: u } } = await db.auth.getUser()
    setUser(u)
    setFotoUploading(false)
  }

  const cambiarEmail = async () => {
    setEmailMsg(''); setEmailLoading(true)
    const { error } = await db.auth.updateUser({ email: emailVal })
    setEmailLoading(false)
    if (error) { setEmailMsg(error.message); return }
    setEmailMsg('Te enviamos un email de confirmación.')
  }

  const cambiarPassword = async () => {
    setPassMsg(''); setPassLoading(true)
    const { error } = await db.auth.updateUser({ password: passNueva })
    setPassLoading(false)
    if (error) { setPassMsg(error.message); return }
    setPassMsg('Contraseña actualizada.')
    setPassActual(''); setPassNueva('')
  }

  const borrarCuenta = async () => {
    setDeleteLoading(true)
    // Sign out and let admin handle deletion via Supabase dashboard
    await db.auth.signOut()
    window.location.href = '/'
  }

  const inputCls = 'w-full px-3.5 py-2.5 border border-[#e3e3e3] rounded-lg text-sm outline-none focus:border-[#295e4f] transition-colors'
  const initial = empresa?.nombre?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-xl font-bold text-[#111]">Mi cuenta</h1>

      {/* Foto de perfil */}
      <div className="bg-white border border-[#e3e3e3] rounded-xl p-6">
        <h2 className="text-sm font-semibold text-[#111] mb-4">Foto de perfil</h2>
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-[#295e4f] flex items-center justify-center text-white text-xl font-bold overflow-hidden">
              {avatarUrl
                ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                : initial}
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={fotoUploading}
              className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#111] rounded-full flex items-center justify-center cursor-pointer border-2 border-white disabled:opacity-50"
            >
              <Camera size={11} className="text-white" />
            </button>
          </div>
          <div>
            <p className="text-sm font-medium text-[#111]">{user?.email}</p>
            <button onClick={() => fileRef.current?.click()} disabled={fotoUploading}
              className="text-xs text-[#295e4f] mt-0.5 bg-transparent border-none cursor-pointer p-0 hover:underline disabled:opacity-50">
              {fotoUploading ? 'Subiendo…' : 'Cambiar foto'}
            </button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden"
            onChange={e => subirFoto(e.target.files[0])} />
        </div>
      </div>

      {/* Cambiar email */}
      <div className="bg-white border border-[#e3e3e3] rounded-xl p-6 space-y-3">
        <h2 className="text-sm font-semibold text-[#111]">Cambiar email</h2>
        <div className="relative">
          <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#aaa]" />
          <input type="email" value={emailVal} onChange={e => setEmailVal(e.target.value)}
            className={inputCls + ' pl-8'} />
        </div>
        {emailMsg && <p className={`text-xs ${emailMsg.includes('confirmación') ? 'text-[#295e4f]' : 'text-red-500'}`}>{emailMsg}</p>}
        <div className="flex justify-end">
          <button onClick={cambiarEmail} disabled={emailLoading || emailVal === user?.email}
            className="px-4 py-2 bg-[#111] text-white text-sm font-semibold rounded-lg cursor-pointer hover:opacity-80 transition-opacity disabled:opacity-40 border-none">
            {emailLoading ? 'Guardando…' : 'Actualizar email'}
          </button>
        </div>
      </div>

      {/* Cambiar contraseña */}
      <div className="bg-white border border-[#e3e3e3] rounded-xl p-6 space-y-3">
        <h2 className="text-sm font-semibold text-[#111]">Cambiar contraseña</h2>
        <div className="relative">
          <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#aaa]" />
          <input type="password" value={passNueva} onChange={e => setPassNueva(e.target.value)}
            placeholder="Nueva contraseña" className={inputCls + ' pl-8'} />
        </div>
        {passMsg && <p className={`text-xs ${passMsg.includes('actualizada') ? 'text-[#295e4f]' : 'text-red-500'}`}>{passMsg}</p>}
        <div className="flex justify-end">
          <button onClick={cambiarPassword} disabled={passLoading || passNueva.length < 6}
            className="px-4 py-2 bg-[#111] text-white text-sm font-semibold rounded-lg cursor-pointer hover:opacity-80 transition-opacity disabled:opacity-40 border-none">
            {passLoading ? 'Guardando…' : 'Cambiar contraseña'}
          </button>
        </div>
      </div>

      {/* Zona de peligro */}
      <div className="bg-white border border-red-200 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-[#111] mb-2">Borrar cuenta</h2>
        <p className="text-xs text-[#666] mb-4">Al borrar tu cuenta se eliminará tu sesión. Para eliminar los datos permanentemente contactá soporte.</p>
        {!deleteConfirm
          ? <button onClick={() => setDeleteConfirm(true)}
              className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 text-sm font-semibold rounded-lg cursor-pointer hover:bg-red-50 transition-colors bg-transparent">
              <Trash2 size={14} /> Borrar cuenta
            </button>
          : <div className="space-y-3">
              <p className="text-xs text-[#666]">Escribí <span className="font-semibold text-red-600">{DELETE_PHRASE}</span> para confirmar:</p>
              <input value={deleteText} onChange={e => setDeleteText(e.target.value)}
                placeholder={DELETE_PHRASE} className={inputCls} />
              <div className="flex items-center justify-end gap-3">
                <button onClick={borrarCuenta} disabled={deleteLoading || deleteText !== DELETE_PHRASE}
                  className="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg cursor-pointer hover:bg-red-700 transition-colors disabled:opacity-50 border-none">
                  {deleteLoading ? 'Cerrando…' : 'Borrar cuenta'}
                </button>
                <button onClick={() => { setDeleteConfirm(false); setDeleteText('') }}
                  className="px-4 py-2 text-sm text-[#666] bg-transparent border-none cursor-pointer hover:text-[#111]">
                  Cancelar
                </button>
              </div>
            </div>
        }
      </div>
    </div>
  )
}

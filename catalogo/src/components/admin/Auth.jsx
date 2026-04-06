import { useState } from 'react'
import { db } from '../../lib/supabase'
import { Button } from './ui/Button'
import { Input } from './ui/Input'

export function Auth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    if (mode === 'login') {
      const { error } = await db.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
    } else {
      const { error } = await db.auth.signUp({ email, password })
      if (error) setError(error.message)
      else setSent(true)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="text-3xl font-extrabold text-[#111] tracking-[3px]">ORDO</span>
          <p className="text-sm text-[#888] mt-2">Tu catálogo digital</p>
        </div>

        <div className="bg-white border border-[#e3e3e3] rounded-2xl p-8">
          {sent ? (
            <div className="text-center">
              <div className="text-3xl mb-3">📬</div>
              <p className="font-semibold">Revisá tu email</p>
              <p className="text-sm text-[#888] mt-1">Te enviamos un link para confirmar tu cuenta.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h2 className="text-lg font-bold text-center mb-2">
                {mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
              </h2>
              <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@mail.com" required />
              <Input label="Contraseña" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
              {error && <p className="text-xs text-red-500">{error}</p>}
              <Button variant="primary" className="w-full" loading={loading} type="submit">
                {mode === 'login' ? 'Ingresar' : 'Registrarse'}
              </Button>
              <p className="text-center text-xs text-[#888]">
                {mode === 'login' ? '¿No tenés cuenta?' : '¿Ya tenés cuenta?'}{' '}
                <button type="button" onClick={() => setMode(m => m === 'login' ? 'register' : 'login')} className="text-[var(--brand)] font-semibold cursor-pointer bg-transparent border-none">
                  {mode === 'login' ? 'Registrarse' : 'Iniciar sesión'}
                </button>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

import { useAppStore } from '../../../store/useAppStore'
import { CheckCircle, XCircle } from 'lucide-react'
import { clsx } from '../../../lib/utils'

export function Toast() {
  const toast = useAppStore(s => s.toast)
  if (!toast) return null

  return (
    <div className={clsx(
      'fixed bottom-6 right-6 z-[100] flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg text-sm font-medium transition-all',
      toast.type === 'err'
        ? 'bg-red-50 text-red-700 border border-red-200'
        : 'bg-white text-[#111] border border-[#e3e3e3]'
    )}>
      {toast.type === 'err'
        ? <XCircle size={16} className="text-red-500" />
        : <CheckCircle size={16} className="text-emerald-500" />
      }
      {toast.message}
    </div>
  )
}

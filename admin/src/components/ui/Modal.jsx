import { useEffect } from 'react'
import { X } from 'lucide-react'
import { clsx } from '../../lib/utils'

export function Modal({ open, onClose, title, children, size = 'md', footer }) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  const widths = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={clsx('relative bg-white rounded-2xl shadow-2xl w-full flex flex-col max-h-[90vh]', widths[size])}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e3e3e3] flex-shrink-0">
          <h2 className="text-base font-bold text-[#111]">{title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#888] hover:bg-[#f0f0f0] hover:text-[#111] transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-6 py-4 border-t border-[#e3e3e3] flex-shrink-0 flex justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

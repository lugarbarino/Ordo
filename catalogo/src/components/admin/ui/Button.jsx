import { Loader2 } from 'lucide-react'
import { clsx } from '../../../lib/utils'

const variants = {
  primary: 'bg-[var(--brand)] text-white hover:opacity-90 disabled:opacity-50',
  dark: 'bg-[#1c1c1c] text-white hover:bg-[#333] disabled:opacity-50',
  secondary: 'bg-white border border-[#e3e3e3] text-[#111] hover:bg-[#f5f5f5] disabled:opacity-50',
  ghost: 'bg-transparent text-[#111] hover:bg-[#f0f0f0] disabled:opacity-50',
  danger: 'bg-white border border-[#e3e3e3] text-red-500 hover:bg-red-50 disabled:opacity-50',
}

const sizes = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-5 py-2.5 text-sm gap-2',
}

export function Button({
  children,
  variant = 'secondary',
  size = 'md',
  loading = false,
  icon,
  className,
  ...props
}) {
  return (
    <button
      style={{ borderRadius: 'var(--radius-btn, 8px)' }}
      className={clsx(
        'inline-flex items-center justify-center font-semibold cursor-pointer transition-all select-none whitespace-nowrap font-[Inter]',
        variants[variant],
        sizes[size],
        loading && 'pointer-events-none',
        className
      )}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        <Loader2 size={14} className="animate-spin" />
      ) : icon ? (
        <span className="material-icons" style={{ fontSize: 15 }}>{icon}</span>
      ) : null}
      {children}
    </button>
  )
}

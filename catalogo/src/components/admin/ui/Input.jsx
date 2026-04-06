import { clsx } from '../../../lib/utils'

export function Input({ label, error, className, ...props }) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-xs font-semibold text-[#666] uppercase tracking-wide">
          {label}
        </label>
      )}
      <input
        className={clsx(
          'w-full px-3 py-2 text-sm border border-[#e3e3e3] rounded-lg bg-white outline-none transition-all',
          'focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/20',
          'placeholder:text-[#bbb]',
          error && 'border-red-400',
          className
        )}
        {...props}
      />
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  )
}

export function Textarea({ label, error, className, ...props }) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-xs font-semibold text-[#666] uppercase tracking-wide">
          {label}
        </label>
      )}
      <textarea
        className={clsx(
          'w-full px-3 py-2 text-sm border border-[#e3e3e3] rounded-lg bg-white outline-none transition-all resize-none',
          'focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/20',
          'placeholder:text-[#bbb]',
          error && 'border-red-400',
          className
        )}
        {...props}
      />
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  )
}

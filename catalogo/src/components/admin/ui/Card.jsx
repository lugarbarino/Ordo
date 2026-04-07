import { clsx } from '../../../lib/utils'

export function Card({ children, className, ...props }) {
  return (
    <div
      style={{ borderRadius: 'var(--radius-card, 12px)' }}
      className={clsx('bg-white border border-[#e3e3e3]', className)}
      {...props}
    >
      {children}
    </div>
  )
}

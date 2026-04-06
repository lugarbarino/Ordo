import { clsx } from '../../lib/utils'

const variants = {
  pendiente: 'bg-orange-50 text-orange-700',
  respondido: 'bg-emerald-50 text-emerald-700',
  info: 'bg-blue-50 text-blue-700',
  neutral: 'bg-gray-100 text-gray-600',
}

export function Badge({ children, variant = 'neutral', className }) {
  return (
    <span className={clsx(
      'inline-block px-2.5 py-0.5 rounded-full text-xs font-bold',
      variants[variant] || variants.neutral,
      className
    )}>
      {children}
    </span>
  )
}

import { clsx } from '../../../lib/utils'

export function Card({ children, className, ...props }) {
  return (
    <div
      className={clsx('bg-white border border-[#e3e3e3] rounded-xl', className)}
      {...props}
    >
      {children}
    </div>
  )
}

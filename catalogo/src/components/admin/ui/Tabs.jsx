import { clsx } from '../../../lib/utils'

export function Tabs({ tabs, active, onChange, className }) {
  return (
    <div className={clsx('inline-flex gap-1 bg-[#f1f2f4] p-1 rounded-[10px]', className)}>
      {tabs.map(tab => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={clsx(
            'px-5 py-1.5 rounded-[7px] text-sm font-medium cursor-pointer transition-all font-[Inter]',
            active === tab.value
              ? 'bg-white text-[#111] font-semibold shadow-sm'
              : 'bg-transparent text-[#666] hover:text-[#111]'
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

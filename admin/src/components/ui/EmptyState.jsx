export function EmptyState({ icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-5 text-center">
      {icon && <div className="text-4xl mb-4">{icon}</div>}
      <p className="text-sm font-semibold text-[#666] mb-1">{title}</p>
      {description && <p className="text-xs text-[#aaa] mb-4">{description}</p>}
      {action}
    </div>
  )
}

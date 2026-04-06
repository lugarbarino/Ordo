export function clsx(...args) {
  return args.flat().filter(Boolean).join(' ')
}

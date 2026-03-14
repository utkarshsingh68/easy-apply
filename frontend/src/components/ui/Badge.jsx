import { cn } from '../../lib/utils'

const variants = {
  sent: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  success: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  failed: 'bg-red-500/15 text-red-400 border-red-500/20',
  error: 'bg-red-500/15 text-red-400 border-red-500/20',
  pending: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  warning: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  draft: 'bg-slate-500/15 text-slate-400 border-slate-500/20',
  default: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/20',
}

export function Badge({ children, variant = 'default', className }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border',
        variants[variant] || variants.default,
        className,
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70 shrink-0" />
      {children}
    </span>
  )
}

export function statusVariant(status) {
  const s = String(status || '').toLowerCase()
  const map = { sent: 'sent', failed: 'failed', error: 'error', pending: 'pending', draft: 'draft' }
  return map[s] || 'default'
}

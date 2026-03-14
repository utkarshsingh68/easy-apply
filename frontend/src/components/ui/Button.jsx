import { cn } from '../../lib/utils'

const variants = {
  primary:
    'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20',
  secondary:
    'bg-slate-700/80 hover:bg-slate-700 text-slate-200 border border-white/10',
  ghost:
    'bg-transparent hover:bg-white/[0.06] text-slate-400 hover:text-slate-200',
  danger:
    'bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/20',
  success:
    'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/20',
}

const sizes = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-5 py-2.5 text-base gap-2',
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className,
  loading = false,
  ...props
}) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-medium',
        'transition-all duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className,
      )}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && (
        <svg
          className="w-3.5 h-3.5 animate-spin shrink-0"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      {children}
    </button>
  )
}

import { motion } from 'framer-motion'
import { Building2, Send, Clock, MessageSquare } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { SkeletonCard } from './ui/SkeletonTable'

const cards = [
  {
    key: 'companies',
    label: 'Total Companies',
    icon: Building2,
    gradient: 'from-indigo-500/10 via-transparent to-transparent',
    iconBg: 'bg-indigo-500/20 text-indigo-400',
    ring: 'hover:border-indigo-500/25',
    glow: 'group-hover:shadow-[0_0_0_1px_rgba(99,102,241,0.2),0_8px_32px_rgba(99,102,241,0.08)]',
  },
  {
    key: 'sent',
    label: 'Emails Sent',
    icon: Send,
    gradient: 'from-emerald-500/10 via-transparent to-transparent',
    iconBg: 'bg-emerald-500/20 text-emerald-400',
    ring: 'hover:border-emerald-500/25',
    glow: 'group-hover:shadow-[0_0_0_1px_rgba(34,197,94,0.2),0_8px_32px_rgba(34,197,94,0.08)]',
  },
  {
    key: 'pending',
    label: 'Emails Pending',
    icon: Clock,
    gradient: 'from-amber-500/10 via-transparent to-transparent',
    iconBg: 'bg-amber-500/20 text-amber-400',
    ring: 'hover:border-amber-500/25',
    glow: 'group-hover:shadow-[0_0_0_1px_rgba(245,158,11,0.2),0_8px_32px_rgba(245,158,11,0.08)]',
  },
  {
    key: 'replies',
    label: 'Replies Received',
    icon: MessageSquare,
    gradient: 'from-purple-500/10 via-transparent to-transparent',
    iconBg: 'bg-purple-500/20 text-purple-400',
    ring: 'hover:border-purple-500/25',
    glow: 'group-hover:shadow-[0_0_0_1px_rgba(168,85,247,0.2),0_8px_32px_rgba(168,85,247,0.08)]',
    showRate: true,
  },
]

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
}

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] } },
}

export function DashboardCards() {
  const { analytics, companies, emailLogs, loading } = useApp()

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => <SkeletonCard key={c.key} />)}
      </div>
    )
  }

  const totals = analytics?.totals || {}
  const rates = analytics?.rates || {}

  const values = {
    companies: companies.length,
    sent: totals.sent ?? emailLogs.filter((l) => l.status === 'sent').length,
    pending: totals.pending ?? emailLogs.filter((l) => l.status === 'pending').length,
    replies: totals.replies ?? 0,
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-2 lg:grid-cols-4 gap-4"
    >
      {cards.map((cfg) => {
        const Icon = cfg.icon
        const value = values[cfg.key] ?? 0

        return (
          <motion.div
            key={cfg.key}
            variants={item}
            whileHover={{ y: -3, transition: { duration: 0.18 } }}
            className={[
              'group relative overflow-hidden rounded-xl p-5 cursor-default',
              'bg-[#111827] border border-white/[0.07]',
              'shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_4px_16px_rgba(0,0,0,0.35)]',
              'transition-all duration-200',
              cfg.ring,
              cfg.glow,
            ].join(' ')}
          >
            {/* Gradient polish */}
            <div
              className={`absolute inset-0 bg-gradient-to-br ${cfg.gradient} pointer-events-none`}
            />

            <div className="relative flex items-start justify-between gap-2">
              <div>
                <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
                  {cfg.label}
                </p>
                <p className="mt-2 text-3xl font-bold text-slate-100 tabular-nums leading-none">
                  {value.toLocaleString()}
                </p>
              </div>
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${cfg.iconBg}`}
              >
                <Icon className="w-4 h-4" />
              </div>
            </div>

            {cfg.showRate && rates.reply_rate_percent !== undefined && (
              <div className="relative mt-4 pt-3 border-t border-white/[0.05]">
                <div className="flex items-center gap-1.5">
                  <div className="flex-1 h-1 rounded-full bg-white/[0.07] overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                      style={{ width: `${Math.min(rates.reply_rate_percent, 100)}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-emerald-400 font-medium tabular-nums whitespace-nowrap">
                    {rates.reply_rate_percent}% rate
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        )
      })}
    </motion.div>
  )
}

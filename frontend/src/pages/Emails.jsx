import { motion } from 'framer-motion'
import { Navbar } from '../components/Navbar'
import { EmailLogsTable } from '../components/EmailLogsTable'
import { useApp } from '../context/AppContext'

export function Emails() {
  const { emailLogs, analytics } = useApp()
  const rates = analytics?.rates || {}

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
    >
      <Navbar
        title="Email Logs"
        subtitle={`${emailLogs.length} emails tracked`}
      />

      <div className="p-6 space-y-5 max-w-[1280px]">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-100">Email Logs</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Full history of outreach emails
              {rates.reply_rate_percent !== undefined && (
                <>
                  {' · '}Reply rate:{' '}
                  <span className="text-emerald-400 font-medium">
                    {rates.reply_rate_percent}%
                  </span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Stats row */}
        {analytics && (
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Total Sent', value: analytics.totals?.sent ?? 0, color: 'text-emerald-400' },
              { label: 'Failed', value: analytics.totals?.failed ?? 0, color: 'text-red-400' },
              { label: 'Pending', value: analytics.totals?.pending ?? 0, color: 'text-amber-400' },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-xl bg-[#111827] border border-white/[0.07] px-5 py-4"
              >
                <p className="text-[11px] text-slate-500 uppercase tracking-wide font-semibold">
                  {s.label}
                </p>
                <p className={`mt-1.5 text-2xl font-bold tabular-nums ${s.color}`}>
                  {s.value.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Table card */}
        <div className="rounded-2xl bg-[#111827] border border-white/[0.07] shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_4px_20px_rgba(0,0,0,0.35)] overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.06]">
            <h3 className="text-sm font-semibold text-slate-100">All Email Logs</h3>
          </div>
          <div className="p-5">
            <EmailLogsTable />
          </div>
        </div>
      </div>
    </motion.div>
  )
}

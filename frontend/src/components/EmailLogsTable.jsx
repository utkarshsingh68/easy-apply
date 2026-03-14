import { motion, AnimatePresence } from 'framer-motion'
import { Mail } from 'lucide-react'
import { Badge, statusVariant } from './ui/Badge'
import { SkeletonTable } from './ui/SkeletonTable'
import { useApp } from '../context/AppContext'
import { truncate, formatDate } from '../lib/utils'

export function EmailLogsTable({ maxRows }) {
  const { emailLogs, companies, loading } = useApp()

  const displayed = maxRows ? emailLogs.slice(0, maxRows) : emailLogs

  const getCompanyName = (log) =>
    log.companies?.company_name ||
    companies.find((c) => c.id === log.company_id)?.company_name ||
    truncate(log.company_id, 12)

  if (loading) return <SkeletonTable rows={4} cols={4} />

  if (!displayed.length) {
    return (
      <div className="flex flex-col items-center justify-center py-14 text-center">
        <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-white/[0.06] flex items-center justify-center mb-3">
          <Mail className="w-5 h-5 text-slate-600" />
        </div>
        <p className="text-sm text-slate-500 font-medium">No email logs yet</p>
        <p className="text-xs text-slate-600 mt-1">Emails will appear here after sending.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto -mx-1 px-1">
      <table className="w-full text-sm min-w-[480px]">
        <thead>
          <tr className="border-b border-white/[0.06]">
            {['Company', 'Subject', 'Status', 'Sent At'].map((h) => (
              <th
                key={h}
                className="text-left pb-3 px-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wider"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <AnimatePresence>
            {displayed.map((log, idx) => (
              <motion.tr
                key={log.id || idx}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0, transition: { delay: idx * 0.035 } }}
                className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors"
              >
                <td className="py-3.5 px-2 font-medium text-slate-200 text-[13px]">
                  {getCompanyName(log)}
                </td>
                <td className="py-3.5 px-2 text-slate-400 text-[13px]">
                  {truncate(log.email_subject || '—', 44)}
                </td>
                <td className="py-3.5 px-2">
                  <Badge variant={statusVariant(log.status)}>{log.status || 'unknown'}</Badge>
                </td>
                <td className="py-3.5 px-2 text-[12px] text-slate-500 font-mono">
                  {formatDate(log.sent_at)}
                </td>
              </motion.tr>
            ))}
          </AnimatePresence>
        </tbody>
      </table>
    </div>
  )
}

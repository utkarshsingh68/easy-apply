import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowRight, TrendingUp } from 'lucide-react'
import { Navbar } from '../components/Navbar'
import { DashboardCards } from '../components/DashboardCards'
import { CompaniesTable } from '../components/CompaniesTable'
import { EmailLogsTable } from '../components/EmailLogsTable'
import { useApp } from '../context/AppContext'

const pageVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.25 } },
}

function SectionCard({ title, badge, linkTo, linkLabel, children }) {
  return (
    <div className="rounded-2xl bg-[#111827] border border-white/[0.07] shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_4px_20px_rgba(0,0,0,0.35)] overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <h3 className="text-sm font-semibold text-slate-100">{title}</h3>
          {badge !== undefined && (
            <span className="px-2 py-0.5 rounded-full bg-white/[0.07] text-[11px] text-slate-400 font-medium">
              {badge}
            </span>
          )}
        </div>
        {linkTo && (
          <Link
            to={linkTo}
            className="flex items-center gap-1 text-[12px] text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            {linkLabel || 'View all'}
            <ArrowRight className="w-3 h-3" />
          </Link>
        )}
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

export function Dashboard() {
  const { companies, emailLogs } = useApp()

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate">
      <Navbar title="Dashboard" subtitle="AI Job Application Agent" />

      <div className="p-6 space-y-6 max-w-[1280px]">
        {/* Page heading */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-100">Overview</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Real-time campaign metrics and activity feed
            </p>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[12px] text-emerald-400 font-medium">Live</span>
          </div>
        </div>

        {/* Stats */}
        <DashboardCards />

        {/* Tables side by side */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          <SectionCard
            title="Companies"
            badge={companies.length}
            linkTo="/companies"
          >
            <CompaniesTable maxRows={5} />
          </SectionCard>

          <SectionCard
            title="Email Logs"
            badge={emailLogs.length}
            linkTo="/emails"
          >
            <EmailLogsTable maxRows={5} />
          </SectionCard>
        </div>
      </div>
    </motion.div>
  )
}

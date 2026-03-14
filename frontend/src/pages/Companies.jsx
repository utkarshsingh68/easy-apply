import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { Navbar } from '../components/Navbar'
import { CompaniesTable } from '../components/CompaniesTable'
import { Button } from '../components/ui/Button'
import { useApp } from '../context/AppContext'

export function Companies() {
  const { companies, refreshData, loading } = useApp()

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
    >
      <Navbar
        title="Companies"
        subtitle={`${companies.length} companies tracked`}
      />

      <div className="p-6 space-y-5 max-w-[1280px]">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-100">All Companies</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Manage outreach targets, HR emails, and email status
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/add-job">
              <Button size="sm">
                <Plus className="w-3.5 h-3.5" />
                Add Job
              </Button>
            </Link>
          </div>
        </div>

        {/* Table card */}
        <div className="rounded-2xl bg-[#111827] border border-white/[0.07] shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_4px_20px_rgba(0,0,0,0.35)] overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.06]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <h3 className="text-sm font-semibold text-slate-100">Companies List</h3>
                <span className="px-2 py-0.5 rounded-full bg-white/[0.07] text-[11px] text-slate-400 font-medium">
                  {companies.length}
                </span>
              </div>
            </div>
          </div>
          <div className="p-5">
            <CompaniesTable />
          </div>
        </div>
      </div>
    </motion.div>
  )
}

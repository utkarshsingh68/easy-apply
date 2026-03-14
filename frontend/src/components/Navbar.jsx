import { Bell, Search, RefreshCw } from 'lucide-react'
import { motion } from 'framer-motion'
import { useApp } from '../context/AppContext'

export function Navbar({ title, subtitle }) {
  const { refreshData, loading } = useApp()

  return (
    <header className="h-14 sticky top-0 z-20 flex items-center gap-4 px-6 border-b border-white/[0.06] bg-[#0f172a]/80 backdrop-blur-md">
      {/* Title */}
      <div className="flex-1 min-w-0">
        <h1 className="text-sm font-semibold text-slate-100 truncate">{title}</h1>
        {subtitle && (
          <p className="text-[11px] text-slate-500 mt-0.5 truncate">{subtitle}</p>
        )}
      </div>

      {/* Search */}
      <div className="relative hidden md:block">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600" />
        <input
          type="text"
          placeholder="Quick search…"
          className="w-44 pl-9 pr-3 py-1.5 text-xs rounded-lg bg-white/[0.05] border border-white/[0.09] text-slate-400 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/40 focus:bg-white/[0.07] transition-colors"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5">
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          onClick={refreshData}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/[0.07] transition-colors"
          title="Refresh data"
        >
          <RefreshCw className={['w-3.5 h-3.5', loading ? 'animate-spin' : ''].join(' ')} />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          className="relative w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/[0.07] transition-colors"
        >
          <Bell className="w-3.5 h-3.5" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-indigo-500" />
        </motion.button>

        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-[11px] font-bold text-white cursor-pointer hover:ring-2 hover:ring-indigo-500/40 transition-all">
          U
        </div>
      </div>
    </header>
  )
}

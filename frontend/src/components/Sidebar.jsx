import { NavLink, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  Building2,
  Mail,
  PlusCircle,
  Settings,
  Bot,
  Zap,
} from 'lucide-react'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/companies', label: 'Companies', icon: Building2, end: false },
  { to: '/emails', label: 'Emails Sent', icon: Mail, end: false },
  { to: '/add-job', label: 'Add Job', icon: PlusCircle, end: false },
  { to: '/settings', label: 'Settings', icon: Settings, end: false },
]

export function Sidebar() {
  return (
    <aside className="w-56 shrink-0 h-screen sticky top-0 flex flex-col bg-[#080e1a] border-r border-white/[0.06]">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-700 flex items-center justify-center shadow-lg shadow-indigo-500/30 shrink-0">
            <Bot className="w-4.5 h-4.5 text-white w-[18px] h-[18px]" />
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-bold text-white leading-none tracking-tight">
              AI Job Agent
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">Outreach Platform</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-600">
          Navigation
        </p>
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end}>
            {({ isActive }) => (
              <motion.div
                whileHover={{ x: 2 }}
                transition={{ duration: 0.12 }}
                className={[
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium',
                  'border transition-colors duration-150 cursor-pointer',
                  isActive
                    ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/25 shadow-[inset_0_1px_0_rgba(99,102,241,0.2)]'
                    : 'text-slate-500 hover:text-slate-200 hover:bg-white/[0.05] border-transparent',
                ].join(' ')}
              >
                <Icon
                  className={['w-4 h-4 shrink-0', isActive ? 'text-indigo-400' : ''].join(' ')}
                />
                <span className="flex-1">{label}</span>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                )}
              </motion.div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer status */}
      <div className="px-4 py-4 border-t border-white/[0.06]">
        <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3 flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-[11px] font-bold text-white shrink-0">
            U
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-medium text-slate-300 truncate">Agent Active</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-slow shrink-0" />
              <p className="text-[11px] text-slate-600 truncate">Connected</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}

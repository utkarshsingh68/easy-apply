import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link2, Building2, User, Mail, CheckCircle2, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Navbar } from '../components/Navbar'
import { Button } from '../components/ui/Button'
import { useApp } from '../context/AppContext'
import { api } from '../services/api'

const modes = [
  {
    value: 'url',
    label: 'Job URL',
    icon: Link2,
    desc: 'Paste a job posting URL — we auto-scrape the company, title, and description.',
    color: 'indigo',
  },
  {
    value: 'manual',
    label: 'Manual Entry',
    icon: Building2,
    desc: 'Enter the company name, job title, and recruiter email manually.',
    color: 'violet',
  },
]

function Field({ label, required, icon: Icon, children }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[12px] font-medium text-slate-400">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 pointer-events-none" />
        )}
        {children}
      </div>
    </div>
  )
}

const inputCls =
  'w-full py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.09] text-sm text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 focus:bg-white/[0.07] transition-colors'

export function AddJob() {
  const { showToast, refreshData } = useApp()
  const navigate = useNavigate()
  const [mode, setMode] = useState('url')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [form, setForm] = useState({ job_url: '', company_name: '', job_title: '', email: '' })

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setSuccess(false)
    try {
      const payload =
        mode === 'url'
          ? { job_url: form.job_url.trim() }
          : {
              company_name: form.company_name.trim(),
              job_title: form.job_title.trim() || 'Unknown Position',
              email: form.email.trim(),
            }

      if (mode === 'url' && !payload.job_url) {
        showToast('Please enter a job URL.', 'error')
        return
      }
      if (mode === 'manual' && !payload.company_name) {
        showToast('Please enter a company name.', 'error')
        return
      }

      await api.addJob(payload)
      showToast('Company added! It will appear in your dashboard.')
      setSuccess(true)
      setForm({ job_url: '', company_name: '', job_title: '', email: '' })
      refreshData()
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
    >
      <Navbar title="Add Job" subtitle="Add a new company or job posting" />

      <div className="p-6 max-w-xl mx-auto space-y-6">
        {/* Page heading */}
        <div>
          <h2 className="text-xl font-bold text-slate-100">Add New Job</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Scrape a URL or manually enter details to begin AI outreach.
          </p>
        </div>

        {/* Mode selector */}
        <div className="grid grid-cols-2 gap-3">
          {modes.map(({ value, label, icon: Icon, desc }) => {
            const active = mode === value
            return (
              <motion.button
                key={value}
                type="button"
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => { setMode(value); setSuccess(false) }}
                className={[
                  'flex items-start gap-3 p-4 rounded-xl border text-left transition-all duration-150',
                  active
                    ? 'border-indigo-500/35 bg-indigo-500/10 shadow-[0_0_0_1px_rgba(99,102,241,0.15)]'
                    : 'border-white/[0.07] bg-[#111827] hover:border-white/[0.14]',
                ].join(' ')}
              >
                <div
                  className={[
                    'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5',
                    active ? 'bg-indigo-500/25 text-indigo-400' : 'bg-white/[0.05] text-slate-500',
                  ].join(' ')}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <p
                    className={`text-sm font-semibold leading-snug ${active ? 'text-indigo-300' : 'text-slate-300'}`}
                  >
                    {label}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{desc}</p>
                </div>
              </motion.button>
            )
          })}
        </div>

        {/* Form */}
        <AnimatePresence mode="wait">
          <motion.form
            key={mode}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
            onSubmit={handleSubmit}
            className="rounded-2xl bg-[#111827] border border-white/[0.07] p-6 space-y-4 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_4px_20px_rgba(0,0,0,0.35)]"
          >
            {mode === 'url' ? (
              <Field label="Job URL" required icon={Link2}>
                <input
                  type="url"
                  value={form.job_url}
                  onChange={set('job_url')}
                  placeholder="https://careers.company.com/job/engineer"
                  required
                  className={`${inputCls} pl-10`}
                />
                <p className="mt-1.5 text-[11px] text-slate-600">
                  We'll scrape the job title, company name, and description automatically.
                </p>
              </Field>
            ) : (
              <>
                <Field label="Company Name" required icon={Building2}>
                  <input
                    type="text"
                    value={form.company_name}
                    onChange={set('company_name')}
                    placeholder="OpenAI"
                    required
                    className={`${inputCls} pl-10`}
                  />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Job Title" icon={User}>
                    <input
                      type="text"
                      value={form.job_title}
                      onChange={set('job_title')}
                      placeholder="Software Engineer"
                      className={`${inputCls} pl-10`}
                    />
                  </Field>
                  <Field label="Recruiter Email" icon={Mail}>
                    <input
                      type="email"
                      value={form.email}
                      onChange={set('email')}
                      placeholder="hr@company.com"
                      className={`${inputCls} pl-10`}
                    />
                  </Field>
                </div>
              </>
            )}

            <div className="pt-1 flex items-center gap-3">
              <Button type="submit" loading={loading} className="flex-1">
                {loading ? 'Adding…' : 'Add to Database'}
              </Button>
              <AnimatePresence>
                {success && (
                  <motion.button
                    type="button"
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    onClick={() => navigate('/companies')}
                    className="flex items-center gap-1.5 text-[12px] text-emerald-400 hover:text-emerald-300 whitespace-nowrap transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    View in Companies
                    <ArrowRight className="w-3.5 h-3.5" />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </motion.form>
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

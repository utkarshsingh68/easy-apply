import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Moon, Sun, RefreshCw, Cpu, Database, Mail, Sparkles, ExternalLink, Zap, Upload, FileText, CheckCircle } from 'lucide-react'
import { Navbar } from '../components/Navbar'
import { Button } from '../components/ui/Button'
import { useApp } from '../context/AppContext'
import { api } from '../services/api'

function Section({ title, children }) {
  return (
    <div className="rounded-2xl bg-[#111827] border border-white/[0.07] overflow-hidden shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_4px_20px_rgba(0,0,0,0.3)]">
      <div className="px-5 py-4 border-b border-white/[0.06]">
        <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
      </div>
      <div className="divide-y divide-white/[0.05]">{children}</div>
    </div>
  )
}

function Row({ label, desc, children }) {
  return (
    <div className="flex items-center justify-between gap-6 px-5 py-4">
      <div className="min-w-0">
        <p className="text-sm text-slate-200 font-medium">{label}</p>
        {desc && <p className="text-[12px] text-slate-500 mt-0.5 leading-snug">{desc}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

const stackItems = [
  { icon: Cpu, label: 'AI Backend', value: 'FastAPI + Groq / OpenAI' },
  { icon: Database, label: 'Database', value: 'Supabase (PostgreSQL)' },
  { icon: Mail, label: 'Email Provider', value: 'Gmail SMTP (TLS 587)' },
  { icon: Sparkles, label: 'Email Generation', value: 'LLM-powered personalization' },
  { icon: Zap, label: 'Frontend', value: 'React + Tailwind + Framer Motion' },
]

export function Settings() {
  const { showToast, refreshData, loading } = useApp()
  const [followupsLoading, setFollowupsLoading] = useState(false)
  const [darkMode, setDarkMode] = useState(true)
  const [ownerToken, setOwnerToken] = useState(localStorage.getItem('ajob_owner_token') || '')
  const [resumeFile, setResumeFile] = useState(null)
  const [resumeUploading, setResumeUploading] = useState(false)
  const [resumeUploaded, setResumeUploaded] = useState(false)
  const resumeInputRef = useRef(null)

  function toggleTheme() {
    const html = document.documentElement
    if (darkMode) {
      html.classList.remove('dark')
      setDarkMode(false)
      showToast('Switched to light mode')
    } else {
      html.classList.add('dark')
      setDarkMode(true)
      showToast('Switched to dark mode')
    }
  }

  async function handleRunFollowups() {
    setFollowupsLoading(true)
    try {
      const res = await api.runFollowups()
      showToast(`Follow-ups done · sent ${res.sent}, failed ${res.failed}, skipped ${res.skipped}`)
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setFollowupsLoading(false)
    }
  }

  function saveOwnerToken() {
    const value = ownerToken.trim()
    if (!value) {
      localStorage.removeItem('ajob_owner_token')
      showToast('Owner token cleared from this browser.')
      return
    }
    localStorage.setItem('ajob_owner_token', value)
    showToast('Owner token saved for this browser.')
  }

  async function handleResumeUpload() {
    if (!resumeFile) return
    setResumeUploading(true)
    setResumeUploaded(false)
    try {
      const formData = new FormData()
      formData.append('file', resumeFile)
      const token = localStorage.getItem('ajob_owner_token') || ''
      const headers = token ? { 'X-Admin-Token': token } : {}
      const res = await fetch('http://127.0.0.1:8000/upload-resume', {
        method: 'POST',
        headers,
        body: formData,
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Upload failed' }))
        throw new Error(err.detail || 'Upload failed')
      }
      setResumeUploaded(true)
      showToast(`Resume "${resumeFile.name}" uploaded successfully!`)
      setResumeFile(null)
      if (resumeInputRef.current) resumeInputRef.current.value = ''
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setResumeUploading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
    >
      <Navbar title="Settings" subtitle="Preferences and manual operations" />

      <div className="p-6 max-w-xl mx-auto space-y-5">
        {/* Heading */}
        <div>
          <h2 className="text-xl font-bold text-slate-100">Settings</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Configure appearance and run manual operations
          </p>
        </div>

        {/* Appearance */}
        <Section title="Appearance">
          <Row label="Theme" desc="Toggle between dark and light mode">
            <Button variant="secondary" size="sm" onClick={toggleTheme}>
              {darkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              {darkMode ? 'Light Mode' : 'Dark Mode'}
            </Button>
          </Row>
        </Section>

        {/* Automation */}
        <Section title="Automation">
          <Row
            label="Run Due Follow-ups"
            desc="Process all follow-up emails that are scheduled and due now"
          >
            <Button
              variant="primary"
              size="sm"
              loading={followupsLoading}
              onClick={handleRunFollowups}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Run Now
            </Button>
          </Row>
          <Row
            label="Refresh Dashboard Data"
            desc="Reload all companies, emails, and analytics from the API"
          >
            <Button variant="secondary" size="sm" loading={loading} onClick={refreshData}>
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </Button>
          </Row>
        </Section>

        {/* Security */}
        <Section title="Security">
          <div className="px-5 py-4 space-y-3">
            <p className="text-[12px] text-slate-500">
              In live mode, send actions require your owner token. It is stored only in this browser.
            </p>
            <input
              type="password"
              value={ownerToken}
              onChange={(e) => setOwnerToken(e.target.value)}
              placeholder="Enter owner token"
              className="w-full py-2.5 px-3 rounded-xl bg-white/[0.05] border border-white/[0.09] text-sm text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 focus:bg-white/[0.07] transition-colors"
            />
            <div className="flex items-center gap-2">
              <Button variant="primary" size="sm" onClick={saveOwnerToken}>Save Token</Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setOwnerToken('')
                  localStorage.removeItem('ajob_owner_token')
                  showToast('Owner token cleared from this browser.')
                }}
              >
                Clear
              </Button>
            </div>
          </div>
        </Section>

        {/* Resume */}
        <Section title="Resume">
          <div className="px-5 py-4 space-y-3">
            <p className="text-[12px] text-slate-500">
              Upload your resume PDF. It will be attached to all outgoing application emails.
            </p>
            <label
              className="flex items-center gap-3 w-full py-3 px-4 rounded-xl border border-dashed border-white/[0.12] bg-white/[0.03] hover:bg-white/[0.05] cursor-pointer transition-colors"
              onClick={() => resumeInputRef.current?.click()}
            >
              <FileText className="w-5 h-5 text-slate-500 shrink-0" />
              <span className="text-sm text-slate-400 truncate">
                {resumeFile ? resumeFile.name : 'Choose a PDF file…'}
              </span>
              <input
                ref={resumeInputRef}
                type="file"
                accept="application/pdf,.pdf"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0] || null
                  setResumeFile(f)
                  setResumeUploaded(false)
                }}
              />
            </label>
            <Button
              variant="primary"
              size="sm"
              loading={resumeUploading}
              disabled={!resumeFile || resumeUploading}
              onClick={handleResumeUpload}
            >
              {resumeUploaded
                ? <><CheckCircle className="w-3.5 h-3.5" /> Uploaded</>
                : <><Upload className="w-3.5 h-3.5" /> Upload Resume</>}
            </Button>
          </div>
        </Section>

        {/* Stack Info */}        <Section title="Stack Info">
          <div className="px-5 py-4 space-y-4">
            {stackItems.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-3.5">
                <div className="w-8 h-8 rounded-xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center text-slate-500 shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[11px] text-slate-600 uppercase tracking-wide">{label}</p>
                  <p className="text-[13px] text-slate-300 font-medium">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* API connection callout */}
        <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/[0.04] p-5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center shrink-0">
            <ExternalLink className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-200">Backend API</p>
            <p className="text-[12px] text-slate-500 mt-0.5">
              Dashboard connects to FastAPI at{' '}
              <code className="text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded text-[11px]">
                http://127.0.0.1:8000
              </code>
            </p>
            <p className="text-[11px] text-slate-600 mt-2">
              Make sure the backend is running before using the dashboard.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

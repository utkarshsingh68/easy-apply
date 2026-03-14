import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Send, Save, ExternalLink, Building2, Trash2 } from 'lucide-react'
import { Button } from './ui/Button'
import { Badge, statusVariant } from './ui/Badge'
import { Modal } from './ui/Modal'
import { SkeletonTable } from './ui/SkeletonTable'
import { useApp } from '../context/AppContext'
import { api } from '../services/api'
import { truncate } from '../lib/utils'

export function CompaniesTable({ maxRows }) {
  const { companies, emailLogs, loading, showToast, refreshData } = useApp()
  const [localEmails, setLocalEmails] = useState({})
  const [generatingId, setGeneratingId] = useState(null)
  const [sendingId, setSendingId] = useState(null)
  const [savingId, setSavingId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [modal, setModal] = useState(null)

  const displayed = maxRows ? companies.slice(0, maxRows) : companies

  const getEmail = (c) =>
    localEmails[c.id] !== undefined ? localEmails[c.id] : c.email || ''

  const getStatus = (companyId) => {
    const log = emailLogs.find((l) => l.company_id === companyId)
    return log?.status || 'none'
  }

  async function handleSaveEmail(company) {
    setSavingId(company.id)
    try {
      await api.updateHrEmail(company.id, getEmail(company))
      showToast('HR email saved.')
      refreshData()
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setSavingId(null)
    }
  }

  async function handleGenerate(company) {
    setGeneratingId(company.id)
    try {
      const res = await api.generateEmail(company.id, getEmail(company))
      setModal({ subject: res.subject, body: res.body })
      showToast('Email generated!')
      refreshData()
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setGeneratingId(null)
    }
  }

  async function handleSend(company) {
    setSendingId(company.id)
    try {
      const res = await api.sendEmail(company.id, getEmail(company))
      showToast(`Sent · status: ${res.status}`)
      refreshData()
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setSendingId(null)
    }
  }

  async function handleDelete(company) {
    const ok = window.confirm(
      `Delete ${company.company_name}? This will also remove related email logs.`,
    )
    if (!ok) return

    setDeletingId(company.id)
    try {
      await api.deleteCompany(company.id)
      showToast('Company removed.')
      refreshData()
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) return <SkeletonTable rows={5} cols={5} />

  if (!displayed.length) {
    return (
      <div className="flex flex-col items-center justify-center py-14 text-center">
        <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-white/[0.06] flex items-center justify-center mb-3">
          <Building2 className="w-5 h-5 text-slate-600" />
        </div>
        <p className="text-sm text-slate-500 font-medium">No companies yet</p>
        <p className="text-xs text-slate-600 mt-1">Add a job to begin outreach.</p>
      </div>
    )
  }

  return (
    <>
      <div className="overflow-x-auto -mx-1 px-1">
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="border-b border-white/[0.06]">
              {['Company', 'Role', 'HR Email', 'Status', 'Actions'].map((h) => (
                <th
                  key={h}
                  className="text-left pb-3 px-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {displayed.map((company, idx) => {
                const status = getStatus(company.id)
                const isGen = generatingId === company.id
                const isSend = sendingId === company.id
                const isSave = savingId === company.id
                const isDelete = deletingId === company.id

                return (
                  <motion.tr
                    key={company.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0, transition: { delay: idx * 0.035 } }}
                    className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors group"
                  >
                    {/* Company */}
                    <td className="py-3.5 px-2">
                      <p className="font-medium text-slate-200 leading-snug">
                        {truncate(company.company_name, 26)}
                      </p>
                      {company.job_url && (
                        <a
                          href={company.job_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 mt-0.5 text-[11px] text-slate-600 hover:text-indigo-400 transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" />
                          View posting
                        </a>
                      )}
                    </td>

                    {/* Role */}
                    <td className="py-3.5 px-2 text-slate-400 text-[13px]">
                      {truncate(company.job_title || 'Unknown', 22)}
                    </td>

                    {/* Email */}
                    <td className="py-3.5 px-2">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="email"
                          value={getEmail(company)}
                          onChange={(e) =>
                            setLocalEmails((p) => ({ ...p, [company.id]: e.target.value }))
                          }
                          placeholder="hr@company.com"
                          className="flex-1 min-w-0 w-36 px-2.5 py-1.5 text-[12px] rounded-lg bg-white/[0.05] border border-white/[0.09] text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/40 transition-colors"
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          loading={isSave}
                          onClick={() => handleSaveEmail(company)}
                          className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Save email"
                        >
                          <Save className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-2">
                      {status === 'none' ? (
                        <span className="text-[12px] text-slate-700">—</span>
                      ) : (
                        <Badge variant={statusVariant(status)}>{status}</Badge>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-2">
                      <div className="flex items-center gap-1.5">
                        <Button
                          size="sm"
                          variant="secondary"
                          loading={isGen}
                          onClick={() => handleGenerate(company)}
                        >
                          <Sparkles className="w-3 h-3" />
                          Generate
                        </Button>
                        <Button
                          size="sm"
                          variant="primary"
                          loading={isSend}
                          onClick={() => handleSend(company)}
                        >
                          <Send className="w-3 h-3" />
                          Send
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          loading={isDelete}
                          onClick={() => handleDelete(company)}
                          title="Remove company"
                        >
                          <Trash2 className="w-3 h-3" />
                          Delete
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                )
              })}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* Email Preview Modal */}
      <Modal isOpen={!!modal} onClose={() => setModal(null)} title="Generated Email Preview">
        {modal && (
          <div className="space-y-4">
            <div className="rounded-xl bg-white/[0.04] border border-white/[0.07] p-4">
              <p className="text-[11px] text-slate-500 mb-1.5 uppercase tracking-wide font-semibold">
                Subject
              </p>
              <p className="text-sm font-medium text-slate-200">{modal.subject}</p>
            </div>
            <div className="rounded-xl bg-white/[0.04] border border-white/[0.07] p-4">
              <p className="text-[11px] text-slate-500 mb-1.5 uppercase tracking-wide font-semibold">
                Body
              </p>
              <pre className="text-sm text-slate-300 whitespace-pre-wrap font-sans leading-relaxed">
                {modal.body}
              </pre>
            </div>
            <div className="flex gap-2 pt-1">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(
                    `Subject: ${modal.subject}\n\n${modal.body}`,
                  )
                }}
              >
                Copy to Clipboard
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setModal(null)}>
                Dismiss
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}

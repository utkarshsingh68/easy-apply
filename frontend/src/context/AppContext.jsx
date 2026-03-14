import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { api } from '../services/api'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [companies, setCompanies] = useState([])
  const [emailLogs, setEmailLogs] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [toasts, setToasts] = useState([])

  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now()
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500)
  }, [])

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const refreshData = useCallback(async () => {
    setLoading(true)
    try {
      const [dash, analyticsData] = await Promise.all([
        api.getDashboardData(),
        api.getAnalytics().catch(() => null),
      ])
      setCompanies(dash.companies || [])
      setEmailLogs(dash.email_logs || [])
      setAnalytics(analyticsData)
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  const refreshTemplates = useCallback(async () => {
    try {
      const data = await api.getTemplates()
      setTemplates(data.templates || [])
    } catch {
      // silently ignore
    }
  }, [])

  useEffect(() => {
    refreshData()
    refreshTemplates()
  }, [])

  return (
    <AppContext.Provider
      value={{
        companies,
        emailLogs,
        analytics,
        templates,
        loading,
        toasts,
        showToast,
        dismissToast,
        refreshData,
        refreshTemplates,
        setCompanies,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside AppProvider')
  return ctx
}

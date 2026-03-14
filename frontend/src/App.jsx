import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import { Sidebar } from './components/Sidebar'
import { ToastContainer } from './components/ui/Toast'
import { Dashboard } from './pages/Dashboard'
import { Companies } from './pages/Companies'
import { Emails } from './pages/Emails'
import { AddJob } from './pages/AddJob'
import { Settings } from './pages/Settings'

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <div className="flex min-h-screen bg-[#0f172a]">
          <Sidebar />
          <main className="flex-1 min-w-0 overflow-y-auto max-h-screen">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/companies" element={<Companies />} />
              <Route path="/emails" element={<Emails />} />
              <Route path="/add-job" element={<AddJob />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </main>
        </div>
        <ToastContainer />
      </AppProvider>
    </BrowserRouter>
  )
}

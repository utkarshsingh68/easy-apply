import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, XCircle, X } from 'lucide-react'
import { useApp } from '../../context/AppContext'

export function ToastContainer() {
  const { toasts, dismissToast } = useApp()

  return (
    <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={[
              'pointer-events-auto flex items-start gap-3',
              'min-w-[300px] max-w-[420px]',
              'px-4 py-3 rounded-xl border shadow-2xl',
              toast.type === 'error'
                ? 'bg-[#1a0d0d] border-red-500/30 text-red-300'
                : 'bg-[#0d1a14] border-emerald-500/30 text-emerald-300',
            ].join(' ')}
          >
            {toast.type === 'error' ? (
              <XCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-400" />
            ) : (
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-400" />
            )}
            <p className="text-sm flex-1 leading-snug">{toast.message}</p>
            <button
              onClick={() => dismissToast(toast.id)}
              className="shrink-0 opacity-50 hover:opacity-100 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

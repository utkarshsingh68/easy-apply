import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

export function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-2xl' }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    if (isOpen) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              key="modal"
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.2 }}
              className={`pointer-events-auto w-full ${maxWidth} max-h-[90vh] flex flex-col`}
            >
              <div
                className="rounded-2xl bg-[#111827] border border-white/[0.09] shadow-2xl overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.07] shrink-0">
                  <h3 className="text-sm font-semibold text-slate-100">{title}</h3>
                  <button
                    onClick={onClose}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/[0.07] transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {/* Body */}
                <div className="p-6 overflow-y-auto">{children}</div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}

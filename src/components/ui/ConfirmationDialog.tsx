import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, X } from 'lucide-react';

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

export default function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'info',
  isLoading
}: ConfirmationDialogProps) {
  const colors = {
    danger: 'bg-red-500 hover:bg-red-600 shadow-red-500/20',
    warning: 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/20',
    info: 'bg-blue-500 hover:bg-blue-600 shadow-blue-500/20'
  };

  const iconColors = {
    danger: 'text-red-500 bg-red-500/10 border-red-500/20',
    warning: 'text-orange-500 bg-orange-500/10 border-orange-500/20',
    info: 'text-blue-500 bg-blue-500/10 border-blue-500/20'
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-[#111] border border-white/10 w-full max-w-sm rounded-[2rem] overflow-hidden shadow-2xl relative text-white"
          >
            <div className="p-8 text-center">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-6 border ${iconColors[type]}`}>
                <AlertCircle size={24} />
              </div>

              <h3 className="text-xl font-black tracking-tighter uppercase italic mb-2">{title}</h3>
              <p className="text-white/40 font-medium text-xs leading-relaxed mb-8">{message}</p>

              <div className="flex flex-col gap-3">
                <button
                  onClick={onConfirm}
                  disabled={isLoading}
                  className={`w-full py-3.5 rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-lg ${colors[type]}`}
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    confirmText
                  )}
                </button>
                <button
                  onClick={onClose}
                  disabled={isLoading}
                  className="w-full py-3.5 bg-white/5 hover:bg-white/10 rounded-xl font-black uppercase tracking-widest text-[10px] text-white/40 hover:text-white transition-all disabled:opacity-50"
                >
                  {cancelText}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

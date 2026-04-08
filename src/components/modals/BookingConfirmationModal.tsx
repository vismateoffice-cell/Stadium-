import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Ticket, AlertCircle, CheckCircle2 } from 'lucide-react';

interface BookingConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  matchTitle: string;
  seatId: string;
  price: number;
  isLoading?: boolean;
}

export default function BookingConfirmationModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  matchTitle, 
  seatId, 
  price,
  isLoading 
}: BookingConfirmationModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-[#111] border border-white/10 w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl relative text-white"
          >
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 p-2 hover:bg-white/5 rounded-full transition-colors text-white/20 z-10"
            >
              <X size={20} />
            </button>

            <div className="p-8 sm:p-10 text-center">
              <div className="w-16 h-16 bg-orange-500/10 rounded-2xl flex items-center justify-center mx-auto mb-8 border border-orange-500/20">
                <Ticket size={32} className="text-orange-500" />
              </div>

              <h2 className="text-2xl font-black tracking-tighter uppercase italic mb-2">Confirm Booking</h2>
              <p className="text-white/40 font-bold uppercase tracking-widest text-[10px] mb-8">Review your selection before proceeding</p>

              <div className="bg-white/5 rounded-3xl p-6 mb-8 text-left space-y-4 border border-white/5">
                <div className="flex justify-between items-center">
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Match</p>
                  <p className="font-black text-sm uppercase italic text-right max-w-[200px] truncate">{matchTitle}</p>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Seat Number</p>
                  <p className="font-black text-xl text-orange-500 italic">{seatId}</p>
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-white/5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Total Price</p>
                  <p className="font-black text-xl italic">₹{price}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 text-left bg-blue-500/5 border border-blue-500/10 p-4 rounded-2xl mb-8">
                <AlertCircle size={16} className="text-blue-500 shrink-0 mt-0.5" />
                <p className="text-[10px] font-bold text-blue-500/80 leading-relaxed uppercase tracking-wider">
                  This is a digital-only pass. You will receive a QR code upon successful confirmation.
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={onConfirm}
                  disabled={isLoading}
                  className="w-full bg-orange-500 text-white py-4 rounded-2xl font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-orange-500/20"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 size={20} />
                      Confirm & Pay
                    </>
                  )}
                </button>
                <button
                  onClick={onClose}
                  disabled={isLoading}
                  className="w-full bg-white/5 text-white/40 py-4 rounded-2xl font-black uppercase tracking-[0.2em] hover:bg-white/10 hover:text-white transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

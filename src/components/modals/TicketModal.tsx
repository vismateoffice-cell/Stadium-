import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, Download, Share2, MapPin, Calendar, Clock } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface TicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: any;
}

export default function TicketModal({ isOpen, onClose, ticket }: TicketModalProps) {
  if (!ticket) return null;

  const qrData = JSON.stringify({
    id: ticket.id,
    seat: ticket.seatId,
    match: ticket.matchId,
    user: ticket.userId
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-2xl"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-white w-full max-w-md h-full sm:h-auto sm:rounded-[2.5rem] rounded-none overflow-y-auto shadow-2xl relative text-black"
          >
            <button 
              onClick={onClose}
              className="absolute top-6 pt-safe right-6 pr-safe p-2 hover:bg-black/5 rounded-full transition-colors text-black/20 z-10"
            >
              <X size={20} />
            </button>

            <div className="p-8 sm:p-10 pt-safe pb-safe text-center">
              <div className="w-16 h-16 bg-green-500/10 rounded-2xl flex items-center justify-center mx-auto mb-8 border border-green-500/20">
                <Check size={32} className="text-green-500" />
              </div>

              <h2 className="text-3xl font-black tracking-tighter uppercase italic mb-2">Payment Successful!</h2>
              <p className="text-black/40 font-bold uppercase tracking-widest text-xs mb-10">Your ticket has been confirmed</p>

              <div className="bg-black/5 rounded-3xl p-8 mb-10 text-left space-y-6 border border-black/5">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-black/30 mb-1">Match ID</p>
                    <p className="font-black text-sm uppercase italic">{ticket.matchId}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-widest text-black/30 mb-1">Seat</p>
                    <p className="font-black text-2xl text-orange-500 italic">{ticket.seatId}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-black/5 rounded-lg">
                      <Calendar size={14} className="text-black/40" />
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-black/30">Status</p>
                      <p className="text-xs font-black uppercase text-green-600">Confirmed</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-black/5 rounded-lg">
                      <Clock size={14} className="text-black/40" />
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-black/30">Price</p>
                      <p className="text-xs font-black uppercase">₹0 (Paid)</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 bg-black/5 rounded-lg">
                    <MapPin size={14} className="text-black/40" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-black/30">Venue</p>
                    <p className="text-xs font-black uppercase">VPW Stadium, Mumbai</p>
                  </div>
                </div>

                {/* QR Code Section */}
                <div className="pt-6 border-t border-black/5 flex flex-col items-center gap-4">
                  <div className="p-4 bg-white rounded-2xl shadow-inner border border-black/5">
                    <QRCodeSVG value={qrData} size={120} level="H" />
                  </div>
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-black/30">Scan at Gate Entry</p>
                </div>
              </div>

              <div className="space-y-4">
                <button
                  className="w-full bg-black text-white py-4 rounded-2xl font-bold uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-orange-500 transition-all"
                >
                  <Download size={20} />
                  Download Pass
                </button>
                <button
                  className="w-full bg-black/5 text-black py-4 rounded-2xl font-bold uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-black/10 transition-all"
                >
                  <Share2 size={20} />
                  Share Ticket
                </button>
              </div>

              <p className="mt-10 text-[9px] text-black/20 font-black uppercase tracking-[0.3em] leading-loose">
                This is a digital entry pass. <br />
                Valid only for the specified seat and match.
              </p>
            </div>

            {/* Perforated edge effect */}
            <div className="absolute bottom-0 left-0 right-0 h-4 flex justify-between px-4 overflow-hidden">
              {[...Array(20)].map((_, i) => (
                <div key={i} className="w-4 h-4 bg-black/95 rounded-full -mb-2" />
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

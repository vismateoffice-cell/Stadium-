import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, MapPin, Trophy, IndianRupee } from 'lucide-react';

interface MatchFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (matchData: any) => void;
  initialData?: any;
  isLoading?: boolean;
}

export default function MatchFormModal({ 
  isOpen, 
  onClose, 
  onSave, 
  initialData,
  isLoading 
}: MatchFormModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    type: 'T20',
    price: 0,
    venue: 'VPW Stadium, Mumbai',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        type: initialData.type || 'T20',
        price: initialData.price || 0,
        venue: initialData.venue || 'VPW Stadium, Mumbai',
        date: initialData.date?.seconds 
          ? new Date(initialData.date.seconds * 1000).toISOString().split('T')[0] 
          : new Date(initialData.date).toISOString().split('T')[0]
      });
    } else {
      setFormData({
        title: '',
        type: 'T20',
        price: 0,
        venue: 'VPW Stadium, Mumbai',
        date: new Date().toISOString().split('T')[0]
      });
    }
  }, [initialData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-[#111] border border-white/10 w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl relative text-white"
          >
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 p-2 hover:bg-white/5 rounded-full transition-colors text-white/20 z-10"
            >
              <X size={20} />
            </button>

            <form onSubmit={handleSubmit} className="p-8 sm:p-10">
              <h2 className="text-2xl font-black tracking-tighter uppercase italic mb-8">
                {initialData ? 'Edit Match' : 'Add New Match'}
              </h2>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Match Title (e.g. IND vs AUS)</label>
                  <div className="relative">
                    <Trophy className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={16} />
                    <input
                      required
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-sm font-medium focus:outline-none focus:border-orange-500/50 transition-all"
                      placeholder="IND vs AUS"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Match Type</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-medium focus:outline-none focus:border-orange-500/50 transition-all appearance-none"
                    >
                      <option value="T20">T20</option>
                      <option value="ODI">ODI</option>
                      <option value="Test">Test</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Price (₹)</label>
                    <div className="relative">
                      <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={16} />
                      <input
                        required
                        type="number"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-sm font-medium focus:outline-none focus:border-orange-500/50 transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Venue</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={16} />
                    <input
                      required
                      type="text"
                      value={formData.venue}
                      onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-sm font-medium focus:outline-none focus:border-orange-500/50 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={16} />
                    <input
                      required
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-sm font-medium focus:outline-none focus:border-orange-500/50 transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-10 flex gap-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-orange-500 text-white py-4 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-orange-600 transition-all disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    initialData ? 'Update Match' : 'Create Match'
                  )}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isLoading}
                  className="px-8 bg-white/5 text-white/40 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

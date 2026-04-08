import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Ticket, Settings, User, LogOut, Camera, Check, Save, CreditCard, ChevronRight, Calendar, MapPin } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { ticketService } from '../services/ticketService';
import TicketModal from './TicketModal';

interface UserDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UserDashboard({ isOpen, onClose }: UserDashboardProps) {
  const [activeTab, setActiveTab] = useState<'tickets' | 'settings'>('tickets');
  const [tickets, setTickets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);

  const { user, profile, updateUserSettings, logout } = useAuth();
  const [displayName, setDisplayName] = useState(profile?.displayName || '');
  const [photoURL, setPhotoURL] = useState(profile?.photoURL || '');

  useEffect(() => {
    if (user && isOpen) {
      loadTickets();
    }
  }, [user, isOpen]);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || '');
      setPhotoURL(profile.photoURL || '');
    }
  }, [profile]);

  const loadTickets = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const myTickets = await ticketService.getMyTickets(user.uid);
      setTickets(myTickets || []);
    } catch (error) {
      console.error('Failed to load tickets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateUserSettings({ displayName, photoURL });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
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
          className="bg-[#111] w-full max-w-5xl h-[80vh] sm:h-[80vh] h-full sm:rounded-[3rem] rounded-none overflow-hidden border border-white/10 shadow-2xl flex flex-col"
        >
          {/* Header */}
          <div className="p-8 pt-safe border-b border-white/5 flex justify-between items-center bg-white/5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10 overflow-hidden">
                {profile?.photoURL ? (
                  <img src={profile.photoURL} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <User size={24} className="text-gray-500" />
                )}
              </div>
              <div>
                <h2 className="text-2xl font-black tracking-tighter uppercase italic">{profile?.displayName || 'Fan Dashboard'}</h2>
                <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.3em]">{user?.email}</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-3 hover:bg-white/10 rounded-full transition-colors text-gray-400"
            >
              <X size={24} />
            </button>
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* Sidebar */}
            <div className="hidden md:block w-64 border-r border-white/5 p-6 pb-safe space-y-2">
              <button
                onClick={() => setActiveTab('tickets')}
                className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-bold uppercase tracking-widest text-xs transition-all ${activeTab === 'tickets' ? 'bg-orange-500 text-white' : 'text-gray-500 hover:bg-white/5'}`}
              >
                <Ticket size={18} />
                My Tickets
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-bold uppercase tracking-widest text-xs transition-all ${activeTab === 'settings' ? 'bg-orange-500 text-white' : 'text-gray-500 hover:bg-white/5'}`}
              >
                <Settings size={18} />
                Settings
              </button>
              <div className="pt-8 mt-auto">
                <button
                  onClick={() => { logout(); onClose(); }}
                  className="w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-bold uppercase tracking-widest text-xs text-red-500 hover:bg-red-500/10 transition-all"
                >
                  <LogOut size={18} />
                  Sign Out
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col overflow-hidden bg-black/20">
              <div className="flex-1 overflow-y-auto p-8 pb-safe">
                {activeTab === 'tickets' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center mb-8">
                      <h3 className="text-xl font-black uppercase italic tracking-tight text-orange-500">Your Digital Passes</h3>
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">{tickets.length} Tickets Found</span>
                    </div>

                    {isLoading ? (
                      <div className="flex flex-col items-center justify-center h-64">
                        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mb-4" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-600">Syncing with Stadium...</p>
                      </div>
                    ) : tickets.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {tickets.map((ticket) => (
                          <div key={ticket.id} className="bg-white rounded-3xl overflow-hidden shadow-xl text-black flex flex-col">
                            <div className="p-6 bg-black text-white flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                <Ticket size={16} className="text-orange-500" />
                                <span className="text-[10px] font-black uppercase tracking-widest">VPW Stadium Pass</span>
                              </div>
                              <span className="px-3 py-1 bg-green-500 text-white rounded-full text-[8px] font-black uppercase tracking-widest">Approved</span>
                            </div>
                            <div className="p-6 space-y-4">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="text-[9px] font-black uppercase tracking-widest text-black/30">Match</p>
                                  <p className="font-black text-sm uppercase italic">IND vs AUS · Final</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-[9px] font-black uppercase tracking-widest text-black/30">Seat</p>
                                  <p className="font-black text-xl text-orange-500 italic">{ticket.seatId}</p>
                                </div>
                              </div>
                              <div className="pt-4 border-t border-black/5 flex justify-between items-center">
                                <div className="text-[10px] font-bold text-black/40">
                                  ID: {ticket.id.slice(0, 8)}...
                                </div>
                                <button 
                                  onClick={() => setSelectedTicket(ticket)}
                                  className="text-[10px] font-black uppercase tracking-widest text-orange-500 hover:underline flex items-center gap-1"
                                >
                                  View Details
                                  <ChevronRight size={12} />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-64 text-center">
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-6">
                          <Ticket size={32} className="text-gray-700" />
                        </div>
                        <p className="text-gray-500 font-bold uppercase tracking-widest mb-2">No tickets found</p>
                        <p className="text-xs text-gray-600 max-w-xs">You haven't secured any seats yet. Head to the stadium floor to pick your spot!</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'settings' && (
                  <div className="max-w-2xl space-y-12">
                    <div className="space-y-8">
                      <h3 className="text-xl font-black uppercase italic tracking-tight text-orange-500">Profile Settings</h3>
                      
                      <form onSubmit={handleSaveSettings} className="space-y-8">
                        <div className="flex items-center gap-8">
                          <div className="relative group">
                            <div className="w-24 h-24 bg-white/5 rounded-3xl flex items-center justify-center border border-white/10 overflow-hidden">
                              {photoURL ? (
                                <img src={photoURL} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              ) : (
                                <User size={40} className="text-gray-500" />
                              )}
                            </div>
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-3xl cursor-pointer">
                              <Camera size={24} className="text-white" />
                            </div>
                          </div>
                          <div className="flex-1 space-y-4">
                            <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Display Name</label>
                              <input 
                                type="text" 
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-sm font-medium focus:outline-none focus:border-orange-500/50 transition-all" 
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Avatar URL</label>
                              <input 
                                type="text" 
                                value={photoURL}
                                onChange={(e) => setPhotoURL(e.target.value)}
                                placeholder="https://..."
                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-sm font-medium focus:outline-none focus:border-orange-500/50 transition-all" 
                              />
                            </div>
                          </div>
                        </div>

                        <div className="pt-8 border-t border-white/5">
                          <button
                            type="submit"
                            disabled={isSaving}
                            className="bg-white text-black px-8 py-3 rounded-2xl font-bold uppercase tracking-widest text-xs flex items-center gap-2 hover:bg-orange-500 hover:text-white transition-all disabled:opacity-50"
                          >
                            {isSaving ? (
                              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : saveSuccess ? (
                              <Check size={18} />
                            ) : (
                              <Save size={18} />
                            )}
                            {isSaving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save Changes'}
                          </button>
                        </div>
                      </form>
                    </div>

                    <div className="space-y-6">
                      <h3 className="text-xl font-black uppercase italic tracking-tight text-orange-500">Account Security</h3>
                      <div className="bg-white/5 border border-white/5 rounded-3xl p-8 space-y-6">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-bold uppercase tracking-widest text-sm mb-1">Email Address</p>
                            <p className="text-xs text-gray-500">{user?.email}</p>
                          </div>
                          <span className="px-3 py-1 bg-green-500/10 text-green-500 rounded-full text-[8px] font-black uppercase tracking-widest border border-green-500/20">Verified</span>
                        </div>
                        <div className="pt-6 border-t border-white/5 flex justify-between items-center">
                          <div>
                            <p className="font-bold uppercase tracking-widest text-sm mb-1">Payment Methods</p>
                            <p className="text-xs text-gray-500">No cards linked</p>
                          </div>
                          <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-orange-500 hover:underline">
                            <CreditCard size={14} />
                            Add Card
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>

      <TicketModal 
        isOpen={!!selectedTicket} 
        onClose={() => setSelectedTicket(null)} 
        ticket={selectedTicket} 
      />
    </AnimatePresence>
  );
}

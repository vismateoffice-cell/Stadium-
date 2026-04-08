import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Users, Ticket, Settings, ShieldCheck, Search, Trash2, 
  CheckCircle, AlertCircle, Plus, Ban, Calendar, MapPin, 
  Trash, RefreshCw, Lock, Unlock, Trophy, Radio
} from 'lucide-react';
import { adminService } from '../services/adminService';
import { ticketService } from '../services/ticketService';
import ConfirmationDialog from '../components/ui/ConfirmationDialog';
import MatchFormModal from '../components/modals/MatchFormModal';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  isAdmin: boolean;
  initialTab?: AdminTab;
}

type AdminTab = 'users' | 'tickets' | 'matches' | 'seats' | 'settings';

export default function AdminPanel({ isOpen, onClose, isAdmin, initialTab }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>(initialTab || 'users');
  const [searchQuery, setSearchQuery] = useState('');
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type: 'danger' | 'warning' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'info'
  });
  const [matchForm, setMatchForm] = useState<{
    isOpen: boolean;
    initialData?: any;
  }>({
    isOpen: false
  });

  useEffect(() => {
    if (isOpen && isAdmin) {
      loadData();
    }
  }, [isOpen, activeTab, isAdmin]);

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      let result: any[] = [];
      if (activeTab === 'users') {
        result = await adminService.getAllUsers() || [];
      } else if (activeTab === 'tickets') {
        result = await adminService.getAllTickets() || [];
      } else if (activeTab === 'matches') {
        result = await ticketService.getMatches() || [];
      } else if (activeTab === 'seats') {
        result = await adminService.getAllBlockedSeats() || [];
      }
      setData(result);
    } catch (error) {
      console.error('Failed to load admin data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddMatch = () => {
    setMatchForm({ isOpen: true });
  };

  const handleEditMatch = (match: any) => {
    setMatchForm({ isOpen: true, initialData: match });
  };

  const handleSaveMatch = async (formData: any) => {
    setIsLoading(true);
    try {
      const [teamA, teamB] = formData.title.split(' vs ');
      const matchData = {
        ...formData,
        date: new Date(formData.date).toISOString(),
        teams: { teamA: teamA || 'Team A', teamB: teamB || 'Team B' }
      };

      if (matchForm.initialData) {
        await adminService.updateMatch(matchForm.initialData.id, matchData);
      } else {
        await adminService.addMatch(matchData);
      }
      setMatchForm({ isOpen: false });
      loadData();
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteMatch = (matchId: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Match',
      message: 'Are you sure you want to delete this match? This action cannot be undone.',
      type: 'danger',
      onConfirm: async () => {
        setIsActionLoading(matchId);
        try {
          await adminService.deleteMatch(matchId);
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
          loadData();
        } finally {
          setIsActionLoading(null);
        }
      }
    });
  };

  const handleGenerateMockMatches = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Generate Matches',
      message: 'Generate 30 mock matches for testing?',
      type: 'info',
      onConfirm: async () => {
        setIsLoading(true);
        try {
          const teams = ['IND', 'AUS', 'ENG', 'PAK', 'NZ', 'SA', 'WI', 'SL', 'AFG', 'BAN'];
          for (let i = 0; i < 30; i++) {
            const t1 = teams[Math.floor(Math.random() * teams.length)];
            let t2 = teams[Math.floor(Math.random() * teams.length)];
            while (t1 === t2) t2 = teams[Math.floor(Math.random() * teams.length)];
            
            const date = new Date();
            date.setDate(date.getDate() + i + 1);
            
            await adminService.addMatch({
              title: `${t1} vs ${t2}`,
              type: ['T20', 'ODI', 'Test'][Math.floor(Math.random() * 3)],
              price: [0, 500, 1000, 2500][Math.floor(Math.random() * 4)],
              venue: 'VPW Stadium, Mumbai',
              date: date.toISOString(),
              teams: { teamA: t1, teamB: t2 }
            });
          }
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
          loadData();
        } finally {
          setIsLoading(false);
        }
      }
    });
  };

  const handleToggleLive = async (matchId: string, currentStatus: string) => {
    const isLive = currentStatus === 'live';
    setIsActionLoading(matchId);
    try {
      await adminService.toggleLiveMatch(matchId, !isLive);
      loadData();
    } finally {
      setIsActionLoading(null);
    }
  };

  const handleBlockUser = async (userId: string, isBlocked: boolean) => {
    setIsActionLoading(userId);
    try {
      await adminService.blockUser(userId, !isBlocked);
      loadData();
    } finally {
      setIsActionLoading(null);
    }
  };

  const handleCancelTicket = (ticketId: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Cancel Ticket',
      message: 'Are you sure you want to cancel this ticket?',
      type: 'danger',
      onConfirm: async () => {
        setIsActionLoading(ticketId);
        try {
          await adminService.cancelTicket(ticketId);
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
          loadData();
        } finally {
          setIsActionLoading(null);
        }
      }
    });
  };

  const handleBlockSeat = async (seatId: string) => {
    if (!seatId) return;
    setIsActionLoading(seatId);
    try {
      await adminService.blockSeat(seatId, true);
      loadData();
    } finally {
      setIsActionLoading(null);
    }
  };

  const handleUnblockSeat = async (seatId: string) => {
    setIsActionLoading(seatId);
    try {
      await adminService.blockSeat(seatId, false);
      loadData();
    } finally {
      setIsActionLoading(null);
    }
  };

  if (!isAdmin) return null;

  const filteredData = data.filter(item => {
    const search = searchQuery.toLowerCase();
    if (activeTab === 'users') return item.email?.toLowerCase().includes(search) || item.displayName?.toLowerCase().includes(search);
    if (activeTab === 'tickets') return item.id?.toLowerCase().includes(search) || item.seatId?.toLowerCase().includes(search);
    if (activeTab === 'matches') return item.title?.toLowerCase().includes(search);
    return true;
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
            className="bg-[#111] w-full max-w-6xl h-[85vh] sm:h-[85vh] h-full sm:rounded-[3rem] rounded-none overflow-hidden border border-white/10 shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="p-8 pt-safe border-b border-white/5 flex justify-between items-center bg-white/5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-500/10 rounded-2xl flex items-center justify-center border border-orange-500/20">
                  <ShieldCheck size={24} className="text-orange-500" />
                </div>
                <div>
                  <h2 className="text-2xl font-black tracking-tighter uppercase italic">Admin Command</h2>
                  <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.3em]">VPW Stadium Control Center</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button 
                  onClick={loadData}
                  className="p-3 hover:bg-white/10 rounded-full transition-colors text-gray-400"
                >
                  <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
                </button>
                <button 
                  onClick={onClose}
                  className="p-3 hover:bg-white/10 rounded-full transition-colors text-gray-400"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
              {/* Sidebar */}
              <div className="hidden md:block w-64 border-r border-white/5 p-6 pb-safe space-y-2">
                <button
                  onClick={() => setActiveTab('users')}
                  className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-bold uppercase tracking-widest text-xs transition-all ${activeTab === 'users' ? 'bg-orange-500 text-white' : 'text-gray-500 hover:bg-white/5'}`}
                >
                  <Users size={18} />
                  Users
                </button>
                <button
                  onClick={() => setActiveTab('tickets')}
                  className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-bold uppercase tracking-widest text-xs transition-all ${activeTab === 'tickets' ? 'bg-orange-500 text-white' : 'text-gray-500 hover:bg-white/5'}`}
                >
                  <Ticket size={18} />
                  Tickets
                </button>
                <button
                  onClick={() => setActiveTab('matches')}
                  className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-bold uppercase tracking-widest text-xs transition-all ${activeTab === 'matches' ? 'bg-orange-500 text-white' : 'text-gray-500 hover:bg-white/5'}`}
                >
                  <Calendar size={18} />
                  Matches
                </button>
                <button
                  onClick={() => setActiveTab('seats')}
                  className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-bold uppercase tracking-widest text-xs transition-all ${activeTab === 'seats' ? 'bg-orange-500 text-white' : 'text-gray-500 hover:bg-white/5'}`}
                >
                  <Lock size={18} />
                  Seats
                </button>
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-bold uppercase tracking-widest text-xs transition-all ${activeTab === 'settings' ? 'bg-orange-500 text-white' : 'text-gray-500 hover:bg-white/5'}`}
                >
                  <Settings size={18} />
                  Settings
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 flex flex-col overflow-hidden bg-black/20">
                <div className="p-8 border-b border-white/5 flex justify-between items-center gap-4">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={18} />
                    <input
                      type="text"
                      placeholder={`Search ${activeTab}...`}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-white/5 border border-white/5 rounded-2xl py-3 pl-12 pr-6 text-sm font-medium focus:outline-none focus:border-orange-500/50 transition-all"
                    />
                  </div>
                  <div className="flex gap-2">
                    {activeTab === 'matches' && (
                      <div className="flex gap-2">
                        <button 
                          onClick={handleAddMatch}
                          className="bg-orange-500 text-white px-6 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-orange-600 transition-all"
                        >
                          <Plus size={14} />
                          Add Match
                        </button>
                        <button 
                          onClick={handleGenerateMockMatches}
                          className="bg-white/5 border border-white/10 text-white px-6 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-white/10 transition-all"
                        >
                          <Trophy size={14} className="text-orange-500" />
                          Gen 30
                        </button>
                      </div>
                    )}
                    <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/5 flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Live Sync Active</span>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-8 pb-safe">
                  {isLoading ? (
                    <div className="space-y-4">
                      {[...Array(6)].map((_, i) => (
                        <div key={i} className="bg-white/5 border border-white/5 rounded-2xl p-6 flex justify-between items-center animate-pulse">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white/10 rounded-xl" />
                            <div className="space-y-2">
                              <div className="w-32 h-4 bg-white/10 rounded" />
                              <div className="w-48 h-3 bg-white/10 rounded" />
                            </div>
                          </div>
                          <div className="flex items-center gap-6">
                            <div className="w-16 h-8 bg-white/10 rounded-full" />
                            <div className="w-8 h-8 bg-white/10 rounded-full" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : filteredData.length > 0 ? (
                    <div className="space-y-4">
                      {activeTab === 'users' && filteredData.map((user, idx) => (
                        <div key={user.uid || `user-${idx}`} className="bg-white/5 border border-white/5 rounded-2xl p-6 flex justify-between items-center hover:bg-white/10 transition-all group">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center overflow-hidden border border-white/10">
                              {user.photoURL ? (
                                <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <span className="font-black text-lg italic text-gray-500">{user.displayName?.[0] || 'U'}</span>
                              )}
                            </div>
                            <div>
                              <p className="font-black uppercase italic tracking-tight">{user.displayName || 'Anonymous'}</p>
                              <p className="text-xs text-gray-500 font-medium">{user.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-6">
                            <div className="text-right">
                              <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Status</p>
                              <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${user.isBlocked ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-green-500/10 text-green-500 border-green-500/20'}`}>
                                {user.isBlocked ? 'Blocked' : 'Active'}
                              </span>
                            </div>
                            <button 
                              onClick={() => handleBlockUser(user.uid, user.isBlocked)}
                              disabled={isActionLoading === user.uid}
                              className={`p-2 transition-colors ${user.isBlocked ? 'text-green-500 hover:text-green-400' : 'text-gray-600 hover:text-red-500'}`}
                              title={user.isBlocked ? 'Unblock User' : 'Block User'}
                            >
                              {user.isBlocked ? <CheckCircle size={18} /> : <Ban size={18} />}
                            </button>
                          </div>
                        </div>
                      ))}

                      {activeTab === 'tickets' && filteredData.map((ticket, idx) => (
                        <div key={ticket.id || `ticket-${idx}`} className="bg-white/5 border border-white/5 rounded-2xl p-6 flex justify-between items-center hover:bg-white/10 transition-all group">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center font-black text-lg italic text-orange-500">T</div>
                            <div>
                              <p className="font-black uppercase italic tracking-tight">Ticket #{ticket.id.slice(0, 8)}</p>
                              <p className="text-xs text-gray-500 font-medium">Seat: {ticket.seatId} · Match: {ticket.matchId}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-6">
                            <div className="text-right">
                              <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Owner</p>
                              <p className="text-[10px] font-bold text-white">{ticket.userId.slice(0, 8)}...</p>
                            </div>
                            <button 
                              onClick={() => handleCancelTicket(ticket.id)}
                              disabled={isActionLoading === ticket.id}
                              className="p-2 text-gray-600 hover:text-red-500 transition-colors"
                              title="Cancel Ticket"
                            >
                              <Trash size={18} />
                            </button>
                          </div>
                        </div>
                      ))}

                      {activeTab === 'matches' && filteredData.map((match, idx) => (
                        <div key={match.id || `match-${idx}`} className="bg-white/5 border border-white/5 rounded-2xl p-6 flex justify-between items-center hover:bg-white/10 transition-all group">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center font-black text-lg italic text-blue-500">M</div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-[9px] font-black uppercase tracking-widest text-orange-500">{match.type || 'T20'}</span>
                                <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">₹{match.price || 0}</span>
                              </div>
                              <p className="font-black uppercase italic tracking-tight">{match.title}</p>
                              <p className="text-xs text-gray-500 font-medium">
                                {match.venue} · {
                                  match.date?.seconds 
                                    ? new Date(match.date.seconds * 1000).toLocaleDateString() 
                                    : new Date(match.date).toLocaleDateString()
                                }
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-6">
                            <div className="text-right">
                              <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Status</p>
                              <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                                match.status === 'live' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 
                                match.status === 'cancelled' ? 'bg-gray-500/10 text-gray-500 border-gray-500/20' : 
                                'bg-green-500/10 text-green-500 border-green-500/20'
                              }`}>
                                {match.status}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => handleEditMatch(match)}
                                disabled={isActionLoading === match.id}
                                className="p-2 text-gray-600 hover:text-orange-500 transition-colors"
                                title="Edit Match"
                              >
                                <Settings size={18} />
                              </button>
                              <button 
                                onClick={() => handleToggleLive(match.id, match.status)}
                                disabled={isActionLoading === match.id}
                                className={`p-2 transition-colors ${match.status === 'live' ? 'text-red-500 hover:text-red-400' : 'text-gray-600 hover:text-orange-500'}`}
                                title={match.status === 'live' ? 'End Live' : 'Go Live'}
                              >
                                <Radio size={18} className={match.status === 'live' ? 'animate-pulse' : ''} />
                              </button>
                              <button 
                                onClick={() => handleDeleteMatch(match.id)}
                                disabled={isActionLoading === match.id}
                                className="p-2 text-gray-600 hover:text-red-500 transition-colors" 
                                title="Delete Match"
                              >
                                <Trash size={18} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}

                      {activeTab === 'seats' && (
                        <div className="space-y-8">
                          <div className="bg-orange-500/5 border border-orange-500/10 rounded-2xl p-8">
                            <h4 className="text-sm font-black uppercase tracking-widest text-orange-500 mb-6">Block New Seat</h4>
                            <div className="flex gap-4">
                              <input 
                                id="seat-input"
                                type="text" 
                                placeholder="Enter Seat ID (e.g. north-A1)" 
                                className="flex-1 bg-white/5 border border-white/10 rounded-xl py-3 px-6 text-sm font-medium focus:outline-none focus:border-orange-500/50"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleBlockSeat((e.target as HTMLInputElement).value);
                                    (e.target as HTMLInputElement).value = '';
                                  }
                                }}
                              />
                              <button 
                                onClick={() => {
                                  const input = document.getElementById('seat-input') as HTMLInputElement;
                                  handleBlockSeat(input.value);
                                  input.value = '';
                                }}
                                className="bg-white text-black px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-orange-500 hover:text-white transition-all"
                              >
                                Block Seat
                              </button>
                            </div>
                            <p className="text-[10px] text-gray-500 mt-4 font-medium uppercase tracking-widest">Type seat ID and press enter to block from booking</p>
                          </div>

                          <div className="space-y-4">
                            <h4 className="text-sm font-black uppercase tracking-widest text-white mb-4">Currently Blocked Seats</h4>
                            {filteredData.length > 0 ? (
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredData.map((seat, idx) => (
                                  <div key={seat.id || `seat-${idx}`} className="bg-white/5 border border-white/5 rounded-2xl p-4 flex justify-between items-center hover:bg-white/10 transition-all">
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 bg-red-500/10 rounded-lg flex items-center justify-center text-red-500">
                                        <Ban size={14} />
                                      </div>
                                      <span className="text-xs font-black uppercase tracking-widest text-white">{seat.seatId}</span>
                                    </div>
                                    <button 
                                      onClick={() => handleUnblockSeat(seat.seatId)}
                                      disabled={isActionLoading === seat.seatId}
                                      className="p-2 text-gray-600 hover:text-green-500 transition-colors"
                                      title="Unblock Seat"
                                    >
                                      <Unlock size={16} />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center py-12 bg-white/5 rounded-2xl border border-dashed border-white/10">
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-600">No seats are currently blocked</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-64 text-center">
                      <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-6">
                        <Search size={32} className="text-gray-700" />
                      </div>
                      <p className="text-gray-500 font-bold uppercase tracking-widest mb-2">No results found</p>
                      <p className="text-xs text-gray-600 max-w-xs mb-6">Try adjusting your search or filter to find what you're looking for.</p>
                      {activeTab === 'matches' && (
                        <button 
                          onClick={handleAddMatch}
                          className="bg-orange-500 text-white px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-orange-600 transition-all"
                        >
                          <Plus size={14} />
                          Create First Match
                        </button>
                      )}
                    </div>
                  )}

                  {activeTab === 'settings' && (
                    <div className="max-w-2xl space-y-8">
                      <div className="space-y-4">
                        <h3 className="text-lg font-black uppercase italic tracking-tight text-orange-500">Stadium Configuration</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Max Capacity</label>
                            <input type="number" defaultValue={50000} className="w-full bg-white/5 border border-white/5 rounded-xl py-3 px-4 text-sm font-medium focus:outline-none focus:border-orange-500/50" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Ticket Limit / User</label>
                            <input type="number" defaultValue={1} className="w-full bg-white/5 border border-white/5 rounded-xl py-3 px-4 text-sm font-medium focus:outline-none focus:border-orange-500/50" />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h3 className="text-lg font-black uppercase italic tracking-tight text-orange-500">System Status</h3>
                        <div className="bg-orange-500/5 border border-orange-500/10 rounded-2xl p-6 flex items-center gap-4">
                          <AlertCircle className="text-orange-500" size={24} />
                          <div>
                            <p className="font-bold text-sm text-orange-500 uppercase tracking-widest">Maintenance Mode</p>
                            <p className="text-xs text-gray-500 font-medium">When active, only admins can access the stadium experience.</p>
                          </div>
                          <button className="ml-auto px-6 py-2 bg-orange-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest">Enable</button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      <ConfirmationDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        type={confirmDialog.type}
        isLoading={isLoading || !!isActionLoading}
      />

      <MatchFormModal
        isOpen={matchForm.isOpen}
        onClose={() => setMatchForm({ isOpen: false })}
        onSave={handleSaveMatch}
        initialData={matchForm.initialData}
        isLoading={isLoading}
      />
    </AnimatePresence>
  );
}

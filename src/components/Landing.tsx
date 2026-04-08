import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Ticket, Users, MapPin, Calendar, ChevronRight, Search, Filter, ArrowUpDown, Shield, Radio, Settings, Plus } from 'lucide-react';
import { ticketService } from '../services/ticketService';
import { adminService } from '../services/adminService';
import { Match } from '../types';

interface LandingProps {
  onEnter: (match?: Match) => void;
  isEntered: boolean;
  isAdmin?: boolean;
  onOpenAdmin?: (tab?: 'users' | 'tickets' | 'matches' | 'seats' | 'settings') => void;
}

export default function Landing({ onEnter, isEntered, isAdmin, onOpenAdmin }: LandingProps) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'price' | 'title'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    // Real-time subscription for matches
    const unsubscribe = ticketService.subscribeToMatches(async (data) => {
      setMatches(data as Match[]);
      setIsLoading(false);

      // Auto-seed 30 matches if database is empty after a short delay to be sure
      if (data && data.length === 0) {
        console.log('No matches found. Seeding 30 mock matches...');
        try {
          await adminService.generateMockMatches(30);
        } catch (error) {
          console.error('Failed to seed matches:', error);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const filteredMatches = matches
    .filter(m => 
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.venue.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'date') {
        const dateA = a.date?.seconds || new Date(a.date).getTime();
        const dateB = b.date?.seconds || new Date(b.date).getTime();
        comparison = dateA - dateB;
      } else if (sortBy === 'price') {
        comparison = (a.price || 0) - (b.price || 0);
      } else {
        comparison = a.title.localeCompare(b.title);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  if (isEntered) return null;

  return (
    <div className="relative z-10 min-h-screen bg-black text-white overflow-x-hidden">
      {/* Hero Section */}
      <div className="relative min-h-screen flex flex-col items-center justify-center px-4 overflow-hidden">
        {/* Dynamic Background Images */}
        <div className="absolute inset-0 z-0">
          <motion.div 
            animate={{ 
              scale: [1, 1.1, 1],
              rotate: [0, 1, 0]
            }}
            transition={{ 
              duration: 20, 
              repeat: Infinity, 
              ease: "linear" 
            }}
            className="absolute inset-0 opacity-40"
          >
            <img 
              src="https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&q=80&w=1920" 
              alt="Stadium Background" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black via-black/40 to-black" />
          </motion.div>
        </div>

        {/* Animated Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-30 z-1">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-500 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500 rounded-full blur-[120px] animate-pulse delay-700" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="text-center max-w-4xl relative z-10"
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center justify-center gap-3 mb-8 text-orange-500"
          >
            <Trophy size={40} className="drop-shadow-[0_0_15px_rgba(249,115,22,0.5)]" />
            <span className="text-sm sm:text-base font-black tracking-[0.4em] uppercase italic">ICC World Cup 2026</span>
          </motion.div>

          <h1 className="text-6xl sm:text-8xl md:text-9xl font-black tracking-tighter mb-8 uppercase italic leading-[0.85]">
            VPW <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-orange-300">Stadium</span>
          </h1>

          <p className="text-lg sm:text-2xl font-medium text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed">
            Experience the future of cricket in a cinematic, 3D-immersive arena. 
            Secure your spot in history.
          </p>

          <div className="flex flex-wrap justify-center gap-4 sm:gap-8 mb-16">
            <div className="flex items-center gap-3 px-6 py-3 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md">
              <MapPin size={20} className="text-orange-500" />
              <span className="text-xs sm:text-sm font-black uppercase tracking-widest">Mumbai, India</span>
            </div>
            <div className="flex items-center gap-3 px-6 py-3 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md">
              <Users size={20} className="text-orange-500" />
              <span className="text-xs sm:text-sm font-black uppercase tracking-widest">50K+ Capacity</span>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(249,115,22,0.4)" }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                const element = document.getElementById('matches-section');
                element?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="bg-orange-500 text-white px-12 sm:px-16 py-5 rounded-full font-black text-lg sm:text-xl tracking-widest uppercase italic shadow-2xl transition-all"
            >
              Book Tickets
            </motion.button>

            {isAdmin && (
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(255,255,255,0.1)" }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onOpenAdmin?.('matches')}
                className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-12 sm:px-16 py-5 rounded-full font-black text-lg sm:text-xl tracking-widest uppercase italic transition-all flex items-center gap-3"
              >
                <Shield size={20} />
                Admin Panel
              </motion.button>
            )}
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-12 animate-bounce"
        >
          <ChevronRight size={32} className="rotate-90 text-gray-600" />
        </motion.div>
      </div>

      {/* Experience Section */}
      <div className="py-32 px-4 sm:px-8 bg-white/[0.02] border-y border-white/5 relative overflow-hidden">
        {/* Decorative Background Image */}
        <div className="absolute top-0 right-0 w-1/2 h-full opacity-5 pointer-events-none">
          <img 
            src="https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&q=80&w=1000" 
            alt="" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-8"
            >
              <h2 className="text-4xl sm:text-6xl font-black uppercase italic tracking-tighter leading-none">
                The Most <br />
                <span className="text-orange-500 text-5xl sm:text-7xl">Immersive</span> <br />
                Arena Ever Built
              </h2>
              <p className="text-gray-400 text-lg leading-relaxed max-w-xl">
                VPW Stadium isn't just a venue; it's a technological marvel. With 360-degree views, 
                spatial audio, and a cinematic atmosphere, you'll feel every boundary and hear every cheer 
                as if you were on the pitch.
              </p>
              <div className="grid grid-cols-2 gap-6">
                <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
                  <p className="text-3xl font-black text-orange-500 mb-1">4K</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Visual Fidelity</p>
                </div>
                <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
                  <p className="text-3xl font-black text-orange-500 mb-1">360°</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Viewing Angles</p>
                </div>
              </div>
            </motion.div>

            <div className="grid grid-cols-2 gap-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="space-y-4"
              >
                <div className="rounded-[2rem] overflow-hidden aspect-[3/4] relative group">
                  <img 
                    src="https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=800" 
                    alt="Stadium Detail" 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                </div>
                <div className="rounded-[2rem] overflow-hidden aspect-square relative group">
                  <img 
                    src="https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&q=80&w=800" 
                    alt="Stadium Crowd" 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="space-y-4 pt-12"
              >
                <div className="rounded-[2rem] overflow-hidden aspect-square relative group">
                  <img 
                    src="https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&q=80&w=800" 
                    alt="Stadium Night" 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                </div>
                <div className="rounded-[2rem] overflow-hidden aspect-[3/4] relative group">
                  <img 
                    src="https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&q=80&w=800" 
                    alt="Stadium Lights" 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Atmosphere Section */}
      <div className="relative h-[60vh] overflow-hidden">
        <motion.div 
          style={{ y: '-20%' }}
          whileInView={{ y: '0%' }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="absolute inset-0"
        >
          <img 
            src="https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&q=80&w=1920" 
            alt="Stadium Atmosphere" 
            className="w-full h-[140%] object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black" />
        </motion.div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-5xl sm:text-7xl font-black uppercase italic tracking-tighter text-white drop-shadow-2xl">
              Feel The <span className="text-orange-500">Energy</span>
            </h2>
            <p className="text-xs sm:text-sm font-black uppercase tracking-[0.4em] text-white/60 mt-4">Live from VPW Stadium</p>
          </div>
        </div>
      </div>

      {/* Matches Section */}
      <div id="matches-section" className="py-32 px-4 sm:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-16">
          <div>
            <h2 className="text-4xl sm:text-6xl font-black uppercase italic tracking-tighter mb-4">Upcoming <span className="text-orange-500">Matches</span></h2>
            <p className="text-gray-500 font-bold uppercase tracking-widest text-xs sm:text-sm">Select a match to enter the 3D stadium and pick your seat</p>
          </div>

          <div className="flex flex-wrap gap-4 w-full md:w-auto">
            {isAdmin && (
              <button 
                onClick={() => onOpenAdmin?.('matches')}
                className="bg-orange-500 text-white px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20"
              >
                <Plus size={18} />
                Add Match
              </button>
            )}
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={18} />
              <input 
                type="text" 
                placeholder="Search matches..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-sm font-medium focus:outline-none focus:border-orange-500/50 transition-all"
              />
            </div>
            
            <button 
              onClick={() => {
                setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
              }}
              className="p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all text-orange-500"
              title="Toggle Sort Order"
            >
              <ArrowUpDown size={20} />
            </button>

            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-black uppercase tracking-widest focus:outline-none focus:border-orange-500/50 transition-all appearance-none cursor-pointer"
            >
              <option value="date">Sort by Date</option>
              <option value="price">Sort by Price</option>
              <option value="title">Sort by Teams</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-[#111] border border-white/5 rounded-[2.5rem] p-8 space-y-8">
                <div className="flex justify-between items-start">
                  <div className="w-24 h-6 bg-white/5 rounded-full animate-pulse" />
                  <div className="w-16 h-10 bg-white/5 rounded-xl animate-pulse" />
                </div>
                <div className="space-y-3">
                  <div className="w-3/4 h-8 bg-white/5 rounded-lg animate-pulse" />
                  <div className="w-1/2 h-8 bg-white/5 rounded-lg animate-pulse" />
                </div>
                <div className="space-y-4">
                  <div className="w-full h-4 bg-white/5 rounded-md animate-pulse" />
                  <div className="w-full h-4 bg-white/5 rounded-md animate-pulse" />
                </div>
                <div className="w-full h-14 bg-white/5 rounded-2xl animate-pulse" />
              </div>
            ))}
          </div>
        ) : filteredMatches.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredMatches.map((match, index) => (
              <motion.div
                key={match.id || `match-${index}`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="group relative bg-[#111] border border-white/5 rounded-[2.5rem] overflow-hidden hover:border-orange-500/30 transition-all hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
              >
                <div className="p-8">
                  <div className="flex justify-between items-start mb-8">
                    <div className="flex flex-col gap-2">
                      <div className="px-4 py-1.5 bg-orange-500/10 border border-orange-500/20 rounded-full w-fit">
                        <span className="text-[10px] font-black uppercase tracking-widest text-orange-500">{match.type || 'T20 Match'}</span>
                      </div>
                      {match.status === 'live' && (
                        <div className="px-4 py-1.5 bg-red-500/10 border border-red-500/20 rounded-full w-fit flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-red-500">Live Now</span>
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Price From</p>
                      <p className="text-xl font-black text-white italic">₹{match.price || 0}</p>
                    </div>
                  </div>

                  <div className="space-y-2 mb-8">
                    <h3 className="text-2xl font-black uppercase italic tracking-tighter leading-none group-hover:text-orange-500 transition-colors">
                      {match.teams?.teamA || 'Team A'} <br />
                      <span className="text-gray-600 text-lg">vs</span> <br />
                      {match.teams?.teamB || 'Team B'}
                    </h3>
                  </div>

                  <div className="space-y-4 mb-10">
                    <div className="flex items-center gap-3 text-gray-400">
                      <Calendar size={16} className="text-orange-500" />
                      <span className="text-xs font-bold uppercase tracking-widest">
                        {match.date?.seconds 
                          ? new Date(match.date.seconds * 1000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                          : new Date(match.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                        }
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-400">
                      <MapPin size={16} className="text-orange-500" />
                      <span className="text-xs font-bold uppercase tracking-widest truncate">{match.venue}</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => isAdmin ? onOpenAdmin?.('matches') : onEnter(match)}
                    className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2 ${
                      isAdmin 
                        ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20 hover:bg-orange-500 hover:text-white' 
                        : 'bg-white text-black group-hover:bg-orange-500 group-hover:text-white'
                    }`}
                  >
                    {isAdmin ? (
                      <>
                        <Settings size={16} />
                        Edit Match
                      </>
                    ) : (
                      <>
                        Enter Stadium
                        <ChevronRight size={16} />
                      </>
                    )}
                  </button>
                </div>
                
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 blur-3xl rounded-full pointer-events-none group-hover:bg-orange-500/10 transition-all" />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-32 bg-white/5 rounded-[3rem] border border-dashed border-white/10">
            <Search size={48} className="mx-auto text-gray-700 mb-6" />
            <h3 className="text-xl font-black uppercase tracking-widest mb-2">No Matches Found</h3>
            <p className="text-gray-500 text-sm">Try adjusting your search or filters to find upcoming events.</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="py-20 px-8 border-t border-white/5 bg-black/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12">
          <div className="text-center md:text-left">
            <h2 className="text-3xl font-black italic tracking-tighter uppercase mb-2">🏏 VPW Stadium</h2>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-600">The Official Virtual Venue Partner</p>
          </div>

          <div className="flex gap-12 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
            <div className="flex flex-col gap-4">
              <span className="text-white">Quick Links</span>
              <a href="#" className="hover:text-orange-500 transition-colors">About Stadium</a>
              <a href="#" className="hover:text-orange-500 transition-colors">Match Schedule</a>
              <a href="#" className="hover:text-orange-500 transition-colors">Support Center</a>
            </div>
            <div className="flex flex-col gap-4">
              <span className="text-white">Legal</span>
              <a href="#" className="hover:text-orange-500 transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-orange-500 transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-orange-500 transition-colors">Refund Policy</a>
            </div>
          </div>

          <div className="text-center md:text-right">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-700 mb-4">© 2026 VPW Cricket Stadium. All Rights Reserved.</p>
            <div className="flex justify-center md:justify-end gap-4">
              <div className="w-8 h-8 bg-white/5 rounded-lg border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all cursor-pointer">
                <Trophy size={14} className="text-gray-500" />
              </div>
              <div className="w-8 h-8 bg-white/5 rounded-lg border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all cursor-pointer">
                <Ticket size={14} className="text-gray-500" />
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

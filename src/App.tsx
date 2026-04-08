import { useState, lazy, Suspense } from 'react';
import Stadium from './components/Stadium';
import Landing from './components/Landing';
import SeatSelector from './components/SeatSelector';
import { useAuth } from './hooks/useAuth';
import { LogOut, Shield, Ticket as TicketIcon, User as UserIcon, LayoutDashboard } from 'lucide-react';
import { ticketService } from './services/ticketService';

// Lazy load modals
const AuthModal = lazy(() => import('./components/AuthModal'));
const TicketModal = lazy(() => import('./components/TicketModal'));
const AdminPanel = lazy(() => import('./components/AdminPanel'));
const UserDashboard = lazy(() => import('./components/UserDashboard'));

export default function App() {
  const [isEntered, setIsEntered] = useState(false);
  const [selectedSeat, setSelectedSeat] = useState<string | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [adminTab, setAdminTab] = useState<'users' | 'tickets' | 'matches' | 'seats' | 'settings'>('users');
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [currentTicket, setCurrentTicket] = useState<any>(null);

  const { user, profile, logout, isAdmin, loading } = useAuth();

  const handleEnter = (match?: any) => {
    if (match) setSelectedMatch(match);
    setIsEntered(true);
  };

  const handleSeatSelect = async (seatId: string) => {
    setSelectedSeat(seatId);
    if (!user) {
      setIsAuthModalOpen(true);
    } else if (isAdmin) {
      alert('Admins are not allowed to book tickets. Please use the Admin Panel to manage matches.');
      return;
    } else if (profile?.isBlocked) {
      alert('Your account has been blocked. Please contact support.');
    } else if (profile && !profile.isVerified && profile.role !== 'admin') {
      alert('Please verify your email to book tickets.');
      setIsAuthModalOpen(true);
    } else {
      // Direct "0 rupee" payment flow
      const confirmBooking = confirm(`Confirm booking for ${selectedMatch?.title || 'Match'} at seat ${seatId}? (Price: ₹0)`);
      if (confirmBooking) {
        try {
          const matchId = selectedMatch?.id || 'FINAL-2026';
          const ticketId = await ticketService.confirmTicket(seatId, user.uid, matchId);
          const newTicket = {
            id: ticketId,
            seatId: seatId,
            matchId: matchId,
            status: 'approved'
          };
          setCurrentTicket(newTicket);
          setIsTicketModalOpen(true);
          
          // Simulate email notification
          console.log(`[MOCK EMAIL] Payment Successful! Ticket for ${matchId} at seat ${seatId} is confirmed. Here is your ticket ID: ${ticketId}`);
          alert(`Payment Successful! Your ticket for ${selectedMatch?.title || 'the match'} has been confirmed. A confirmation email has been sent to ${user.email}.`);
        } catch (error) {
          console.error('Failed to book ticket:', error);
        }
      }
    }
  };

  const handleLoginSuccess = async () => {
    setIsAuthModalOpen(false);
    if (selectedSeat && user) {
      handleSeatSelect(selectedSeat);
    }
  };

  const handleOpenAdmin = (tab?: 'users' | 'tickets' | 'matches' | 'seats' | 'settings') => {
    if (tab) setAdminTab(tab);
    setIsAdminPanelOpen(true);
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-orange-500 selection:text-white">
      {/* 3D Stadium Background */}
      <Stadium isEntered={isEntered} />

      {/* HUD / Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-40 p-4 sm:p-6 pt-safe flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent backdrop-blur-sm">
        <div className="flex items-center gap-2 sm:gap-6">
          <button 
            onClick={() => setIsEntered(false)}
            className="text-base sm:text-2xl font-black italic tracking-tighter uppercase hover:text-orange-500 transition-colors flex items-center gap-2"
          >
            <span className="text-orange-500">🏏</span>
            <span className="hidden xs:inline">VPW Stadium</span>
          </button>
          
          <div className="flex items-center gap-2 sm:gap-4">
            <button 
              onClick={() => setIsEntered(false)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border ${!isEntered ? 'bg-orange-500 text-white border-orange-500' : 'bg-white/5 hover:bg-white/10 text-gray-400 border-white/5'}`}
            >
              Home
            </button>
            {isEntered && (
              <div className="px-3 py-1 bg-orange-500/10 border border-orange-500/20 rounded-full">
                <span className="text-[9px] font-black uppercase tracking-widest text-orange-500 animate-pulse">Live Stadium</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          {user ? (
            <>
              <button 
                onClick={() => setIsDashboardOpen(true)}
                className="flex items-center gap-2 px-3 sm:px-5 py-2.5 bg-white/5 hover:bg-white/10 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all border border-white/10 group"
              >
                <LayoutDashboard size={14} className="text-orange-500 group-hover:scale-110 transition-transform" />
                <span>Dashboard</span>
              </button>
              
              {isAdmin && (
                <button 
                  onClick={() => handleOpenAdmin('users')}
                  className="hidden sm:flex items-center gap-2 px-4 py-2.5 bg-orange-500/10 hover:bg-orange-500/20 text-orange-500 rounded-full text-xs font-black uppercase tracking-widest transition-all border border-orange-500/20"
                >
                  <Shield size={14} />
                  Admin
                </button>
              )}

              <div className="flex items-center gap-3 pl-4 border-l border-white/10">
                <button 
                  onClick={() => setIsDashboardOpen(true)}
                  className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center overflow-hidden border border-white/10 hover:border-orange-500 transition-all p-0.5"
                >
                  {profile?.photoURL ? (
                    <img src={profile.photoURL} alt={profile.displayName || ''} className="w-full h-full rounded-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full rounded-full bg-orange-500/20 flex items-center justify-center">
                      <UserIcon size={18} className="text-orange-500" />
                    </div>
                  )}
                </button>
                <div className="hidden lg:block">
                  <p className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">{profile?.displayName || 'Fan'}</p>
                  <button 
                    onClick={logout}
                    className="text-[9px] font-bold uppercase tracking-widest text-gray-500 hover:text-red-500 transition-colors flex items-center gap-1"
                  >
                    <LogOut size={10} />
                    Sign Out
                  </button>
                </div>
              </div>
            </>
          ) : (
            <button 
              onClick={() => setIsAuthModalOpen(true)}
              className="bg-white text-black px-8 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-orange-500 hover:text-white transition-all shadow-lg shadow-white/5"
            >
              Sign In
            </button>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <Landing 
        onEnter={handleEnter} 
        isEntered={isEntered} 
        isAdmin={isAdmin}
        onOpenAdmin={handleOpenAdmin}
      />
      
      {!isAdmin && (
        <SeatSelector 
          isEntered={isEntered} 
          selectedSeat={selectedSeat} 
          onSelect={handleSeatSelect} 
        />
      )}

      {/* Modals */}
      <Suspense fallback={null}>
        <AuthModal 
          isOpen={isAuthModalOpen} 
          onClose={() => setIsAuthModalOpen(false)} 
          onLogin={handleLoginSuccess}
        />

        <TicketModal 
          isOpen={isTicketModalOpen} 
          onClose={() => setIsTicketModalOpen(false)} 
          ticket={currentTicket}
        />

        <AdminPanel 
          isOpen={isAdminPanelOpen} 
          onClose={() => setIsAdminPanelOpen(false)} 
          isAdmin={isAdmin}
          initialTab={adminTab}
        />

        <UserDashboard 
          isOpen={isDashboardOpen} 
          onClose={() => setIsDashboardOpen(false)} 
        />
      </Suspense>

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500">Initializing Experience</p>
        </div>
      )}
    </div>
  );
}

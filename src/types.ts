export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: 'user' | 'admin';
  createdAt: any;
  isVerified?: boolean;
  isBlocked?: boolean;
  verificationCode?: string;
}

export interface Ticket {
  id: string;
  userId: string;
  matchId: string;
  seatId: string;
  status: 'selected' | 'confirmed' | 'approved';
  createdAt: any;
  updatedAt: any;
}

export interface Match {
  id: string;
  title: string;
  date: any;
  venue: string;
  price: number;
  status: 'active' | 'cancelled' | 'completed' | 'live';
  type: string;
  teams: {
    teamA: string;
    teamB: string;
  };
}

export interface SeatLock {
  id: string;
  seatId: string;
  userId: string;
  expiresAt: any;
}

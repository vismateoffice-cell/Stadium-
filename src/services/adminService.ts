import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  getDocs,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';

export const adminService = {
  // Match Management
  async addMatch(matchData: any) {
    const matchId = matchData.id || `MATCH-${Date.now()}`;
    const matchRef = doc(db, 'matches', matchId);
    try {
      await setDoc(matchRef, {
        ...matchData,
        id: matchId,
        status: matchData.status || 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return matchId;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `matches/${matchId}`);
    }
  },

  async deleteMatch(matchId: string) {
    const matchRef = doc(db, 'matches', matchId);
    try {
      await deleteDoc(matchRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `matches/${matchId}`);
    }
  },

  async cancelMatch(matchId: string) {
    const matchRef = doc(db, 'matches', matchId);
    try {
      await updateDoc(matchRef, { status: 'cancelled', updatedAt: serverTimestamp() });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `matches/${matchId}`);
    }
  },

  async toggleLiveMatch(matchId: string, isLive: boolean) {
    const matchRef = doc(db, 'matches', matchId);
    try {
      await updateDoc(matchRef, { 
        status: isLive ? 'live' : 'active',
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `matches/${matchId}`);
    }
  },

  async updateMatch(matchId: string, matchData: Partial<any>) {
    const matchRef = doc(db, 'matches', matchId);
    try {
      await updateDoc(matchRef, {
        ...matchData,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `matches/${matchId}`);
    }
  },

  async generateMockMatches(count: number = 30) {
    const teams = ['IND', 'AUS', 'ENG', 'PAK', 'NZ', 'SA', 'WI', 'SL', 'AFG', 'BAN'];
    const types = ['T20', 'ODI', 'Test'];
    const prices = [0, 500, 1000, 2500, 5000];
    
    const batch = writeBatch(db);
    
    for (let i = 0; i < count; i++) {
      const t1 = teams[Math.floor(Math.random() * teams.length)];
      let t2 = teams[Math.floor(Math.random() * teams.length)];
      while (t1 === t2) t2 = teams[Math.floor(Math.random() * teams.length)];
      
      const date = new Date();
      date.setDate(date.getDate() + i + 1);
      
      const matchId = `MATCH-${Date.now()}-${i}`;
      const matchRef = doc(db, 'matches', matchId);
      
      batch.set(matchRef, {
        id: matchId,
        title: `${t1} vs ${t2}`,
        type: types[Math.floor(Math.random() * types.length)],
        price: prices[Math.floor(Math.random() * prices.length)],
        venue: 'VPW Stadium, Mumbai',
        date: date.toISOString(),
        teams: { teamA: t1, teamB: t2 },
        status: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
    
    try {
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'matches/batch');
    }
  },

  // User Management
  async getAllUsers() {
    const usersRef = collection(db, 'users');
    try {
      const snap = await getDocs(usersRef);
      return snap.docs.map(doc => doc.data());
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'users');
    }
  },

  async blockUser(userId: string, blocked: boolean) {
    const userRef = doc(db, 'users', userId);
    try {
      await updateDoc(userRef, { isBlocked: blocked, updatedAt: serverTimestamp() });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
    }
  },

  // Ticket Management
  async getAllTickets() {
    const ticketsRef = collection(db, 'tickets');
    try {
      const snap = await getDocs(ticketsRef);
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'tickets');
    }
  },

  async cancelTicket(ticketId: string) {
    const ticketRef = doc(db, 'tickets', ticketId);
    try {
      await deleteDoc(ticketRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `tickets/${ticketId}`);
    }
  },

  // Seat Management
  async getAllBlockedSeats() {
    const locksRef = collection(db, 'seatLocks');
    const q = query(locksRef, where('userId', '==', 'ADMIN_BLOCKED'));
    try {
      const snap = await getDocs(q);
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'seatLocks');
    }
  },

  async blockSeat(seatId: string, blocked: boolean) {
    const seatRef = doc(db, 'seatLocks', `BLOCKED_${seatId}`);
    try {
      if (blocked) {
        await setDoc(seatRef, {
          seatId,
          userId: 'ADMIN_BLOCKED',
          expiresAt: new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000) // 100 years
        });
      } else {
        await deleteDoc(seatRef);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `seatLocks/BLOCKED_${seatId}`);
    }
  }
};

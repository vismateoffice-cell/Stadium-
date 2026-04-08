import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  runTransaction, 
  serverTimestamp,
  query,
  where,
  getDocs,
  onSnapshot
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';

export const ticketService = {
  // Real-time Matches Subscription
  subscribeToMatches(callback: (matches: any[]) => void) {
    const matchesRef = collection(db, 'matches');
    return onSnapshot(matchesRef, (snapshot) => {
      const matches = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(matches);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'matches');
    });
  },

  async lockSeat(seatId: string, userId: string) {
    const lockRef = doc(db, 'seatLocks', seatId);
    try {
      await runTransaction(db, async (transaction) => {
        const lockSnap = await transaction.get(lockRef);
        if (lockSnap.exists()) {
          const data = lockSnap.data();
          const now = Date.now();
          if (data.expiresAt.toMillis() > now && data.userId !== userId) {
            throw new Error('Seat is already locked by another user');
          }
        }
        
        transaction.set(lockRef, {
          seatId,
          userId,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 min TTL
        });
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `seatLocks/${seatId}`);
    }
  },

  async confirmTicket(seatId: string, userId: string, matchId: string) {
    const ticketId = `${userId}_${matchId}`;
    const ticketRef = doc(db, 'tickets', ticketId);
    
    try {
      await setDoc(ticketRef, {
        userId,
        matchId,
        seatId,
        status: 'approved',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return ticketId;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `tickets/${ticketId}`);
    }
  },

  async getMyTickets(userId: string) {
    const ticketsRef = collection(db, 'tickets');
    const q = query(ticketsRef, where('userId', '==', userId));
    try {
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'tickets');
    }
  },

  async getOccupiedSeats(matchId: string) {
    const ticketsRef = collection(db, 'tickets');
    const locksRef = collection(db, 'seatLocks');
    
    const ticketsQuery = query(ticketsRef, where('matchId', '==', matchId));
    
    try {
      const [ticketsSnap, locksSnap] = await Promise.all([
        getDocs(ticketsQuery),
        getDocs(locksRef)
      ]);
      
      const occupied = new Set<string>();
      
      ticketsSnap.docs.forEach(doc => {
        const data = doc.data();
        if (data.seatId) occupied.add(data.seatId);
      });
      
      locksSnap.docs.forEach(doc => {
        const data = doc.data();
        // Include both admin blocks and active user locks
        if (data.userId === 'ADMIN_BLOCKED') {
          occupied.add(data.seatId);
        } else if (data.expiresAt && data.expiresAt.toMillis() > Date.now()) {
          occupied.add(data.seatId);
        }
      });
      
      return Array.from(occupied);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'occupiedSeats');
      return [];
    }
  },

  async getMatches() {
    const matchesRef = collection(db, 'matches');
    try {
      const querySnapshot = await getDocs(matchesRef);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'matches');
    }
  }
};

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

      // Fetch user and match details for the email
      const [userSnap, matchSnap] = await Promise.all([
        getDoc(doc(db, 'users', userId)),
        getDoc(doc(db, 'matches', matchId))
      ]);

      if (userSnap.exists() && matchSnap.exists()) {
        const userData = userSnap.data();
        const matchData = matchSnap.data();
        const matchDate = matchData.date?.seconds 
          ? new Date(matchData.date.seconds * 1000).toLocaleDateString()
          : new Date(matchData.date).toLocaleDateString();

        await setDoc(doc(collection(db, 'mail')), {
          to: userData.email,
          message: {
            subject: `Ticket Confirmed: ${matchData.title}`,
            html: `
              <div style="font-family: 'Courier New', Courier, monospace; max-width: 500px; margin: 0 auto; padding: 30px; background: #fff; color: #000; border: 2px solid #000;">
                <div style="text-align: center; border-bottom: 2px dashed #000; padding-bottom: 20px; margin-bottom: 20px;">
                  <h1 style="margin: 0; font-size: 24px; text-transform: uppercase;">VPW Stadium Pass</h1>
                  <p style="margin: 5px 0; font-size: 12px; opacity: 0.6;">OFFICIAL ENTRY TICKET</p>
                </div>
                
                <div style="margin-bottom: 20px;">
                  <p style="margin: 0; font-size: 10px; text-transform: uppercase; opacity: 0.5;">Match</p>
                  <h2 style="margin: 0; font-size: 20px; text-transform: uppercase;">${matchData.title}</h2>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                  <div>
                    <p style="margin: 0; font-size: 10px; text-transform: uppercase; opacity: 0.5;">Date</p>
                    <p style="margin: 0; font-weight: bold;">${matchDate}</p>
                  </div>
                  <div>
                    <p style="margin: 0; font-size: 10px; text-transform: uppercase; opacity: 0.5;">Seat</p>
                    <p style="margin: 0; font-weight: bold; font-size: 18px; color: #f97316;">${seatId}</p>
                  </div>
                </div>

                <div style="margin-bottom: 20px;">
                  <p style="margin: 0; font-size: 10px; text-transform: uppercase; opacity: 0.5;">Venue</p>
                  <p style="margin: 0;">${matchData.venue}</p>
                </div>

                <div style="border-top: 2px dashed #000; padding-top: 20px; text-align: center;">
                  <p style="font-size: 10px; margin-bottom: 10px;">TICKET ID: ${ticketId}</p>
                  <div style="background: #000; color: #fff; padding: 10px; display: inline-block; font-size: 10px; letter-spacing: 2px;">
                    VALID FOR ONE ENTRY
                  </div>
                </div>
              </div>
            `
          },
          status: { state: 'PENDING' }
        });
      }

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

import { useState, useEffect } from 'react';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut,
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, collection, addDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { UserProfile } from '../types';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        // Sync profile with Firestore in background
        const profileRef = doc(db, 'users', firebaseUser.uid);
        getDoc(profileRef).then((profileSnap) => {
          const isVerified = firebaseUser.emailVerified || firebaseUser.providerData[0]?.providerId === 'google.com';
          
          if (profileSnap.exists()) {
            const currentProfile = profileSnap.data() as UserProfile;
            // Update verification status if it changed in Firebase Auth
            if (isVerified && !currentProfile.isVerified) {
              updateDoc(profileRef, { isVerified: true });
              setProfile({ ...currentProfile, isVerified: true });
            } else {
              setProfile(currentProfile);
            }
          } else {
            // Create new profile
            const newProfile: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Fan',
              photoURL: firebaseUser.photoURL,
              role: firebaseUser.email === 'vismateoffice@gmail.com' ? 'admin' : 'user',
              createdAt: serverTimestamp(),
              isVerified: isVerified,
              isBlocked: false
            };
            setDoc(profileRef, newProfile).then(() => {
              setProfile(newProfile);
            });
          }
        }).catch(err => {
          console.error("Error fetching profile:", err);
        });
      } else {
        setProfile(null);
      }
      
      // Hide loader as soon as auth state is determined
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Google login error:', error);
      throw error;
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (error) {
      console.error('Email login error:', error);
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, pass: string, name: string) => {
    try {
      const { user: newUser } = await createUserWithEmailAndPassword(auth, email, pass);
      await updateProfile(newUser, { displayName: name });
      
      // Send native Firebase email verification link
      await sendEmailVerification(newUser);
      
      const profileRef = doc(db, 'users', newUser.uid);
      await setDoc(profileRef, {
        uid: newUser.uid,
        email: newUser.email,
        displayName: name,
        photoURL: null,
        role: email === 'vismateoffice@gmail.com' ? 'admin' : 'user',
        createdAt: serverTimestamp(),
        isVerified: false,
        isBlocked: false
      });

      // Trigger Welcome Email via Firestore
      await addDoc(collection(db, 'mail'), {
        to: email,
        message: {
          subject: 'Welcome to VPW Stadium!',
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background: #000; color: #fff; border-radius: 24px;">
              <h1 style="font-size: 48px; line-height: 0.9; text-transform: uppercase; font-style: italic; margin-bottom: 24px;">Welcome to <span style="color: #f97316;">VPW</span></h1>
              <p style="font-size: 18px; color: #888; margin-bottom: 32px;">Hello ${name}, your journey to the ultimate stadium experience starts here.</p>
              <div style="border-top: 1px solid #333; padding-top: 32px;">
                <p style="font-size: 14px; text-transform: uppercase; letter-spacing: 2px; color: #f97316; margin-bottom: 8px;">Next Step</p>
                <p style="font-size: 16px; margin-bottom: 24px;">Please verify your email using the link we just sent you to unlock full access to ticket bookings.</p>
              </div>
              <p style="font-size: 12px; color: #444; margin-top: 40px;">VPW Stadium - The Future of Cricket</p>
            </div>
          `
        },
        status: { state: 'PENDING' }
      });
      
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  };

  const resendVerificationEmail = async () => {
    if (auth.currentUser) {
      await sendEmailVerification(auth.currentUser);
      return true;
    }
    return false;
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error('Password reset error:', error);
      throw error;
    }
  };

  const updateUserSettings = async (data: { displayName?: string; photoURL?: string }) => {
    if (!user) return;
    try {
      const profileRef = doc(db, 'users', user.uid);
      await updateDoc(profileRef, data);
      if (data.displayName) {
        await updateProfile(user, { displayName: data.displayName });
      }
      setProfile(prev => prev ? { ...prev, ...data } : null);
    } catch (error) {
      console.error('Update settings error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  return {
    user,
    profile,
    loading,
    loginWithGoogle,
    loginWithEmail,
    signUpWithEmail,
    resendVerificationEmail,
    resetPassword,
    updateUserSettings,
    logout,
    isAdmin: profile?.role === 'admin'
  };
}

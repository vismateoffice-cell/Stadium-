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
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
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
          if (profileSnap.exists()) {
            setProfile(profileSnap.data() as UserProfile);
          } else {
            // Create new profile
            const newProfile: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Fan',
              photoURL: firebaseUser.photoURL,
              role: firebaseUser.email === 'vismateoffice@gmail.com' ? 'admin' : 'user',
              createdAt: serverTimestamp(),
              isVerified: firebaseUser.providerData[0]?.providerId === 'google.com',
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
      
      // Generate mock OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const profileRef = doc(db, 'users', newUser.uid);
      await setDoc(profileRef, {
        uid: newUser.uid,
        email: newUser.email,
        displayName: name,
        photoURL: null,
        role: email === 'vismateoffice@gmail.com' ? 'admin' : 'user',
        createdAt: serverTimestamp(),
        isVerified: false,
        verificationCode: otp
      });
      
      // In a real app, you'd send this via email service
      console.log(`[MOCK EMAIL] OTP for ${email}: ${otp}`);
      alert(`[MOCK EMAIL] Your verification code is: ${otp}`);
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  };

  const verifyOTP = async (code: string) => {
    if (!user || !profile) return false;
    if (code === profile.verificationCode) {
      const profileRef = doc(db, 'users', user.uid);
      await updateDoc(profileRef, { isVerified: true });
      setProfile(prev => prev ? { ...prev, isVerified: true } : null);
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
    verifyOTP,
    resetPassword,
    updateUserSettings,
    logout,
    isAdmin: profile?.role === 'admin'
  };
}

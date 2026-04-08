import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, LogIn, Mail, ShieldCheck, ArrowLeft, KeyRound, UserPlus } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: () => void;
}

type AuthView = 'initial' | 'login' | 'signup' | 'reset' | 'otp';

export default function AuthModal({ isOpen, onClose, onLogin }: AuthModalProps) {
  const [view, setView] = useState<AuthView>('initial');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const { loginWithGoogle, loginWithEmail, signUpWithEmail, resetPassword, resendVerificationEmail } = useAuth();

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await loginWithGoogle();
      onLogin();
    } catch (err: any) {
      setError(err.message || 'Google login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await loginWithEmail(email, password);
      onLogin();
    } catch (err: any) {
      if (err.code === 'auth/operation-not-allowed') {
        setError('Email/Password login is not enabled in your Firebase Console. Go to Authentication > Sign-in method to enable it.');
      } else {
        setError(err.message || 'Login failed');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await signUpWithEmail(email, password, name);
      setView('otp'); // Reusing 'otp' view name for the verification message
    } catch (err: any) {
      if (err.code === 'auth/operation-not-allowed') {
        setError('Email/Password sign-up is not enabled in your Firebase Console. Go to Authentication > Sign-in method to enable it.');
      } else {
        setError(err.message || 'Sign up failed');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendLink = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await resendVerificationEmail();
      setError('Verification link resent! Please check your inbox.');
    } catch (err: any) {
      setError(err.message || 'Failed to resend link');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await resetPassword(email);
      setError('Reset link sent! Check your inbox (and spam). If the link says "already used", try opening it in an Incognito window.');
      setTimeout(() => setView('login'), 6000);
    } catch (err: any) {
      setError(err.message || 'Reset failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-[#111] w-full max-w-md h-full sm:h-auto sm:rounded-3xl rounded-none overflow-y-auto border border-white/10 shadow-2xl relative"
          >
            <button 
              onClick={onClose}
              className="absolute top-6 pt-safe right-6 pr-safe p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 z-10"
            >
              <X size={20} />
            </button>

            <div className="p-8 sm:p-12 pt-safe pb-safe">
              {view !== 'initial' && (
                <button 
                  onClick={() => { setView('initial'); setError(null); }}
                  className="flex items-center gap-2 text-gray-500 hover:text-white mb-8 text-xs font-bold uppercase tracking-widest transition-colors"
                >
                  <ArrowLeft size={14} />
                  Back
                </button>
              )}

              <div className="text-center mb-10">
                <div className="w-16 h-16 bg-orange-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-orange-500/20">
                  <ShieldCheck size={32} className="text-orange-500" />
                </div>
                <h2 className="text-3xl font-black tracking-tighter uppercase italic mb-2">
                  {view === 'initial' && 'Welcome to VPW'}
                  {view === 'login' && 'Sign In'}
                  {view === 'signup' && 'Create Account'}
                  {view === 'reset' && 'Reset Password'}
                  {view === 'otp' && 'Check Your Email'}
                </h2>
                <p className="text-gray-400 font-medium text-sm">
                  {view === 'initial' && 'Secure your place in history.'}
                  {view === 'login' && 'Enter your credentials to continue.'}
                  {view === 'signup' && 'Join the stadium experience.'}
                  {view === 'reset' && 'We\'ll send a link to your email.'}
                  {view === 'otp' && `We've sent a verification link to ${email}. Click the link in the email to verify your account.`}
                </p>
              </div>

              {error && (
                <div className={`p-4 rounded-xl mb-6 text-xs font-bold uppercase tracking-widest text-center ${error.includes('sent') ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                  {error}
                </div>
              )}

              <div className="space-y-4">
                {view === 'initial' && (
                  <>
                    <button
                      onClick={handleGoogleLogin}
                      disabled={isLoading}
                      className="w-full bg-white text-black py-4 rounded-2xl font-bold uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-orange-500 hover:text-white transition-all disabled:opacity-50"
                    >
                      <LogIn size={20} />
                      Continue with Google
                    </button>
                    <button
                      onClick={() => setView('login')}
                      className="w-full bg-white/5 text-white py-4 rounded-2xl font-bold uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-white/10 transition-all border border-white/5"
                    >
                      <Mail size={20} />
                      Sign in with Email
                    </button>
                    <button
                      onClick={() => setView('signup')}
                      className="w-full text-gray-500 hover:text-white py-2 text-xs font-bold uppercase tracking-[0.2em] transition-colors"
                    >
                      Don't have an account? Sign Up
                    </button>
                  </>
                )}

                {view === 'login' && (
                  <form onSubmit={handleEmailLogin} className="space-y-4">
                    <input
                      type="email"
                      placeholder="Email Address"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-medium focus:outline-none focus:border-orange-500/50 transition-all"
                    />
                    <input
                      type="password"
                      placeholder="Password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-medium focus:outline-none focus:border-orange-500/50 transition-all"
                    />
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-orange-500 text-white py-4 rounded-2xl font-bold uppercase tracking-widest hover:bg-orange-600 transition-all disabled:opacity-50"
                    >
                      {isLoading ? 'Signing In...' : 'Sign In'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setView('reset')}
                      className="w-full text-gray-500 hover:text-white py-2 text-[10px] font-bold uppercase tracking-[0.2em] transition-colors"
                    >
                      Forgot Password?
                    </button>
                  </form>
                )}

                {view === 'signup' && (
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <input
                      type="text"
                      placeholder="Full Name"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-medium focus:outline-none focus:border-orange-500/50 transition-all"
                    />
                    <input
                      type="email"
                      placeholder="Email Address"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-medium focus:outline-none focus:border-orange-500/50 transition-all"
                    />
                    <input
                      type="password"
                      placeholder="Password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-medium focus:outline-none focus:border-orange-500/50 transition-all"
                    />
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-white text-black py-4 rounded-2xl font-bold uppercase tracking-widest hover:bg-orange-500 hover:text-white transition-all disabled:opacity-50"
                    >
                      {isLoading ? 'Creating Account...' : 'Sign Up'}
                    </button>
                  </form>
                )}

                {view === 'otp' && (
                  <div className="space-y-4">
                    <div className="bg-orange-500/5 border border-orange-500/10 p-6 rounded-2xl text-center">
                      <Mail size={32} className="text-orange-500 mx-auto mb-4" />
                      <p className="text-xs text-gray-400 leading-relaxed uppercase font-black tracking-widest">
                        Once you verify your email, you will be automatically logged in.
                      </p>
                    </div>
                    <button
                      onClick={handleResendLink}
                      disabled={isLoading}
                      className="w-full bg-orange-500 text-white py-4 rounded-2xl font-bold uppercase tracking-widest hover:bg-orange-600 transition-all disabled:opacity-50"
                    >
                      {isLoading ? 'Sending...' : 'Resend Verification Link'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setView('login')}
                      className="w-full text-gray-500 hover:text-white py-2 text-[10px] font-bold uppercase tracking-[0.2em] transition-colors"
                    >
                      Already verified? Sign In
                    </button>
                  </div>
                )}

                {view === 'reset' && (
                  <form onSubmit={handleReset} className="space-y-4">
                    <input
                      type="email"
                      placeholder="Email Address"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-medium focus:outline-none focus:border-orange-500/50 transition-all"
                    />
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-white text-black py-4 rounded-2xl font-bold uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-orange-500 hover:text-white transition-all disabled:opacity-50"
                    >
                      <KeyRound size={20} />
                      {isLoading ? 'Sending...' : 'Send Reset Link'}
                    </button>
                  </form>
                )}
              </div>

              <p className="mt-12 text-[10px] text-gray-600 font-bold uppercase tracking-[0.2em] leading-loose text-center">
                By continuing, you agree to the VPW Stadium <br />
                Terms of Service and Privacy Policy.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

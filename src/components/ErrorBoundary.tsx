import React, { useState, useEffect, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

export default function ErrorBoundary({ children }: Props) {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const errorHandler = (event: ErrorEvent) => {
      setHasError(true);
      setError(event.error);
    };

    window.addEventListener('error', errorHandler);
    return () => window.removeEventListener('error', errorHandler);
  }, []);

  const handleReset = () => {
    setHasError(false);
    setError(null);
    window.location.reload();
  };

  if (hasError) {
    let errorMessage = 'An unexpected error occurred.';
    let firestoreInfo = null;

    try {
      if (error?.message) {
        firestoreInfo = JSON.parse(error.message);
        if (firestoreInfo.error) {
          errorMessage = `Firestore Error: ${firestoreInfo.error}`;
        }
      }
    } catch (e) {
      // Not a JSON error message
    }

    return (
      <div className="fixed inset-0 z-[500] bg-black flex items-center justify-center p-6">
        <div className="bg-[#111] border border-white/10 p-12 rounded-[2.5rem] max-w-lg w-full text-center shadow-2xl">
          <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-red-500/20">
            <AlertTriangle size={40} className="text-red-500" />
          </div>
          
          <h2 className="text-3xl font-black tracking-tighter uppercase italic mb-4">System Error</h2>
          <p className="text-gray-400 font-medium mb-8 leading-relaxed">
            {errorMessage}
          </p>

          {firestoreInfo && (
            <div className="bg-black/40 rounded-2xl p-4 mb-8 text-left border border-white/5">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-600 mb-2">Debug Info</p>
              <div className="space-y-1">
                <p className="text-[10px] text-gray-400 font-mono">Op: {firestoreInfo.operationType}</p>
                <p className="text-[10px] text-gray-400 font-mono">Path: {firestoreInfo.path}</p>
              </div>
            </div>
          )}

          <button
            onClick={handleReset}
            className="w-full bg-white text-black py-4 rounded-2xl font-bold uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-orange-500 hover:text-white transition-all"
          >
            <RefreshCw size={20} />
            Restart Experience
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

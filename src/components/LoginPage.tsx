import React, { useState } from 'react';
import { Sprout, Loader2, ShieldCheck, Leaf, MapPin } from 'lucide-react';
import { firebaseSignInAndPersist } from '../firebase';

type Props = {
  onClose: () => void;
};

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" className="w-5 h-5" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

export default function LoginPage({ onClose }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);

    try {
      const user = await firebaseSignInAndPersist();
      if (user) {
        onClose();
      } else {
        setError('Google sign-in was cancelled or failed. Please try again.');
      }
    } catch (err: any) {
      setError(err?.message || 'Google authentication error.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = () => {
    setLoading(true);
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-editorial-cream">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-16 h-16 bg-editorial-forest rounded-sm flex items-center justify-center text-white shadow-xs">
            <Sprout className="w-8 h-8" />
          </div>
          <h1 className="mt-4 font-serif font-bold text-editorial-dark text-3xl tracking-tighter uppercase">
            FarmAI
          </h1>
          <p className="mt-1 text-[11px] uppercase tracking-[0.2em] font-sans font-bold text-editorial-sage">
            AI Companion for Crop Pathology & Growth Planning
          </p>
        </div>

        {/* Card */}
        <div className="bg-white border border-editorial-border rounded-sm shadow-xs p-8">
          <h2 className="font-serif font-bold text-editorial-dark text-xl">
            Welcome to FarmAI
          </h2>
          <p className="mt-2 text-xs text-editorial-sage font-serif leading-relaxed">
            Sign in with your Google account to save your crop diagnoses, chat history, and farming calendars.
          </p>

          {error && (
            <div className="mt-4 p-3 bg-rose-50 border border-rose-100 rounded-sm text-xs text-rose-800 font-serif">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="mt-6 w-full flex items-center justify-center gap-3 bg-white border border-neutral-300 hover:border-editorial-dark hover:bg-editorial-cream/30 px-4 py-3 rounded-sm font-semibold text-sm text-editorial-dark transition-all disabled:opacity-60"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin text-editorial-sage" /> : <GoogleIcon />}
            {loading ? 'Signing in...' : 'Continue with Google'}
          </button>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 border-t border-editorial-border/60"></div>
            <span className="text-[9px] text-editorial-sage uppercase tracking-widest font-sans font-bold">or</span>
            <div className="flex-1 border-t border-editorial-border/60"></div>
          </div>

          <button
            type="button"
            onClick={handleGuest}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-editorial-sand hover:bg-editorial-sand/80 border border-editorial-border px-4 py-3 rounded-sm text-xs font-sans font-bold uppercase tracking-wider text-editorial-dark transition-all disabled:opacity-60"
          >
            Continue as Guest
          </button>
        </div>

        {/* Trust bullets */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="flex items-center gap-2 text-[10px] font-sans uppercase tracking-wider font-bold text-editorial-sage">
            <ShieldCheck className="w-4 h-4 text-editorial-forest" /> Secure sessions
          </div>
          <div className="flex items-center gap-2 text-[10px] font-sans uppercase tracking-wider font-bold text-editorial-sage">
            <Leaf className="w-4 h-4 text-editorial-forest" /> Save crop history
          </div>
          <div className="flex items-center gap-2 text-[10px] font-sans uppercase tracking-wider font-bold text-editorial-sage">
            <MapPin className="w-4 h-4 text-editorial-forest" /> Local & cloud sync
          </div>
        </div>

        <p className="mt-6 text-center text-[9px] text-editorial-sage font-mono uppercase tracking-wider">
          © 2026 FarmAI Systems
        </p>
      </div>
    </div>
  );
}

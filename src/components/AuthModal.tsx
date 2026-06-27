import { useState } from "react";
import { signInWithGoogle } from "../lib/authService";
import { X, Shield, Sparkles, Activity, Club } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { isFirebaseConfigured } from "../lib/firebase";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (uid: string, username: string) => void;
}

export default function AuthModal({ isOpen, onClose, onAuthSuccess }: AuthModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const isConfigured = isFirebaseConfigured();

  const handleGoogleAuth = async () => {
    setErrorMsg("");
    setSuccessMsg("");

    if (!isConfigured) {
      setErrorMsg("Firebase services are loaded in sandbox mock mode. Please bind your current project under the Firebase Setup UI first.");
      return;
    }

    setIsLoading(true);
    try {
      const user = await signInWithGoogle();
      const resolvedName = user.displayName || user.email?.split("@")[0] || "NeoBlocker";
      setSuccessMsg(`Welcome, ${resolvedName}! Linking stats...`);
      
      setTimeout(() => {
        onAuthSuccess(user.uid, resolvedName);
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error(err);
      let friendlyError = err.message || "Could not complete Google authentication.";
      if (err.code === "auth/popup-closed-by-user") {
        friendlyError = "Sign-in popup was closed before completing.";
      } else if (err.code === "auth/popup-blocked") {
        friendlyError = "The browser popup was blocked. Please enable popups for this site.";
      }
      setErrorMsg(friendlyError);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#040508]/85 backdrop-blur-md"
          />

          {/* Modal Content */}
          <motion.div
            id="auth-modal-container"
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            transition={{ type: "spring", duration: 0.4 }}
            className="relative w-full max-w-md bg-[#0c0d14] border-[5px] border-[#00f0ff]/50 rounded-[32px] shadow-[0_0_40px_rgba(0,240,255,0.25)] text-white p-6 overflow-hidden z-10 select-none font-sans"
          >
            {/* Grid background effect */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#00f0ff08_1px,transparent_1px),linear-gradient(to_bottom,#00f0ff08_1px,transparent_1px)] bg-[size:16px_16px] opacity-40 pointer-events-none" />

            {/* Header */}
            <div className="flex justify-between items-center pb-4 border-b border-[#00f0ff]/20 mb-5 relative z-10">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#ea00d9] drop-shadow-[0_0_6px_rgba(234,0,217,0.5)]" />
                <h3 className="font-extrabold text-sm uppercase tracking-wider text-white">
                  Arcade Authentication
                </h3>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-[#12131a] hover:bg-white/10 text-white/75 flex items-center justify-center border border-white/10 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Alert / Warning if Firebase is not yet active */}
            {!isConfigured && (
              <div className="mb-4 bg-[#ea00d9]/10 border border-[#ea00d9]/30 rounded-xl p-3 text-[10px] leading-relaxed text-[#ff007f] font-mono flex gap-2 items-start relative z-10">
                <Activity className="w-4 h-4 shrink-0 mt-0.5 animate-pulse text-[#ea00d9]" />
                <div>
                  <strong className="block mb-0.5 text-white uppercase tracking-wider">Demo / Sandbox Mode</strong>
                  To play on live servers, activate Firebase in AI Studio! Popups and structures are viewable immediately.
                </div>
              </div>
            )}

            {/* Neon Information Card */}
            <div className="bg-[#12131a]/80 p-4 border border-white/5 rounded-2xl mb-5 space-y-2 relative z-10">
              <div className="flex items-center gap-2 mb-1">
                <Club className="w-4 h-4 text-[#00f0ff]" />
                <h4 className="text-xs font-black uppercase text-[#00f0ff] tracking-wider">Cloud Synchronizer</h4>
              </div>
              <p className="text-[10px] text-white/70 leading-relaxed font-mono">
                Connect your Google Account to sync high scores, preserve matchmaking badges, unlock leaderboard ratings, and claim your NeoBlocks arcade persona across devices in real time.
              </p>
            </div>

            {/* Messages */}
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 bg-red-500/10 border border-red-500/30 text-red-400 p-2.5 rounded-xl text-[10px] font-mono leading-relaxed"
              >
                🚫 {errorMsg}
              </motion.div>
            )}

            {successMsg && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-2.5 rounded-xl text-[10px] font-mono leading-relaxed"
              >
                ✅ {successMsg}
              </motion.div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3 relative z-10">
              <button
                type="button"
                onClick={handleGoogleAuth}
                disabled={isLoading}
                className="w-full h-12 bg-gradient-to-r from-[#00f0ff] to-[#7000ff] hover:brightness-110 disabled:opacity-50 text-white font-black text-xs py-2 rounded-xl border-none shadow-[0_0_15px_rgba(0,240,255,0.4)] transition active:scale-[0.98] cursor-pointer flex items-center justify-center gap-3 uppercase tracking-widest"
              >
                {isLoading ? (
                  <>
                    <Activity className="w-4 h-4 animate-spin text-[#ff007f]" />
                    SIGNING IN VIA POPUP...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4.5 h-4.5 text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.8)] animate-pulse" />
                    SIGN IN WITH GOOGLE
                  </>
                )}
              </button>
            </div>

            {/* Footer hint */}
            <p className="text-[9px] text-center text-white/40 font-mono mt-5 leading-relaxed">
              * Verification fully handled via standard client-side secure protocols. We never store credentials.
            </p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

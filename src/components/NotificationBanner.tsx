import { motion, AnimatePresence } from "motion/react";
import { X, Smartphone, Zap, CheckCircle2, AlertCircle } from "lucide-react";
import { AndroidNotification } from "../types";

interface NotificationBannerProps {
  notification: AndroidNotification | null;
  onDismiss: () => void;
}

export default function NotificationBanner({ notification, onDismiss }: NotificationBannerProps) {
  return (
    <AnimatePresence>
      {notification && (
        <motion.div
          initial={{ y: -50, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -50, opacity: 0, scale: 0.95 }}
          className="fixed top-14 left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-md bg-slate-900/95 border border-emerald-500/30 backdrop-blur-xl rounded-2xl p-3.5 shadow-[0_10px_30px_rgba(0,0,0,0.6)] flex items-center justify-between text-white gap-3"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <Zap size={18} />
            </div>
            <div className="min-w-0 overflow-hidden">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-mono font-bold text-emerald-400 tracking-wider">Android System</span>
                <span className="text-[10px] text-white/40">• Just now</span>
              </div>
              <h4 className="text-xs font-bold text-white truncate">{notification.title}</h4>
              <p className="text-[11px] text-white/70 truncate">{notification.body}</p>
            </div>
          </div>

          <button
            onClick={onDismiss}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors shrink-0"
          >
            <X size={16} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

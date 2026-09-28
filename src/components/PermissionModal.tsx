import { motion } from 'motion/react';
import { MicOff, Camera, MapPin, ShieldCheck, X } from 'lucide-react';

interface Props {
  onClose: () => void;
}

export default function PermissionModal({ onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md bg-slate-900/95 border border-emerald-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center relative overflow-hidden text-white"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500" />
        
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
        >
          <X size={18} />
        </button>

        <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-5 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
          <ShieldCheck size={32} className="text-emerald-400" />
        </div>
        
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">Android Permissions Required</h2>
        <p className="text-white/70 text-xs sm:text-sm mb-6 leading-relaxed">
          Mara needs permission to access your microphone, camera & device hardware to provide real-time voice assistance and phone controls.
        </p>
        
        <div className="grid grid-cols-3 gap-2 w-full mb-6">
          <div className="flex flex-col items-center p-3 rounded-2xl bg-white/5 border border-white/10">
            <MicOff size={20} className="text-rose-400 mb-1" />
            <span className="text-[11px] font-medium text-white/90">Microphone</span>
            <span className="text-[9px] text-white/50">Voice Input</span>
          </div>
          <div className="flex flex-col items-center p-3 rounded-2xl bg-white/5 border border-white/10">
            <Camera size={20} className="text-cyan-400 mb-1" />
            <span className="text-[11px] font-medium text-white/90">Camera</span>
            <span className="text-[9px] text-white/50">Flash & Lens</span>
          </div>
          <div className="flex flex-col items-center p-3 rounded-2xl bg-white/5 border border-white/10">
            <MapPin size={20} className="text-amber-400 mb-1" />
            <span className="text-[11px] font-medium text-white/90">Location</span>
            <span className="text-[9px] text-white/50">GPS Tracker</span>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-left w-full mb-6">
          <p className="text-xs text-emerald-400 font-semibold mb-2 flex items-center gap-1.5">
            <span>💡</span> How to enable permissions:
          </p>
          <ol className="text-xs text-white/70 list-decimal pl-4 space-y-1.5">
            <li>Click the <strong>Lock (🔒) or Tune (⚙️) icon</strong> next to the browser URL bar.</li>
            <li>Enable <strong>Microphone</strong>, <strong>Camera</strong> & <strong>Location</strong>.</li>
            <li>Click Refresh below to restart Mara.</li>
          </ol>
        </div>
        
        <div className="flex flex-col w-full gap-2.5">
          <button 
            onClick={() => window.location.reload()}
            className="w-full py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold rounded-xl hover:from-emerald-400 hover:to-teal-400 transition-all shadow-lg active:scale-98"
          >
            Allow & Refresh Page
          </button>
          <button 
            onClick={onClose}
            className="w-full py-2.5 px-4 bg-white/5 text-white/70 font-medium text-sm rounded-xl hover:bg-white/10 transition-colors"
          >
            Continue in Text Mode
          </button>
        </div>
      </motion.div>
    </div>
  );
}

import { useState } from "react";
import { motion } from "motion/react";
import { X, Sun, Sparkles } from "lucide-react";

interface FlashlightOverlayProps {
  onClose: () => void;
}

export default function FlashlightOverlay({ onClose }: FlashlightOverlayProps) {
  const [brightness, setBrightness] = useState<number>(100);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-70 flex flex-col justify-between p-6 transition-colors"
      style={{ backgroundColor: `rgba(255, 255, 255, ${brightness / 100})` }}
    >
      {/* Top bar with close button */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 text-white backdrop-blur-md text-xs font-semibold">
          <Sparkles size={14} className="text-yellow-400" />
          <span>Screen Flashlight Active</span>
        </div>
        <button
          onClick={onClose}
          className="p-3 rounded-full bg-black/70 hover:bg-black/90 text-white shadow-xl transition-transform active:scale-95"
          title="Turn Off Flashlight"
        >
          <X size={22} />
        </button>
      </div>

      {/* Center instruction */}
      <div className="text-center">
        <p className="text-sm font-bold text-black/60 uppercase tracking-widest">
          Maximum White Lumens
        </p>
      </div>

      {/* Bottom Brightness Slider */}
      <div className="w-full max-w-sm mx-auto p-4 rounded-2xl bg-black/70 backdrop-blur-md text-white flex items-center gap-3">
        <Sun size={20} className="text-yellow-400 shrink-0" />
        <input
          type="range"
          min="20"
          max="100"
          value={brightness}
          onChange={(e) => setBrightness(parseInt(e.target.value, 10))}
          className="w-full accent-yellow-400 bg-white/20 rounded-lg h-2 cursor-pointer"
        />
        <span className="font-mono text-xs font-bold w-10 text-right">{brightness}%</span>
      </div>
    </motion.div>
  );
}

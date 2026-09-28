import { motion } from "motion/react";
import { AppState } from "../types";

interface VisualizerProps {
  state: AppState;
  torchActive?: boolean;
}

export default function Visualizer({ state, torchActive }: VisualizerProps) {
  const getRingAnimation = (index: number, reverse: boolean = false) => {
    const baseSpeed = state === "listening" ? 2.5 : state === "processing" ? 1.2 : state === "speaking" ? 1.8 : 12;
    return {
      rotate: reverse ? [-360, 0] : [0, 360],
      transition: { duration: baseSpeed + index * 2.2, repeat: Infinity, ease: "linear" }
    };
  };

  const getPulseAnimation = () => {
    if (state === "speaking") {
      return {
        scale: [1, 1.08, 0.95, 1.05, 1],
        opacity: [0.85, 1, 0.8, 1, 0.85],
        transition: { duration: 0.45, repeat: Infinity, ease: "easeInOut" }
      };
    }
    if (state === "listening") {
      return {
        scale: [1, 1.04, 1],
        opacity: [0.75, 1, 0.75],
        transition: { duration: 0.9, repeat: Infinity, ease: "easeInOut" }
      };
    }
    if (state === "processing") {
      return {
        scale: [0.96, 1.04, 0.96],
        opacity: [0.6, 0.95, 0.6],
        transition: { duration: 0.7, repeat: Infinity, ease: "linear" }
      };
    }
    return {
      scale: [1, 1.015, 1],
      opacity: [0.45, 0.65, 0.45],
      transition: { duration: 3.5, repeat: Infinity, ease: "easeInOut" }
    };
  };

  // Indian Cyber Assistant Color Palette (Teal Cyan + Emerald / Violet / Amber)
  const getTheme = () => {
    switch (state) {
      case "listening": 
        return { 
          color: "rgba(168, 85, 247, 1)", 
          glow: "shadow-purple-500/70", 
          border: "border-purple-400",
          coreBg: "from-purple-900/60 to-indigo-950/80",
          hudText: "LISTENING..."
        };
      case "processing": 
        return { 
          color: "rgba(6, 182, 212, 1)", 
          glow: "shadow-cyan-400/80", 
          border: "border-cyan-400",
          coreBg: "from-cyan-900/60 to-blue-950/80",
          hudText: "PROCESSING..."
        };
      case "speaking": 
        return { 
          color: "rgba(244, 63, 94, 1)", 
          glow: "shadow-rose-500/80", 
          border: "border-rose-400",
          coreBg: "from-rose-900/60 to-pink-950/80",
          hudText: "MARA SPEAKING"
        };
      default: 
        return { 
          color: torchActive ? "rgba(250, 204, 21, 1)" : "rgba(16, 185, 129, 0.9)", 
          glow: torchActive ? "shadow-amber-400/80" : "shadow-emerald-500/50", 
          border: torchActive ? "border-amber-400" : "border-emerald-500/60",
          coreBg: "from-emerald-950/70 via-slate-900/80 to-teal-950/80",
          hudText: "ANDROID CORE READY"
        };
    }
  };

  const theme = getTheme();

  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none">
      {/* Ambient Pulsing Glow */}
      <motion.div
        animate={getPulseAnimation()}
        className={`absolute w-[70vw] max-w-[420px] h-[70vw] max-h-[420px] rounded-full blur-[100px] ${theme.glow}`}
        style={{ backgroundColor: theme.color, opacity: 0.18 }}
      />

      {/* Ring 1: Outer Holographic Orbit */}
      <motion.div
        animate={getRingAnimation(4, false)}
        className={`absolute w-[85vw] max-w-[440px] h-[85vw] max-h-[440px] rounded-full border-[1px] border-dashed ${theme.border} opacity-25`}
      />

      {/* Ring 2: Segmented Arc Ring */}
      <motion.div
        animate={getRingAnimation(3, true)}
        className={`absolute w-[70vw] max-w-[360px] h-[70vw] max-h-[360px] rounded-full border-[2px] border-dotted ${theme.border} opacity-35`}
      />

      {/* Ring 3: Tech Quadrant Brackets */}
      <motion.div
        animate={getRingAnimation(2, false)}
        className={`absolute w-[56vw] max-w-[290px] h-[56vw] max-h-[290px] rounded-full border-[1.5px] ${theme.border} border-t-transparent border-b-transparent opacity-50`}
      />

      {/* Ring 4: Inner Laser Ring */}
      <motion.div
        animate={getRingAnimation(1, true)}
        className={`absolute w-[44vw] max-w-[220px] h-[44vw] max-h-[220px] rounded-full border-[2px] border-dashed ${theme.border} opacity-60`}
      />

      {/* Center Core HUD Sphere */}
      <motion.div
        animate={getPulseAnimation()}
        className={`absolute w-[32vw] max-w-[160px] h-[32vw] max-h-[160px] rounded-full border-[1.5px] ${theme.border} bg-gradient-to-b ${theme.coreBg} backdrop-blur-xl flex flex-col items-center justify-center`}
        style={{ 
          boxShadow: `0 0 35px ${theme.color}40, inset 0 0 25px ${theme.color}30` 
        }}
      >
        {/* Assistant Title */}
        <div 
          className="font-mono font-bold tracking-[0.25em] text-2xl md:text-3xl text-white drop-shadow"
          style={{ textShadow: `0 0 16px ${theme.color}, 0 0 32px ${theme.color}` }}
        >
          MARA
        </div>

        {/* Dynamic HUD Subtitle */}
        <div className="font-mono text-[9px] md:text-[10px] tracking-widest text-white/70 uppercase mt-1">
          {theme.hudText}
        </div>
      </motion.div>
    </div>
  );
}

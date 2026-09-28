import { motion } from "motion/react";
import {
  X,
  Activity,
  ShieldCheck,
  Mic,
  Lock,
  Layers,
  Bell,
  Cpu,
  CheckCircle2,
  Play,
  Square,
  Radio,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { BackgroundEngineState } from "../services/backgroundService";
import { ALL_ANDROID_APPS } from "../services/allAppsService";
import { triggerHaptic } from "../services/androidService";

interface AndroidBackgroundHubProps {
  bgState: BackgroundEngineState;
  onClose: () => void;
  onToggleBackgroundDaemon: () => void;
  onToggleWakeWord: () => void;
  onToggleFloatingPiP: () => void;
  onRequestNotifications: () => void;
  onOpenAllApps: () => void;
}

export default function AndroidBackgroundHub({
  bgState,
  onClose,
  onToggleBackgroundDaemon,
  onToggleWakeWord,
  onToggleFloatingPiP,
  onRequestNotifications,
  onOpenAllApps,
}: AndroidBackgroundHubProps) {
  const formatUptime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remSec = sec % 60;
    return `${mins}m ${remSec}s`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 text-white">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-xl bg-slate-950 border border-emerald-500/30 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col gap-4 max-h-[92vh] overflow-y-auto scrollbar-hide"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 relative">
              <Activity size={20} />
              {bgState.isEnabled && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white">
                  Android Background Service
                </h2>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                    bgState.isEnabled
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                      : "bg-white/10 text-white/60 border-white/15"
                  }`}
                >
                  {bgState.isEnabled ? "RUNNING IN BACKGROUND" : "STANDBY"}
                </span>
              </div>
              <p className="text-[11px] text-white/50">
                Foreground Service • WakeLock • MediaSession • All-App Bridge
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Master Background Service Banner */}
        <div
          className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
            bgState.isEnabled
              ? "bg-gradient-to-r from-emerald-950/80 via-teal-950/60 to-slate-900 border-emerald-500/40"
              : "bg-white/5 border-white/10"
          }`}
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Radio
                size={15}
                className={bgState.isEnabled ? "text-emerald-400 animate-pulse" : "text-white/40"}
              />
              <span className="text-sm font-bold text-white">
                Always-On Background Execution
              </span>
            </div>
            <p className="text-xs text-white/65 leading-relaxed">
              Keeps Mara active when you switch to WhatsApp, YouTube, Instagram, or lock your phone screen.
            </p>
            {bgState.isEnabled && (
              <div className="flex items-center gap-3 pt-1 text-[11px] font-mono text-emerald-300">
                <span>Uptime: {formatUptime(bgState.uptimeSeconds)}</span>
                <span>•</span>
                <span>Heartbeat: {bgState.lastHeartbeat}</span>
              </div>
            )}
          </div>

          <button
            onClick={() => {
              triggerHaptic(40);
              onToggleBackgroundDaemon();
            }}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 shrink-0 transition-all shadow-lg active:scale-95 ${
              bgState.isEnabled
                ? "bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40"
                : "bg-emerald-500 hover:bg-emerald-400 text-slate-950"
            }`}
          >
            {bgState.isEnabled ? (
              <>
                <Square size={13} className="fill-current" />
                <span>Stop Service</span>
              </>
            ) : (
              <>
                <Play size={13} className="fill-current" />
                <span>Start Background</span>
              </>
            )}
          </button>
        </div>

        {/* 4 Core Background Capabilities Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* 1. Wake-Word Continuous Voice */}
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between gap-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div
                  className={`p-2 rounded-xl ${
                    bgState.wakeWordListening
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-white/10 text-white/60"
                  }`}
                >
                  <Mic size={16} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white">
                    "Hey Mara" Background Mic
                  </h3>
                  <p className="text-[10px] text-white/50">
                    Continuous voice recognition
                  </p>
                </div>
              </div>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                  bgState.wakeWordListening
                    ? "bg-emerald-500/20 text-emerald-300"
                    : "bg-white/10 text-white/40"
                }`}
              >
                {bgState.wakeWordListening ? "LISTENING" : "OFF"}
              </span>
            </div>
            <button
              onClick={() => {
                triggerHaptic(30);
                onToggleWakeWord();
              }}
              className={`w-full py-2 rounded-xl text-xs font-semibold transition-all ${
                bgState.wakeWordListening
                  ? "bg-emerald-500 text-slate-950"
                  : "bg-white/10 hover:bg-white/15 text-white"
              }`}
            >
              {bgState.wakeWordListening
                ? "Disable Background Voice"
                : 'Enable "Hey Mara" Auto-Listen'}
            </button>
          </div>

          {/* 2. Floating Picture-in-Picture Overlay */}
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between gap-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div
                  className={`p-2 rounded-xl ${
                    bgState.pipActive
                      ? "bg-cyan-500/20 text-cyan-400"
                      : "bg-white/10 text-white/60"
                  }`}
                >
                  <Layers size={16} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white">
                    Floating Overlay Window
                  </h3>
                  <p className="text-[10px] text-white/50">
                    Display over other Android apps
                  </p>
                </div>
              </div>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                  bgState.pipActive
                    ? "bg-cyan-500/20 text-cyan-300"
                    : "bg-white/10 text-white/40"
                }`}
              >
                {bgState.pipActive ? "FLOATING" : "READY"}
              </span>
            </div>
            <button
              onClick={() => {
                triggerHaptic(30);
                onToggleFloatingPiP();
              }}
              className="w-full py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
            >
              <ExternalLink size={13} />
              <span>{bgState.pipActive ? "Close Floating HUD" : "Pop-Out Floating Mara"}</span>
            </button>
          </div>

          {/* 3. Screen Wake Lock & MediaSession */}
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                  <Lock size={16} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white">
                    WakeLock & Lock-Screen
                  </h3>
                  <p className="text-[10px] text-white/50">
                    Prevents Android CPU sleep
                  </p>
                </div>
              </div>
              <CheckCircle2 size={16} className="text-emerald-400" />
            </div>
            <p className="text-[11px] text-white/60">
              Hardware WakeLock & MediaSession controls active in Android notification bar.
            </p>
          </div>

          {/* 4. All Android Apps Access Permission */}
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
                  <ShieldCheck size={16} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white">
                    All Apps Access Bridge
                  </h3>
                  <p className="text-[10px] text-white/50">
                    QUERY_ALL_PACKAGES Granted
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                {ALL_ANDROID_APPS.length} APPS
              </span>
            </div>
            <button
              onClick={() => {
                onClose();
                onOpenAllApps();
              }}
              className="w-full py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 text-xs font-semibold transition-all"
            >
              Browse All {ALL_ANDROID_APPS.length} Android Apps →
            </button>
          </div>
        </div>

        {/* Background Notifications Permission */}
        {!bgState.notificationsGranted && (
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Bell size={16} className="text-amber-400 shrink-0" />
              <span className="text-xs text-amber-200">
                Allow Android Notifications so Mara can alert you while running in the background.
              </span>
            </div>
            <button
              onClick={onRequestNotifications}
              className="px-3 py-1.5 rounded-xl bg-amber-400 text-slate-950 font-bold text-xs shrink-0"
            >
              Allow
            </button>
          </div>
        )}

        {/* Live Background Daemon Event Log */}
        <div className="bg-black/60 border border-white/10 rounded-2xl p-3.5 space-y-2">
          <div className="flex items-center justify-between text-[11px] text-white/50 font-mono border-b border-white/10 pb-1.5">
            <span className="flex items-center gap-1.5">
              <Cpu size={12} className="text-emerald-400" />
              BACKGROUND DAEMON LOGS
            </span>
            <span>PID: 4821 • SERVICE_STICKY</span>
          </div>
          <div className="max-h-32 overflow-y-auto space-y-1.5 pr-1 font-mono text-[11px]">
            {bgState.backgroundEvents.map((ev) => (
              <div key={ev.id} className="flex items-start gap-2 text-white/75">
                <span className="text-white/35 shrink-0">[{ev.time}]</span>
                <span
                  className={
                    ev.type === "voice"
                      ? "text-emerald-300"
                      : ev.type === "app"
                      ? "text-cyan-300"
                      : "text-white/80"
                  }
                >
                  {ev.event}
                </span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

import { useState, useEffect, type FormEvent } from "react";
import { motion } from "motion/react";
import { 
  X, 
  Clock, 
  AlarmClock, 
  Hourglass, 
  Timer, 
  Plus, 
  Trash2, 
  Play, 
  Pause, 
  RotateCcw, 
  BellRing,
  Volume2
} from "lucide-react";
import { AlarmItem, TimerItem } from "../types";
import { playSynthesizedSound, triggerHaptic } from "../services/androidService";

interface ClockModalProps {
  alarms: AlarmItem[];
  onClose: () => void;
  onToggleAlarm: (id: string) => void;
  onAddAlarm: (time: string, label: string) => void;
  onDeleteAlarm: (id: string) => void;
}

export default function AndroidClockModal({
  alarms,
  onClose,
  onToggleAlarm,
  onAddAlarm,
  onDeleteAlarm,
}: ClockModalProps) {
  const [activeTab, setActiveTab] = useState<"alarm" | "timer" | "stopwatch">("alarm");

  // Alarm state
  const [newAlarmTime, setNewAlarmTime] = useState("07:00");
  const [newAlarmLabel, setNewAlarmLabel] = useState("");
  const [showAddAlarm, setShowAddAlarm] = useState(false);

  // Timer state
  const [timerSeconds, setTimerSeconds] = useState(300); // 5 min
  const [timerRemaining, setTimerRemaining] = useState(300);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Stopwatch state
  const [stopwatchMs, setStopwatchMs] = useState(0);
  const [isStopwatchRunning, setIsStopwatchRunning] = useState(false);
  const [laps, setLaps] = useState<number[]>([]);

  // Timer interval
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && timerRemaining > 0) {
      interval = setInterval(() => {
        setTimerRemaining((prev) => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            playSynthesizedSound("alarm");
            triggerHaptic([300, 100, 300, 100, 300]);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerRemaining]);

  // Stopwatch interval
  useEffect(() => {
    let interval: any = null;
    if (isStopwatchRunning) {
      interval = setInterval(() => {
        setStopwatchMs((prev) => prev + 10);
      }, 10);
    }
    return () => clearInterval(interval);
  }, [isStopwatchRunning]);

  const handleSaveAlarm = (e: FormEvent) => {
    e.preventDefault();
    if (!newAlarmTime) return;
    onAddAlarm(newAlarmTime, newAlarmLabel.trim() || "Alarm");
    setNewAlarmLabel("");
    setShowAddAlarm(false);
    triggerHaptic(40);
  };

  const formatTimer = (totalSec: number) => {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const formatStopwatch = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    const mill = Math.floor((ms % 1000) / 10);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}.${mill.toString().padStart(2, "0")}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 text-white">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md bg-slate-950 border border-amber-500/30 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Clock size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Android Clock & Alarms</h2>
              <p className="text-[11px] text-white/50">Schedule, Timers & Stopwatch</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-1 p-1 bg-white/5 rounded-2xl border border-white/10">
          <button
            onClick={() => setActiveTab("alarm")}
            className={`flex-1 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === "alarm" ? "bg-amber-500 text-slate-950 shadow-md" : "text-white/70 hover:text-white"
            }`}
          >
            <AlarmClock size={14} />
            <span>Alarms</span>
          </button>
          <button
            onClick={() => setActiveTab("timer")}
            className={`flex-1 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === "timer" ? "bg-amber-500 text-slate-950 shadow-md" : "text-white/70 hover:text-white"
            }`}
          >
            <Hourglass size={14} />
            <span>Timer</span>
          </button>
          <button
            onClick={() => setActiveTab("stopwatch")}
            className={`flex-1 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === "stopwatch" ? "bg-amber-500 text-slate-950 shadow-md" : "text-white/70 hover:text-white"
            }`}
          >
            <Timer size={14} />
            <span>Stopwatch</span>
          </button>
        </div>

        {/* TAB 1: ALARMS */}
        {activeTab === "alarm" && (
          <div className="flex flex-col gap-3 flex-1 overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white/70">Scheduled Alarms</span>
              <div className="flex gap-2">
                <button
                  onClick={() => { playSynthesizedSound("alarm"); triggerHaptic([100, 50, 100]); }}
                  className="px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 text-[11px] flex items-center gap-1"
                  title="Test Ringtone Audio"
                >
                  <Volume2 size={12} />
                  <span>Test Audio</span>
                </button>
                <button
                  onClick={() => setShowAddAlarm(!showAddAlarm)}
                  className="px-2.5 py-1 rounded-xl bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/30 text-[11px] flex items-center gap-1 font-semibold"
                >
                  <Plus size={12} />
                  <span>New</span>
                </button>
              </div>
            </div>

            {/* Add Alarm Box */}
            {showAddAlarm && (
              <form onSubmit={handleSaveAlarm} className="p-3 rounded-2xl bg-amber-950/40 border border-amber-500/40 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={newAlarmTime}
                    onChange={(e) => setNewAlarmTime(e.target.value)}
                    className="px-3 py-1.5 rounded-xl bg-white/10 text-white font-mono text-sm outline-none font-bold"
                    required
                  />
                  <input
                    type="text"
                    value={newAlarmLabel}
                    onChange={(e) => setNewAlarmLabel(e.target.value)}
                    placeholder="Alarm label..."
                    className="flex-1 px-3 py-1.5 rounded-xl bg-white/10 text-white text-xs outline-none"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddAlarm(false)}
                    className="px-3 py-1 rounded-xl bg-white/5 text-xs text-white/60"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3.5 py-1 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
                  >
                    Save Alarm
                  </button>
                </div>
              </form>
            )}

            {/* Alarms List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[340px]">
              {alarms.map((alarm) => (
                <div
                  key={alarm.id}
                  className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                    alarm.enabled
                      ? "bg-white/8 border-amber-500/30"
                      : "bg-white/3 border-white/5 opacity-60"
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold font-mono tracking-wide text-white">{alarm.time}</span>
                      {alarm.enabled && <BellRing size={14} className="text-amber-400 animate-pulse" />}
                    </div>
                    <p className="text-[11px] text-white/60">{alarm.label}</p>
                    <div className="flex gap-1 mt-1">
                      {alarm.days.map((d) => (
                        <span key={d} className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-white/70">
                          {d}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onDeleteAlarm(alarm.id)}
                      className="p-2 rounded-xl text-white/40 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                    {/* Toggle Switch */}
                    <button
                      onClick={() => { onToggleAlarm(alarm.id); triggerHaptic(30); }}
                      className={`w-12 h-6.5 rounded-full p-1 transition-colors flex items-center ${
                        alarm.enabled ? "bg-amber-400 justify-end" : "bg-white/20 justify-start"
                      }`}
                    >
                      <div className={`w-4.5 h-4.5 rounded-full ${alarm.enabled ? "bg-slate-950" : "bg-white"} shadow-md`} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: COUNTDOWN TIMER */}
        {activeTab === "timer" && (
          <div className="flex flex-col items-center justify-center py-6 gap-6">
            <div className="relative w-48 h-48 rounded-full border-4 border-amber-500/30 flex flex-col items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.15)]">
              <span className="text-4xl font-bold font-mono text-white tracking-widest">
                {formatTimer(timerRemaining)}
              </span>
              <span className="text-[11px] text-amber-400 font-medium uppercase mt-1">
                {isTimerRunning ? "Countdown Running" : timerRemaining === 0 ? "Timer Ended!" : "Paused"}
              </span>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  setTimerRemaining(timerSeconds);
                  setIsTimerRunning(false);
                  triggerHaptic(30);
                }}
                className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                title="Reset Timer"
              >
                <RotateCcw size={20} />
              </button>

              <button
                onClick={() => {
                  setIsTimerRunning(!isTimerRunning);
                  triggerHaptic(40);
                }}
                className="w-16 h-16 rounded-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold flex items-center justify-center shadow-lg transition-transform active:scale-95"
              >
                {isTimerRunning ? <Pause size={24} /> : <Play size={24} className="ml-1" />}
              </button>

              <div className="flex flex-col gap-1">
                <button
                  onClick={() => { setTimerSeconds(180); setTimerRemaining(180); setIsTimerRunning(false); }}
                  className="px-2.5 py-1 rounded-lg bg-white/10 text-[10px] text-white/80 hover:bg-white/20"
                >
                  3 min
                </button>
                <button
                  onClick={() => { setTimerSeconds(300); setTimerRemaining(300); setIsTimerRunning(false); }}
                  className="px-2.5 py-1 rounded-lg bg-white/10 text-[10px] text-white/80 hover:bg-white/20"
                >
                  5 min
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: STOPWATCH */}
        {activeTab === "stopwatch" && (
          <div className="flex flex-col items-center gap-5 py-4">
            <div className="text-4xl font-bold font-mono text-white tracking-wider">
              {formatStopwatch(stopwatchMs)}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setIsStopwatchRunning(!isStopwatchRunning);
                  triggerHaptic(40);
                }}
                className="px-6 py-2.5 rounded-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md"
              >
                {isStopwatchRunning ? <Pause size={16} /> : <Play size={16} />}
                <span>{isStopwatchRunning ? "Pause" : "Start"}</span>
              </button>

              {isStopwatchRunning && (
                <button
                  onClick={() => {
                    setLaps(prev => [stopwatchMs, ...prev]);
                    triggerHaptic(20);
                  }}
                  className="px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-medium text-xs"
                >
                  Lap
                </button>
              )}

              <button
                onClick={() => {
                  setIsStopwatchRunning(false);
                  setStopwatchMs(0);
                  setLaps([]);
                  triggerHaptic(20);
                }}
                className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white/70"
                title="Reset"
              >
                <RotateCcw size={16} />
              </button>
            </div>

            {/* Lap list */}
            {laps.length > 0 && (
              <div className="w-full max-h-40 overflow-y-auto space-y-1.5 border-t border-white/10 pt-3">
                {laps.map((lap, i) => (
                  <div key={i} className="flex justify-between text-xs px-2 text-white/70 font-mono">
                    <span>Lap {laps.length - i}</span>
                    <span className="text-amber-400 font-bold">{formatStopwatch(lap)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}

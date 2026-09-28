import { useState, useEffect } from "react";
import {
  Wifi,
  Battery,
  BatteryCharging,
  SlidersHorizontal,
  Smartphone,
  Volume2,
  VolumeX,
  Trash2,
  Radio,
  Zap,
  Activity,
  Grid,
} from "lucide-react";
import { AndroidDeviceState } from "../types";
import { PWAInstallButton } from "./PWAInstallButton";
import { ALL_ANDROID_APPS } from "../services/allAppsService";

interface AndroidHeaderProps {
  deviceState: AndroidDeviceState;
  isMuted: boolean;
  bgActive: boolean;
  wakeWordActive: boolean;
  onToggleMute: () => void;
  onOpenQuickSettings: () => void;
  onOpenDeviceHub: () => void;
  onOpenBackgroundHub: () => void;
  onOpenAppDrawer: () => void;
  onClearHistory: () => void;
  hasMessages: boolean;
}

export default function AndroidHeader({
  deviceState,
  isMuted,
  bgActive,
  wakeWordActive,
  onToggleMute,
  onOpenQuickSettings,
  onOpenDeviceHub,
  onOpenBackgroundHub,
  onOpenAppDrawer,
  onClearHistory,
  hasMessages,
}: AndroidHeaderProps) {
  const [currentTime, setCurrentTime] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="absolute top-0 left-0 w-full z-30 shrink-0 flex flex-col bg-gradient-to-b from-black/95 via-black/60 to-transparent backdrop-blur-xs pb-3">
      {/* Native Android Status Bar */}
      <div className="w-full px-3 sm:px-6 py-1.5 flex items-center justify-between text-[11px] sm:text-xs font-mono text-white/80 border-b border-white/5">
        {/* Left: Time, Network & Background Daemon Pill */}
        <div className="flex items-center gap-2">
          <span className="font-semibold text-white tracking-wider">
            {currentTime || "12:00"}
          </span>

          <button
            onClick={onOpenBackgroundHub}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] transition-all ${
              bgActive
                ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
                : "bg-white/5 border-white/15 text-white/60"
            }`}
            title="Android Background Service Status"
          >
            <Activity size={10} className={bgActive ? "animate-pulse text-emerald-400" : ""} />
            <span>{bgActive ? "BG Running" : "BG Standby"}</span>
            {wakeWordActive && <span className="text-cyan-300">• Mic ON</span>}
          </button>

          <div className="hidden sm:flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/70 text-[10px]">
            <Radio size={10} className="text-emerald-400" />
            <span>{deviceState.network.type}</span>
          </div>
        </div>

        {/* Right: All Apps Badge, Android 15 Badge, Wi-Fi, Battery */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          <button
            onClick={onOpenAppDrawer}
            className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 transition-colors text-[10px] border border-cyan-500/30"
            title="All Android Apps Access"
          >
            <Grid size={10} />
            <span className="font-semibold">{ALL_ANDROID_APPS.length} Apps</span>
          </button>

          <button
            onClick={onOpenDeviceHub}
            className="hidden xs:flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/10 hover:bg-emerald-500/20 hover:text-emerald-300 transition-colors text-[10px] text-white/90 border border-white/10"
            title="Open Android OS Device Hub"
          >
            <Smartphone size={11} className="text-emerald-400" />
            <span className="font-semibold">Android {deviceState.androidVersionNumber}</span>
          </button>

          <div
            className="flex items-center gap-1.5"
            title={`${deviceState.network.ssid} (${deviceState.network.speedMbps} Mbps)`}
          >
            <Wifi
              size={13}
              className={deviceState.network.online ? "text-white/90" : "text-rose-400"}
            />
          </div>

          <div
            className="flex items-center gap-1"
            title={`Battery: ${deviceState.battery.level}% ${
              deviceState.battery.isCharging ? "(Charging)" : ""
            }`}
          >
            <span className="text-[11px] font-semibold">{deviceState.battery.level}%</span>
            {deviceState.battery.isCharging ? (
              <BatteryCharging size={14} className="text-emerald-400" />
            ) : (
              <Battery
                size={14}
                className={
                  deviceState.battery.level <= 20
                    ? "text-rose-400 animate-pulse"
                    : "text-white/90"
                }
              />
            )}
          </div>
        </div>
      </div>

      {/* Main Assistant Navigation Bar */}
      <div className="w-full px-3 sm:px-8 pt-2 flex items-center justify-between gap-2">
        {/* Mara Logo & Status */}
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-400 flex items-center justify-center font-bold text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
              <Zap size={18} className="fill-slate-950" />
            </div>
            {bgActive && (
              <div
                className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-black flex items-center justify-center"
                title="Background Daemon Active"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                Mara
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  AI
                </span>
              </h1>
            </div>
            <p className="text-[10px] sm:text-[11px] text-white/50 flex items-center gap-1.5">
              <span>Background Active • All {ALL_ANDROID_APPS.length} Apps Access</span>
            </p>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* In-App PWA Install Button */}
          <PWAInstallButton />

          {/* Background Service Control Hub */}
          <button
            onClick={onOpenBackgroundHub}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border transition-all text-xs font-medium ${
              bgActive
                ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/35 hover:bg-emerald-500/25"
                : "bg-white/5 text-white/70 border-white/10 hover:bg-white/10"
            }`}
            title="Background Execution & Floating Overlay Settings"
          >
            <Activity size={14} className={bgActive ? "text-emerald-400" : ""} />
            <span className="hidden lg:inline">Background</span>
          </button>

          {/* Quick Settings Drawer Toggle */}
          <button
            onClick={onOpenQuickSettings}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/10 transition-all text-xs font-medium"
            title="Android Quick Settings"
          >
            <SlidersHorizontal size={14} className="text-emerald-400" />
            <span className="hidden sm:inline">Quick Tiles</span>
          </button>

          {/* Clear Chat */}
          {hasMessages && (
            <button
              onClick={onClearHistory}
              className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/20 hover:text-rose-400 text-white/70 border border-white/10 transition-colors"
              title="Clear Conversation History"
            >
              <Trash2 size={15} />
            </button>
          )}

          {/* Mute Audio */}
          <button
            onClick={onToggleMute}
            className={`p-2 rounded-xl border transition-colors ${
              isMuted
                ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                : "bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border-white/10"
            }`}
            title={isMuted ? "Unmute Voice" : "Mute Voice"}
          >
            {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
          </button>
        </div>
      </div>
    </header>
  );
}

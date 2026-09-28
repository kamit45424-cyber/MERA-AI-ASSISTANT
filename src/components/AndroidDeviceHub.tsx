import { useState } from "react";
import { motion } from "motion/react";
import { 
  X, 
  Smartphone, 
  Battery, 
  BatteryCharging, 
  Cpu, 
  HardDrive, 
  Radio, 
  MapPin, 
  Compass, 
  Eye, 
  RefreshCw, 
  CheckCircle2, 
  Layers, 
  Sparkles,
  ExternalLink,
  Copy,
  Sliders
} from "lucide-react";
import { AndroidDeviceState } from "../types";
import { copyToClipboard, triggerHaptic } from "../services/androidService";

interface DeviceHubProps {
  deviceState: AndroidDeviceState;
  onClose: () => void;
  onRefreshTelemetry: () => void;
  onChangeAndroidVersion: (versionNum: number) => void;
}

export default function AndroidDeviceHub({
  deviceState,
  onClose,
  onRefreshTelemetry,
  onChangeAndroidVersion,
}: DeviceHubProps) {
  const [activeTab, setActiveTab] = useState<"system" | "hardware" | "sensors" | "location">("system");
  const [copied, setCopied] = useState(false);

  const handleCopySpecs = async () => {
    const specs = `Android Device Status:
OS: Android ${deviceState.androidVersionNumber} (API ${deviceState.apiLevel})
Model: ${deviceState.deviceModel}
Battery: ${deviceState.battery.level}% (${deviceState.battery.health}, ${deviceState.battery.temperature}°C)
Network: ${deviceState.network.type} - ${deviceState.network.ssid}
RAM: ${deviceState.ram.usedGB}GB / ${deviceState.ram.totalGB}GB
Storage: ${deviceState.storage.usedGB}GB / ${deviceState.storage.totalGB}GB
Location: ${deviceState.location.city}, ${deviceState.location.address}`;
    await copyToClipboard(specs);
    setCopied(true);
    triggerHaptic(40);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 text-white">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl bg-slate-950 border border-emerald-500/30 rounded-3xl p-5 sm:p-7 shadow-2xl flex flex-col gap-4 max-h-[92vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Smartphone size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-white">Android System & Device Hub</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-semibold">
                  API {deviceState.apiLevel}
                </span>
              </div>
              <p className="text-xs text-white/50">{deviceState.deviceModel} • Full Mobile Access</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopySpecs}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 text-xs flex items-center gap-1 transition-colors"
              title="Copy Specs"
            >
              {copied ? <CheckCircle2 size={16} className="text-emerald-400" /> : <Copy size={16} />}
              <span className="hidden sm:inline">{copied ? "Copied" : "Copy"}</span>
            </button>
            <button
              onClick={onRefreshTelemetry}
              className="p-2 rounded-xl bg-white/5 hover:bg-emerald-500/20 text-white/70 hover:text-emerald-300 border border-white/10 transition-colors"
              title="Refresh Telemetry"
            >
              <RefreshCw size={16} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 p-1 bg-white/5 rounded-2xl border border-white/10">
          <button
            onClick={() => setActiveTab("system")}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "system"
                ? "bg-emerald-500 text-slate-950 shadow-md"
                : "text-white/70 hover:text-white hover:bg-white/5"
            }`}
          >
            <Layers size={14} />
            <span>Android OS</span>
          </button>
          <button
            onClick={() => setActiveTab("hardware")}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "hardware"
                ? "bg-emerald-500 text-slate-950 shadow-md"
                : "text-white/70 hover:text-white hover:bg-white/5"
            }`}
          >
            <Cpu size={14} />
            <span>Hardware</span>
          </button>
          <button
            onClick={() => setActiveTab("sensors")}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "sensors"
                ? "bg-emerald-500 text-slate-950 shadow-md"
                : "text-white/70 hover:text-white hover:bg-white/5"
            }`}
          >
            <Compass size={14} />
            <span>Sensors</span>
          </button>
          <button
            onClick={() => setActiveTab("location")}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "location"
                ? "bg-emerald-500 text-slate-950 shadow-md"
                : "text-white/70 hover:text-white hover:bg-white/5"
            }`}
          >
            <MapPin size={14} />
            <span>GPS Map</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4">
          {/* TAB 1: ANDROID OS */}
          {activeTab === "system" && (
            <div className="space-y-4">
              {/* Android Version Selector */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-teal-950/40 border border-emerald-500/30 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-emerald-400 font-mono uppercase tracking-wider">Operating System</span>
                    <h3 className="text-lg font-bold text-white">{deviceState.osVersion}</h3>
                  </div>
                  <div className="px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
                    Android {deviceState.androidVersionNumber}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/10">
                  <button
                    onClick={() => onChangeAndroidVersion(15)}
                    className={`py-2 px-3 rounded-xl text-xs font-medium border transition-all ${
                      deviceState.androidVersionNumber === 15
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50"
                        : "bg-white/5 text-white/70 border-white/10 hover:bg-white/10"
                    }`}
                  >
                    Android 15 (Latest)
                  </button>
                  <button
                    onClick={() => onChangeAndroidVersion(14)}
                    className={`py-2 px-3 rounded-xl text-xs font-medium border transition-all ${
                      deviceState.androidVersionNumber === 14
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50"
                        : "bg-white/5 text-white/70 border-white/10 hover:bg-white/10"
                    }`}
                  >
                    Android 14 (Stable)
                  </button>
                  <button
                    onClick={() => onChangeAndroidVersion(16)}
                    className={`py-2 px-3 rounded-xl text-xs font-medium border transition-all ${
                      deviceState.androidVersionNumber === 16
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50"
                        : "bg-white/5 text-white/70 border-white/10 hover:bg-white/10"
                    }`}
                  >
                    Android 16 (Preview)
                  </button>
                </div>
              </div>

              {/* OS Properties Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                  <span className="text-[10px] text-white/50 block">API Level</span>
                  <span className="text-sm font-bold text-white font-mono">{deviceState.apiLevel}</span>
                </div>
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                  <span className="text-[10px] text-white/50 block">Build ID</span>
                  <span className="text-xs font-bold text-white font-mono">{deviceState.buildNumber}</span>
                </div>
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                  <span className="text-[10px] text-white/50 block">Security Patch</span>
                  <span className="text-xs font-bold text-emerald-400 font-mono">August 2026</span>
                </div>
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                  <span className="text-[10px] text-white/50 block">Linux Kernel</span>
                  <span className="text-xs font-bold text-white font-mono">6.6.48-android</span>
                </div>
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                  <span className="text-[10px] text-white/50 block">SELinux Status</span>
                  <span className="text-xs font-bold text-emerald-400 font-mono">Enforcing</span>
                </div>
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                  <span className="text-[10px] text-white/50 block">Assistant Engine</span>
                  <span className="text-xs font-bold text-cyan-400 font-mono">Mara Gemini Core</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: HARDWARE (BATTERY, RAM, STORAGE, NETWORK) */}
          {activeTab === "hardware" && (
            <div className="space-y-3">
              {/* Battery Module */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {deviceState.battery.isCharging ? (
                      <BatteryCharging size={20} className="text-emerald-400" />
                    ) : (
                      <Battery size={20} className="text-emerald-400" />
                    )}
                    <span className="text-sm font-bold text-white">Battery & Power</span>
                  </div>
                  <span className="text-lg font-bold font-mono text-emerald-400">{deviceState.battery.level}%</span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2.5 rounded-full bg-white/10 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all"
                    style={{ width: `${deviceState.battery.level}%` }}
                  />
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs pt-1">
                  <div>
                    <span className="text-[10px] text-white/50 block">State</span>
                    <span className="font-semibold text-white">
                      {deviceState.battery.isCharging ? "⚡ Fast Charging" : "Discharging"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-white/50 block">Health</span>
                    <span className="font-semibold text-emerald-400">{deviceState.battery.health}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-white/50 block">Temperature</span>
                    <span className="font-semibold text-white">{deviceState.battery.temperature}°C</span>
                  </div>
                </div>
              </div>

              {/* RAM & Storage */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* RAM */}
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold flex items-center gap-1.5 text-white">
                      <Cpu size={14} className="text-cyan-400" />
                      LPDDR5X RAM
                    </span>
                    <span className="font-mono text-cyan-400">
                      {deviceState.ram.usedGB} / {deviceState.ram.totalGB} GB
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                    <div 
                      className="h-full bg-cyan-400 rounded-full"
                      style={{ width: `${(deviceState.ram.usedGB / deviceState.ram.totalGB) * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-white/50">{(deviceState.ram.totalGB - deviceState.ram.usedGB).toFixed(1)} GB Available</span>
                </div>

                {/* Storage */}
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold flex items-center gap-1.5 text-white">
                      <HardDrive size={14} className="text-purple-400" />
                      UFS 4.0 Storage
                    </span>
                    <span className="font-mono text-purple-400">
                      {deviceState.storage.usedGB} / {deviceState.storage.totalGB} GB
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                    <div 
                      className="h-full bg-purple-400 rounded-full"
                      style={{ width: `${(deviceState.storage.usedGB / deviceState.storage.totalGB) * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-white/50">{(deviceState.storage.totalGB - deviceState.storage.usedGB).toFixed(1)} GB Free</span>
                </div>
              </div>

              {/* Network Status */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold flex items-center gap-1.5 text-white">
                    <Radio size={14} className="text-emerald-400" />
                    Network & Bandwidth
                  </span>
                  <span className="font-mono text-emerald-400 font-semibold">{deviceState.network.speedMbps} Mbps</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs pt-1">
                  <div>
                    <span className="text-[10px] text-white/50 block">Access Point</span>
                    <span className="font-semibold text-white truncate block">{deviceState.network.ssid}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-white/50 block">Cellular</span>
                    <span className="font-semibold text-teal-300">{deviceState.network.type} VoLTE</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-white/50 block">IP Address</span>
                    <span className="font-semibold text-white font-mono">{deviceState.network.ipAddress}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SENSORS (GYRO, COMPASS, HAPTICS) */}
          {activeTab === "sensors" && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center text-center">
                  <span className="text-[10px] text-white/50 uppercase">Compass Heading</span>
                  <span className="text-xl font-bold font-mono text-amber-400 my-1">{deviceState.sensors.alpha}°</span>
                  <span className="text-[10px] text-emerald-400">North-East</span>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center text-center">
                  <span className="text-[10px] text-white/50 uppercase">Pitch (Beta)</span>
                  <span className="text-xl font-bold font-mono text-cyan-400 my-1">{deviceState.sensors.beta}°</span>
                  <span className="text-[10px] text-white/50">Front/Back Tilt</span>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center text-center">
                  <span className="text-[10px] text-white/50 uppercase">Roll (Gamma)</span>
                  <span className="text-xl font-bold font-mono text-purple-400 my-1">{deviceState.sensors.gamma}°</span>
                  <span className="text-[10px] text-white/50">Left/Right Tilt</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-white">Ambient Light Sensor</span>
                  <span className="font-mono text-yellow-300">420 Lux (Indoor Balanced)</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-white">Proximity Sensor</span>
                  <span className="font-mono text-emerald-400">Far (No obstruction)</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-white">Haptic Linear Motor</span>
                  <span className="font-mono text-cyan-400">X-Axis Haptic Active</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: GPS MAP & LOCATION */}
          {activeTab === "location" && (
            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin size={18} className="text-rose-400" />
                    <div>
                      <h4 className="text-sm font-bold text-white">{deviceState.location.city}</h4>
                      <p className="text-[11px] text-white/60">{deviceState.location.address}</p>
                    </div>
                  </div>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${deviceState.location.latitude},${deviceState.location.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-xl bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/40 text-xs flex items-center gap-1 transition-colors"
                  >
                    <span>Maps</span>
                    <ExternalLink size={12} />
                  </a>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs pt-2 border-t border-white/10 font-mono">
                  <div>
                    <span className="text-[10px] text-white/50 block font-sans">Latitude</span>
                    <span className="text-emerald-400 font-bold">{deviceState.location.latitude?.toFixed(4)}° N</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-white/50 block font-sans">Longitude</span>
                    <span className="text-emerald-400 font-bold">{deviceState.location.longitude?.toFixed(4)}° E</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-white/50 block font-sans">Accuracy</span>
                    <span className="text-cyan-400 font-bold">±{deviceState.location.accuracy || 5} meters</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

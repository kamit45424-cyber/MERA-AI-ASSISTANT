import { motion } from "motion/react";
import { 
  X, 
  Flashlight, 
  Wifi, 
  Bluetooth, 
  BatteryMedium, 
  BellOff, 
  RotateCw, 
  Radio, 
  MapPin, 
  Sun, 
  Volume2, 
  VolumeX, 
  Smartphone, 
  Camera, 
  Phone, 
  Clock, 
  Grid, 
  Sparkles,
  Vibrate,
  Copy
} from "lucide-react";
import { AndroidDeviceState } from "../types";
import { triggerHaptic } from "../services/androidService";

interface QuickSettingsProps {
  deviceState: AndroidDeviceState;
  onClose: () => void;
  onToggleTorch: () => void;
  onToggleWifi: () => void;
  onToggleBluetooth: () => void;
  onTogglePowerSaver: () => void;
  onToggleDnd: () => void;
  onToggleAutoRotate: () => void;
  onToggleHotspot: () => void;
  onToggleLocation: () => void;
  onTriggerVibration: () => void;
  onToggleScreenTorch: () => void;
  onSetBrightness: (val: number) => void;
  onSetVolume: (val: number) => void;
  onOpenDeviceHub: () => void;
  onOpenCamera: () => void;
  onOpenDialer: () => void;
  onOpenClock: () => void;
  onOpenApps: () => void;
  onCopyClipboardStatus: () => void;
}

export default function AndroidQuickSettings({
  deviceState,
  onClose,
  onToggleTorch,
  onToggleWifi,
  onToggleBluetooth,
  onTogglePowerSaver,
  onToggleDnd,
  onToggleAutoRotate,
  onToggleHotspot,
  onToggleLocation,
  onTriggerVibration,
  onToggleScreenTorch,
  onSetBrightness,
  onSetVolume,
  onOpenDeviceHub,
  onOpenCamera,
  onOpenDialer,
  onOpenClock,
  onOpenApps,
  onCopyClipboardStatus,
}: QuickSettingsProps) {

  const handleTileClick = (action: () => void) => {
    triggerHaptic(40);
    action();
  };

  const tiles = [
    {
      id: "torch",
      label: "Flashlight",
      subLabel: deviceState.torch ? "On" : "Off",
      icon: Flashlight,
      active: deviceState.torch,
      onClick: onToggleTorch,
      activeColor: "bg-amber-400 text-slate-950 font-bold",
    },
    {
      id: "wifi",
      label: "Internet",
      subLabel: deviceState.network.online ? deviceState.network.ssid : "Off",
      icon: Wifi,
      active: deviceState.network.online,
      onClick: onToggleWifi,
      activeColor: "bg-emerald-400 text-slate-950 font-bold",
    },
    {
      id: "bluetooth",
      label: "Bluetooth",
      subLabel: deviceState.bluetooth ? "Connected" : "Off",
      icon: Bluetooth,
      active: deviceState.bluetooth,
      onClick: onToggleBluetooth,
      activeColor: "bg-blue-400 text-slate-950 font-bold",
    },
    {
      id: "powersaver",
      label: "Battery Saver",
      subLabel: deviceState.battery.powerSaver ? "Active" : `${deviceState.battery.level}%`,
      icon: BatteryMedium,
      active: deviceState.battery.powerSaver,
      onClick: onTogglePowerSaver,
      activeColor: "bg-amber-500 text-slate-950 font-bold",
    },
    {
      id: "dnd",
      label: "Do Not Disturb",
      subLabel: deviceState.dndActive ? "Priority only" : "Off",
      icon: BellOff,
      active: deviceState.dndActive,
      onClick: onToggleDnd,
      activeColor: "bg-rose-400 text-slate-950 font-bold",
    },
    {
      id: "screenTorch",
      label: "Screen Torch",
      subLabel: "Max White Light",
      icon: Sparkles,
      active: false,
      onClick: onToggleScreenTorch,
      activeColor: "bg-yellow-300 text-slate-950 font-bold",
    },
    {
      id: "location",
      label: "GPS Location",
      subLabel: deviceState.location.enabled ? deviceState.location.city : "Off",
      icon: MapPin,
      active: deviceState.location.enabled,
      onClick: onToggleLocation,
      activeColor: "bg-teal-400 text-slate-950 font-bold",
    },
    {
      id: "vibrate",
      label: "Vibrate Pulse",
      subLabel: "Haptic Check",
      icon: Vibrate,
      active: false,
      onClick: onTriggerVibration,
      activeColor: "bg-purple-400 text-slate-950 font-bold",
    },
    {
      id: "autorotate",
      label: "Auto-Rotate",
      subLabel: deviceState.autoRotate ? "On" : "Locked",
      icon: RotateCw,
      active: deviceState.autoRotate,
      onClick: onToggleAutoRotate,
      activeColor: "bg-indigo-400 text-slate-950 font-bold",
    },
    {
      id: "hotspot",
      label: "Hotspot",
      subLabel: deviceState.hotspot ? "Mara_5G_Hub" : "Off",
      icon: Radio,
      active: deviceState.hotspot,
      onClick: onToggleHotspot,
      activeColor: "bg-cyan-400 text-slate-950 font-bold",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center items-center bg-black/70 backdrop-blur-md p-0 sm:p-4">
      <motion.div
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -60, opacity: 0 }}
        className="w-full max-w-lg bg-slate-950/95 border border-white/15 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto text-white"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Smartphone size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Android 15 Control Center</h2>
              <p className="text-[11px] text-white/50">{deviceState.deviceModel} • Quick Access Tiles</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Sliders: Brightness & Volume */}
        <div className="space-y-3 bg-white/5 p-3.5 rounded-2xl border border-white/10">
          {/* Brightness */}
          <div className="flex items-center gap-3">
            <Sun size={18} className="text-amber-400 shrink-0" />
            <div className="flex-1 flex flex-col">
              <div className="flex justify-between text-[11px] font-medium text-white/70 mb-1">
                <span>Display Brightness</span>
                <span className="font-mono">{deviceState.brightness}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                value={deviceState.brightness}
                onChange={(e) => onSetBrightness(parseInt(e.target.value, 10))}
                className="w-full accent-amber-400 bg-white/15 rounded-lg h-2 cursor-pointer"
              />
            </div>
          </div>

          {/* Volume */}
          <div className="flex items-center gap-3">
            {deviceState.isMuted || deviceState.volume === 0 ? (
              <VolumeX size={18} className="text-rose-400 shrink-0" />
            ) : (
              <Volume2 size={18} className="text-cyan-400 shrink-0" />
            )}
            <div className="flex-1 flex flex-col">
              <div className="flex justify-between text-[11px] font-medium text-white/70 mb-1">
                <span>Media & Voice Volume</span>
                <span className="font-mono">{deviceState.isMuted ? "Muted" : `${deviceState.volume}%`}</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={deviceState.isMuted ? 0 : deviceState.volume}
                onChange={(e) => onSetVolume(parseInt(e.target.value, 10))}
                className="w-full accent-cyan-400 bg-white/15 rounded-lg h-2 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Quick Setting Tiles Grid */}
        <div className="grid grid-cols-2 gap-2.5">
          {tiles.map((tile) => {
            const Icon = tile.icon;
            return (
              <button
                key={tile.id}
                onClick={() => handleTileClick(tile.onClick)}
                className={`flex items-center gap-3 p-3 rounded-2xl transition-all text-left border ${
                  tile.active
                    ? `${tile.activeColor} border-transparent shadow-md scale-[1.01]`
                    : "bg-white/5 hover:bg-white/10 text-white/80 border-white/10 hover:border-white/20"
                }`}
              >
                <div
                  className={`p-2 rounded-xl shrink-0 ${
                    tile.active ? "bg-black/15" : "bg-white/10 text-white"
                  }`}
                >
                  <Icon size={18} />
                </div>
                <div className="flex flex-col min-w-0 overflow-hidden">
                  <span className="text-xs font-semibold truncate">{tile.label}</span>
                  <span className="text-[10px] opacity-70 truncate">{tile.subLabel}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Bottom Quick Hub Launchers */}
        <div className="grid grid-cols-5 gap-2 pt-2 border-t border-white/10">
          <button
            onClick={() => { onClose(); onOpenDeviceHub(); }}
            className="flex flex-col items-center gap-1 p-2 rounded-xl bg-white/5 hover:bg-emerald-500/20 text-white/80 hover:text-emerald-300 border border-white/10 transition-colors"
          >
            <Smartphone size={16} className="text-emerald-400" />
            <span className="text-[9px]">OS Hub</span>
          </button>
          <button
            onClick={() => { onClose(); onOpenCamera(); }}
            className="flex flex-col items-center gap-1 p-2 rounded-xl bg-white/5 hover:bg-purple-500/20 text-white/80 hover:text-purple-300 border border-white/10 transition-colors"
          >
            <Camera size={16} className="text-purple-400" />
            <span className="text-[9px]">Camera</span>
          </button>
          <button
            onClick={() => { onClose(); onOpenDialer(); }}
            className="flex flex-col items-center gap-1 p-2 rounded-xl bg-white/5 hover:bg-green-500/20 text-white/80 hover:text-green-300 border border-white/10 transition-colors"
          >
            <Phone size={16} className="text-green-400" />
            <span className="text-[9px]">Dialer</span>
          </button>
          <button
            onClick={() => { onClose(); onOpenClock(); }}
            className="flex flex-col items-center gap-1 p-2 rounded-xl bg-white/5 hover:bg-amber-500/20 text-white/80 hover:text-amber-300 border border-white/10 transition-colors"
          >
            <Clock size={16} className="text-amber-400" />
            <span className="text-[9px]">Clock</span>
          </button>
          <button
            onClick={() => { onClose(); onOpenApps(); }}
            className="flex flex-col items-center gap-1 p-2 rounded-xl bg-white/5 hover:bg-cyan-500/20 text-white/80 hover:text-cyan-300 border border-white/10 transition-colors"
          >
            <Grid size={16} className="text-cyan-400" />
            <span className="text-[9px]">Apps</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}

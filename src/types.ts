export type AppState = "idle" | "listening" | "processing" | "speaking";

export interface ChatMessage {
  id: string;
  sender: "user" | "mara";
  text: string;
  actionSummary?: string;
  actionIcon?: string;
  timestamp: string;
}

export interface AndroidDeviceState {
  osVersion: string;
  androidVersionNumber: number;
  apiLevel: number;
  buildNumber: string;
  deviceModel: string;
  manufacturer: string;
  battery: {
    level: number;
    isCharging: boolean;
    chargingTime: number | null;
    dischargingTime: number | null;
    powerSaver: boolean;
    health: "Good" | "Fair" | "Overheating";
    temperature: number; // in °C
  };
  torch: boolean;
  brightness: number; // 0 - 100
  volume: number; // 0 - 100
  isMuted: boolean;
  network: {
    online: boolean;
    type: "5G" | "4G LTE" | "Wi-Fi 6E" | "Offline";
    ssid: string;
    speedMbps: number;
    ipAddress: string;
  };
  bluetooth: boolean;
  location: {
    enabled: boolean;
    latitude: number | null;
    longitude: number | null;
    city: string;
    address: string;
    accuracy: number | null;
  };
  hapticsEnabled: boolean;
  wakeLockActive: boolean;
  dndActive: boolean;
  autoRotate: boolean;
  hotspot: boolean;
  ram: {
    totalGB: number;
    usedGB: number;
  };
  storage: {
    totalGB: number;
    usedGB: number;
  };
  sensors: {
    alpha: number; // compass heading
    beta: number;  // tilt front/back
    gamma: number; // tilt left/right
  };
}

export interface Contact {
  id: string;
  name: string;
  phone: string;
  email?: string;
  avatarColor: string;
  category: "Family" | "Work" | "Friends" | "Emergency";
  favorite?: boolean;
}

export interface AlarmItem {
  id: string;
  time: string; // "07:00"
  label: string;
  enabled: boolean;
  days: string[];
  isRinging?: boolean;
}

export interface TimerItem {
  id: string;
  durationSec: number;
  remainingSec: number;
  isRunning: boolean;
  label: string;
}

export interface AndroidAppItem {
  id: string;
  name: string;
  category: "Social" | "Media" | "Productivity" | "System" | "Utility";
  iconName: string;
  color: string;
  intentUrl: string;
  fallbackUrl: string;
  description: string;
}

export interface AndroidNotification {
  id: string;
  title: string;
  body: string;
  timestamp?: string;
  appName?: string;
  read?: boolean;
}

export interface CommandExecutionResult {
  actionText: string;
  speechText: string;
  actionType: 
    | "chat"
    | "torch_toggle"
    | "battery_check"
    | "call"
    | "sms"
    | "whatsapp"
    | "alarm_set"
    | "timer_set"
    | "vibrate"
    | "camera_open"
    | "location_check"
    | "device_info"
    | "app_open"
    | "brightness_change"
    | "volume_change"
    | "clipboard_copy"
    | "clipboard_read"
    | "wifi_toggle"
    | "bluetooth_toggle"
    | "powersaver_toggle"
    | "dnd_toggle"
    | "screen_torch";
  payload?: any;
  externalUrl?: string;
}

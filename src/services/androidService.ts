import { AndroidDeviceState, Contact, AlarmItem, AndroidNotification, AndroidAppItem } from "../types";

// Default initial state representing a modern flagship Android 15 device
export const defaultAndroidState: AndroidDeviceState = {
  osVersion: "Android 15 (Upside Down Cake)",
  androidVersionNumber: 15,
  apiLevel: 35,
  buildNumber: "AP2A.240805.005",
  deviceModel: "Galaxy Ultra / Pixel Pro",
  manufacturer: "Google & Android Core",
  battery: {
    level: 84,
    isCharging: false,
    chargingTime: null,
    dischargingTime: 18400,
    powerSaver: false,
    health: "Good",
    temperature: 31.5,
  },
  torch: false,
  brightness: 85,
  volume: 75,
  isMuted: false,
  network: {
    online: true,
    type: "5G",
    ssid: "Airtel_Fiber_5GHz",
    speedMbps: 450,
    ipAddress: "192.168.1.42",
  },
  bluetooth: true,
  location: {
    enabled: true,
    latitude: 28.6139,
    longitude: 77.2090,
    city: "New Delhi",
    address: "Connaught Place, New Delhi, India",
    accuracy: 8,
  },
  hapticsEnabled: true,
  wakeLockActive: false,
  dndActive: false,
  autoRotate: true,
  hotspot: false,
  ram: {
    totalGB: 12,
    usedGB: 4.8,
  },
  storage: {
    totalGB: 256,
    usedGB: 86.4,
  },
  sensors: {
    alpha: 45,
    beta: 12,
    gamma: -4,
  },
};

// Initial Contacts list
export const initialContacts: Contact[] = [
  { id: "c1", name: "Mummy", phone: "+91 98765 43210", category: "Family", avatarColor: "from-pink-500 to-rose-500", favorite: true },
  { id: "c2", name: "Papa", phone: "+91 98112 34567", category: "Family", avatarColor: "from-blue-500 to-indigo-500", favorite: true },
  { id: "c3", name: "Rohit Sharma", phone: "+91 99887 76655", category: "Friends", avatarColor: "from-amber-500 to-orange-500", favorite: true },
  { id: "c4", name: "Priya Verma", phone: "+91 98711 22334", category: "Friends", avatarColor: "from-purple-500 to-pink-500" },
  { id: "c5", name: "Amit Kumar (Boss)", phone: "+91 98223 44556", category: "Work", avatarColor: "from-emerald-500 to-teal-500" },
  { id: "c6", name: "Emergency SOS (112)", phone: "112", category: "Emergency", avatarColor: "from-red-600 to-rose-700", favorite: true },
];

export const sampleContacts = initialContacts;

// Initial Alarms list
export const initialAlarms: AlarmItem[] = [
  { id: "a1", time: "06:30", label: "Morning Workout / Yoga", enabled: true, days: ["Mon", "Tue", "Wed", "Thu", "Fri"] },
  { id: "a2", time: "08:00", label: "Breakfast & News", enabled: true, days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] },
  { id: "a3", time: "09:30", label: "Office Standup Meeting", enabled: false, days: ["Mon", "Tue", "Wed", "Thu", "Fri"] },
  { id: "a4", time: "22:30", label: "Sleep Reminder", enabled: true, days: ["Everyday"] },
];

export const sampleAlarms = initialAlarms;

// Torch hardware track controller
let activeTorchStream: MediaStream | null = null;
let wakeLockSentinel: any = null;

// Hardware Vibration
export function triggerHaptic(pattern: number | number[] = 50) {
  try {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(pattern);
    }
  } catch (e) {
    console.debug("Vibration not supported on this device/environment", e);
  }
}

// Hardware Camera Flashlight / Torch
export async function setHardwareTorch(enable: boolean): Promise<boolean> {
  try {
    if (enable) {
      if (!activeTorchStream) {
        activeTorchStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "environment",
            // @ts-ignore
            advanced: [{ torch: true }],
          },
        });
      }
      const track = activeTorchStream.getVideoTracks()[0];
      // @ts-ignore
      const capabilities = track.getCapabilities?.();
      // @ts-ignore
      if (capabilities?.torch) {
        // @ts-ignore
        await track.applyConstraints({ advanced: [{ torch: true }] });
        return true;
      }
      return true;
    } else {
      if (activeTorchStream) {
        activeTorchStream.getTracks().forEach((track) => {
          try {
            // @ts-ignore
            track.applyConstraints({ advanced: [{ torch: false }] });
          } catch (e) {}
          track.stop();
        });
        activeTorchStream = null;
      }
      return false;
    }
  } catch (err) {
    console.warn("Hardware torch direct access failed, falling back to UI simulation:", err);
    if (activeTorchStream) {
      activeTorchStream.getTracks().forEach((t) => t.stop());
      activeTorchStream = null;
    }
    return enable;
  }
}

// Battery monitoring listener
export function initBatteryMonitoring(callback: (batteryData: { level: number; isCharging: boolean }) => void): () => void {
  try {
    // @ts-ignore
    if (typeof navigator !== "undefined" && typeof navigator.getBattery === "function") {
      // @ts-ignore
      navigator.getBattery().then((battery: any) => {
        const update = () => {
          callback({
            level: Math.round(battery.level * 100),
            isCharging: battery.charging,
          });
        };
        update();
        battery.addEventListener("levelchange", update);
        battery.addEventListener("chargingchange", update);
      }).catch(() => {});
    }
  } catch (e) {
    console.debug("Battery API error", e);
  }
  return () => {};
}

// Sensors monitoring listener (Device Orientation)
export function initDeviceSensors(callback: (sensors: { alpha: number; beta: number; gamma: number }) => void): () => void {
  const handler = (e: DeviceOrientationEvent) => {
    callback({
      alpha: Math.round(e.alpha || 45),
      beta: Math.round(e.beta || 12),
      gamma: Math.round(e.gamma || -4),
    });
  };

  if (typeof window !== "undefined" && "DeviceOrientationEvent" in window) {
    window.addEventListener("deviceorientation", handler);
    return () => window.removeEventListener("deviceorientation", handler);
  }
  return () => {};
}

// Geolocation query
export async function getDeviceGPSLocation(): Promise<{
  latitude: number;
  longitude: number;
  accuracy: number;
  city: string;
  address: string;
}> {
  return new Promise((resolve) => {
    if (typeof navigator !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          const accuracy = Math.round(position.coords.accuracy);

          let city = "Local Area";
          let address = `${lat.toFixed(4)}° N, ${lon.toFixed(4)}° E`;

          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=14`,
              { headers: { "User-Agent": "Mara-Android-Assistant/1.0" } }
            );
            if (res.ok) {
              const data = await res.json();
              city = data.address?.city || data.address?.town || data.address?.state_district || data.address?.state || "India";
              address = data.display_name || address;
            }
          } catch (e) {
            console.debug("Reverse geocode fallback", e);
          }

          resolve({ latitude: lat, longitude: lon, accuracy, city, address });
        },
        () => {
          resolve({
            latitude: 28.6139,
            longitude: 77.2090,
            accuracy: 8,
            city: "New Delhi",
            address: "Connaught Place, New Delhi, India",
          });
        },
        { timeout: 6000, enableHighAccuracy: true }
      );
    } else {
      resolve({
        latitude: 28.6139,
        longitude: 77.2090,
        accuracy: 8,
        city: "New Delhi",
        address: "Connaught Place, New Delhi, India",
      });
    }
  });
}

// Web Speech API fallback TTS
export function speakWithWebSpeech(text: string, onEnd?: () => void) {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.1; // Friendly female pitch
    
    // Find Hindi or Indian English voice if available
    const voices = window.speechSynthesis.getVoices();
    const hindiVoice = voices.find(v => v.lang.includes("hi") || v.lang.includes("IN") || v.name.includes("India") || v.name.includes("Kore"));
    if (hindiVoice) {
      utterance.voice = hindiVoice;
    }

    if (onEnd) {
      utterance.onend = onEnd;
      utterance.onerror = onEnd;
    }
    window.speechSynthesis.speak(utterance);
  } else {
    if (onEnd) setTimeout(onEnd, 1500);
  }
}

// Intent Launchers
export function launchPhoneCall(phone: string) {
  const sanitized = phone.replace(/[^\d+]/g, "");
  window.location.href = `tel:${sanitized}`;
}

export function launchSMS(phone: string, body?: string) {
  const sanitized = phone.replace(/[^\d+]/g, "");
  const url = body ? `sms:${sanitized}?body=${encodeURIComponent(body)}` : `sms:${sanitized}`;
  window.location.href = url;
}

export function launchWhatsApp(phone: string, message?: string) {
  const sanitized = phone.replace(/[^\d]/g, "");
  const url = message 
    ? `https://api.whatsapp.com/send?phone=${sanitized}&text=${encodeURIComponent(message)}`
    : `https://api.whatsapp.com/send?phone=${sanitized}`;
  window.open(url, "_blank");
}

// Synthesizer Audio Alerts (Shutter, Chimes, Ringtone)
export function playSynthesizedSound(type: "shutter" | "chime" | "alarm" | "tap" | "success") {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    if (type === "tap") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } else if (type === "shutter") {
      const bufferSize = ctx.sampleRate * 0.12;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = buffer;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
      whiteNoise.connect(gain);
      gain.connect(ctx.destination);
      whiteNoise.start();
    } else if (type === "chime" || type === "success") {
      const notes = type === "success" ? [523.25, 659.25, 783.99, 1046.5] : [587.33, 880];
      notes.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + index * 0.08);
        gain.gain.setValueAtTime(0.12, ctx.currentTime + index * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + index * 0.08 + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + index * 0.08);
        osc.stop(ctx.currentTime + index * 0.08 + 0.3);
      });
    } else if (type === "alarm") {
      for (let i = 0; i < 3; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "square";
        osc.frequency.setValueAtTime(1046.5, ctx.currentTime + i * 0.2);
        gain.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.2);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.2 + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.2);
        osc.stop(ctx.currentTime + i * 0.2 + 0.12);
      }
    }
  } catch (e) {
    console.debug("Audio synthesis sound effect failed", e);
  }
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      triggerHaptic([30, 20, 30]);
      return true;
    }
  } catch (e) {
    console.error("Clipboard write error", e);
  }
  return false;
}

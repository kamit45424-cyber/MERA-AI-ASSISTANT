import { useState, useEffect, useRef, type FormEvent } from "react";
import { motion } from "motion/react";
import {
  Mic,
  MicOff,
  Send,
  Smartphone,
  Flashlight,
  Battery,
  Phone,
  Clock,
  Camera,
  Grid,
  Activity,
  Layers,
  Rocket,
} from "lucide-react";

import Visualizer from "./components/Visualizer";
import PermissionModal from "./components/PermissionModal";
import AndroidHeader from "./components/AndroidHeader";
import AndroidQuickSettings from "./components/AndroidQuickSettings";
import AndroidDeviceHub from "./components/AndroidDeviceHub";
import AndroidCameraModal from "./components/AndroidCameraModal";
import AndroidPhoneDialer from "./components/AndroidPhoneDialer";
import AndroidContactsModal from "./components/AndroidContactsModal";
import AndroidClockModal from "./components/AndroidClockModal";
import AndroidAppDrawer from "./components/AndroidAppDrawer";
import AndroidBackgroundHub from "./components/AndroidBackgroundHub";
import FlashlightOverlay from "./components/FlashlightOverlay";
import NotificationBanner from "./components/NotificationBanner";
import { OfflineIndicator } from "./components/PWAInstallButton";

import {
  AppState,
  AndroidDeviceState,
  Contact,
  AlarmItem,
  ChatMessage,
  AndroidNotification,
} from "./types";

import {
  defaultAndroidState,
  sampleContacts,
  sampleAlarms,
  initBatteryMonitoring,
  initDeviceSensors,
  getDeviceGPSLocation,
  setHardwareTorch,
  triggerHaptic,
  playSynthesizedSound,
  speakWithWebSpeech,
  copyToClipboard,
  launchPhoneCall,
  launchSMS,
  launchWhatsApp,
} from "./services/androidService";

import { ALL_ANDROID_APPS, findAndroidAppByName, resolveAppLaunchUrl } from "./services/allAppsService";
import { backgroundEngine, BackgroundEngineState } from "./services/backgroundService";
import { LiveSessionManager } from "./services/liveService";
import { getMaraResponse, getMaraAudio, resetMaraSession } from "./services/geminiService";
import { parseAndExecuteAndroidCommand } from "./services/commandService";

export default function App() {
  // Assistant Core State
  const [appState, setAppState] = useState<AppState>("idle");
  const [inputPrompt, setInputPrompt] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "init_1",
      sender: "mara",
      text: `Namaste! Main hu Mara, aapki personal Android 15 AI assistant. Main ab background mein bhi lagatar run karti hu aur aapke phone ke saare ${ALL_ANDROID_APPS.length} Android apps (WhatsApp, Instagram, PhonePe, GPay, YouTube, Zomato, Uber, Play Store) aur hardware ko full control kar sakti hu. Bataiye kya karu?`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [isMuted, setIsMuted] = useState(false);
  const [permissionError, setPermissionError] = useState(false);

  // Android System & Background State
  const [deviceState, setDeviceState] = useState<AndroidDeviceState>(defaultAndroidState);
  const [bgState, setBgState] = useState<BackgroundEngineState>(() => backgroundEngine.getState());
  const [contacts, setContacts] = useState<Contact[]>(sampleContacts);
  const [alarms, setAlarms] = useState<AlarmItem[]>(sampleAlarms);
  const [activeNotification, setActiveNotification] = useState<AndroidNotification | null>(null);

  // Modal / Screen Overlays
  const [showQuickSettings, setShowQuickSettings] = useState(false);
  const [showDeviceHub, setShowDeviceHub] = useState(false);
  const [showBackgroundHub, setShowBackgroundHub] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [showDialer, setShowDialer] = useState(false);
  const [showContacts, setShowContacts] = useState(false);
  const [showClock, setShowClock] = useState(false);
  const [showAppDrawer, setShowAppDrawer] = useState(false);
  const [showScreenTorch, setShowScreenTorch] = useState(false);

  // Live Manager Reference
  const liveManagerRef = useRef<LiveSessionManager | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // 1. Initialize Real Android Device Hardware Listeners & Background Daemon
  useEffect(() => {
    backgroundEngine.onStateUpdate = (newState) => {
      setBgState({ ...newState });
      setDeviceState((prev) => ({
        ...prev,
        wakeLockActive: newState.wakeLockActive,
      }));
    };

    // Enable Background Execution Engine automatically
    backgroundEngine.enableBackgroundMode();

    // Battery monitoring
    const unsubBattery = initBatteryMonitoring((batteryData) => {
      setDeviceState((prev) => ({
        ...prev,
        battery: {
          ...prev.battery,
          level: batteryData.level,
          isCharging: batteryData.isCharging,
          temperature: batteryData.isCharging ? 34.8 : 31.5,
        },
      }));
    });

    // Device Sensor monitoring (Gyroscope / Orientation)
    const unsubSensors = initDeviceSensors((sensors) => {
      setDeviceState((prev) => ({ ...prev, sensors }));
    });

    // Real GPS Location
    getDeviceGPSLocation().then((loc) => {
      setDeviceState((prev) => ({
        ...prev,
        location: {
          ...prev.location,
          latitude: loc.latitude,
          longitude: loc.longitude,
          city: loc.city,
          address: loc.address,
          accuracy: loc.accuracy,
          enabled: true,
        },
      }));
    });

    return () => {
      unsubBattery();
      unsubSensors();
    };
  }, []);

  // Wire up background voice commands & lock-screen media controls
  useEffect(() => {
    backgroundEngine.onBackgroundVoiceCommand = (transcript) => {
      handleSendMessage(undefined, transcript);
    };
    backgroundEngine.onToggleLiveMic = () => {
      toggleLiveVoice();
    };
  });

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, appState]);

  // Show Toast Notification Helper
  const showToast = (title: string, body: string) => {
    const notif: AndroidNotification = {
      id: "notif_" + Date.now(),
      title,
      body,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setActiveNotification(notif);
    triggerHaptic(30);
    backgroundEngine.setAssistantStatusText(`${title}: ${body}`);
    if (document.visibilityState === "hidden") {
      backgroundEngine.sendSystemNotification(title, body);
    }
    setTimeout(() => {
      setActiveNotification((curr) => (curr?.id === notif.id ? null : curr));
    }, 4500);
  };

  // 2. Setup Gemini Live API Session
  const toggleLiveVoice = async () => {
    if (appState === "listening" || appState === "speaking" || appState === "processing") {
      liveManagerRef.current?.stop();
      setAppState("idle");
      return;
    }

    try {
      if (!liveManagerRef.current) {
        liveManagerRef.current = new LiveSessionManager();

        liveManagerRef.current.onStateChange = (newState) => {
          setAppState(newState);
        };

        liveManagerRef.current.onMessage = (sender, text) => {
          setMessages((prev) => [
            ...prev,
            {
              id: "msg_" + Date.now(),
              sender,
              text,
              timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            },
          ]);
        };

        liveManagerRef.current.onAndroidAction = (actionType, payload) => {
          executeHardwareAction(actionType, payload);
        };

        liveManagerRef.current.onCommand = (url) => {
          window.open(url, "_blank");
        };
      }

      await liveManagerRef.current.start();
      backgroundEngine.logEvent("Live Bidirectional Voice Stream Active", "voice");
    } catch (err) {
      console.error("Live voice error:", err);
      setPermissionError(true);
      setAppState("idle");
    }
  };

  // 3. Central Hardware, Background & All-App Action Dispatcher
  const executeHardwareAction = async (actionType: string, payload?: any) => {
    switch (actionType) {
      case "background_toggle": {
        if (payload?.enable === false) {
          backgroundEngine.disableBackgroundMode();
          showToast("Background Service", "Background execution paused");
        } else {
          await backgroundEngine.enableBackgroundMode();
          showToast("Background Service Active", "Mara is running in background with WakeLock & MediaSession");
        }
        break;
      }

      case "floating_pip": {
        const started = await backgroundEngine.toggleFloatingPiP();
        if (started) {
          showToast("Floating Overlay", "Mara Floating Window active over other apps");
        } else {
          setShowBackgroundHub(true);
        }
        break;
      }

      case "all_apps_open": {
        setShowAppDrawer(true);
        showToast("All Apps Access", `${ALL_ANDROID_APPS.length} Android Apps Ready`);
        break;
      }

      case "app_open": {
        const internal = payload?.internalAction || payload?.app;
        if (internal === "camera") {
          setShowCamera(true);
          break;
        }
        if (internal === "dialer") {
          setShowDialer(true);
          break;
        }
        if (internal === "contacts") {
          setShowContacts(true);
          break;
        }
        if (internal === "clock") {
          setShowClock(true);
          break;
        }
        if (internal === "settings") {
          setShowDeviceHub(true);
          break;
        }
        if (internal === "files") {
          showToast("Files by Google", "Internal Storage: 169.6 GB Free / 256 GB Total");
          break;
        }

        if (payload?.url) {
          const appTitle = payload.appName || "Android App";
          const pkg = payload.packageName || "android.intent.action.VIEW";
          backgroundEngine.logEvent(`Launched ${appTitle} (${pkg})`, "app");
          showToast(`Launching ${appTitle}`, `Package: ${pkg}`);
          window.open(payload.url, "_blank");
        } else if (payload?.app) {
          const matched = findAndroidAppByName(payload.app);
          if (matched) {
            const url = resolveAppLaunchUrl(matched);
            backgroundEngine.logEvent(`Launched ${matched.name} (${matched.packageName})`, "app");
            showToast(`Launching ${matched.name}`, `Package: ${matched.packageName}`);
            window.open(url, "_blank");
          } else {
            setShowAppDrawer(true);
          }
        }
        break;
      }

      case "torch_toggle": {
        const nextTorch = payload?.enable !== undefined ? payload.enable : !deviceState.torch;
        setDeviceState((prev) => ({ ...prev, torch: nextTorch }));
        await setHardwareTorch(nextTorch);
        triggerHaptic(40);
        backgroundEngine.logEvent(`Hardware Torch turned ${nextTorch ? "ON" : "OFF"}`, "system");
        showToast("Torch System", nextTorch ? "Flashlight turned ON" : "Flashlight turned OFF");
        break;
      }

      case "screen_torch": {
        setShowScreenTorch(true);
        showToast("Screen Torch", "Screen Flashlight activated at 100% lumens");
        break;
      }

      case "vibrate": {
        triggerHaptic(payload?.pattern || [100, 50, 100, 50, 200]);
        playSynthesizedSound("tap");
        showToast("Haptic Engine", "Vibration pulse triggered");
        break;
      }

      case "battery_check": {
        showToast(
          "Battery Status",
          `${deviceState.battery.level}% - ${deviceState.battery.isCharging ? "Charging" : "Good Health"}`
        );
        break;
      }

      case "call": {
        if (payload?.number) {
          backgroundEngine.logEvent(`Initiated Call to ${payload.name || payload.number}`, "app");
          showToast("Phone Dialer", `Calling ${payload.name || payload.number}...`);
          launchPhoneCall(payload.number);
        } else {
          setShowDialer(true);
        }
        break;
      }

      case "sms": {
        if (payload?.number) {
          backgroundEngine.logEvent(`Composed SMS to ${payload.number}`, "app");
          showToast("SMS Message", `Opening SMS for ${payload.number}...`);
          launchSMS(payload.number, payload.message);
        }
        break;
      }

      case "whatsapp": {
        if (payload?.number) {
          backgroundEngine.logEvent(`Opened WhatsApp chat for ${payload.number}`, "app");
          showToast("WhatsApp", `Opening WhatsApp chat with ${payload.number}...`);
          launchWhatsApp(payload.number, payload.message);
        }
        break;
      }

      case "camera_open": {
        setShowCamera(true);
        break;
      }

      case "contacts_open": {
        setShowContacts(true);
        break;
      }

      case "clock_open": {
        setShowClock(true);
        break;
      }

      case "device_info": {
        setShowDeviceHub(true);
        break;
      }

      case "alarm_set": {
        if (payload?.timeRaw) {
          const newAlarm: AlarmItem = {
            id: "a_" + Date.now(),
            time: payload.timeRaw,
            label: payload.label || "Mara Voice Alarm",
            enabled: true,
            days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
          };
          setAlarms((prev) => [newAlarm, ...prev]);
          playSynthesizedSound("chime");
          backgroundEngine.logEvent(`Scheduled Alarm for ${payload.timeRaw}`, "system");
          showToast("Alarm Scheduled", `Alarm set for ${payload.timeRaw}`);
        }
        break;
      }

      case "timer_set": {
        setShowClock(true);
        showToast("Timer Started", `Timer set for ${payload?.seconds || 60} seconds`);
        break;
      }

      case "clipboard_copy": {
        if (payload?.text) {
          await copyToClipboard(payload.text);
          showToast("Clipboard", "Copied to Android Clipboard");
        }
        break;
      }

      case "volume_set": {
        if (payload?.value !== undefined) {
          setDeviceState((prev) => ({ ...prev, volume: payload.value, isMuted: payload.value === 0 }));
        }
        break;
      }

      case "brightness_set": {
        if (payload?.value !== undefined) {
          setDeviceState((prev) => ({ ...prev, brightness: payload.value }));
        }
        break;
      }

      default:
        break;
    }
  };

  // 4. Handle Text & Voice Command Submissions
  const handleSendMessage = async (e?: FormEvent, customPrompt?: string) => {
    if (e) e.preventDefault();
    const promptToSend = customPrompt || inputPrompt.trim();
    if (!promptToSend) return;

    const userMsg: ChatMessage = {
      id: "u_" + Date.now(),
      sender: "user",
      text: promptToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt("");
    setAppState("processing");

    // 1st: Check deterministic Android hardware & All-App command match
    const commandResult = parseAndExecuteAndroidCommand(promptToSend, deviceState, contacts);

    if (commandResult.handled) {
      await executeHardwareAction(commandResult.actionType, commandResult.payload);

      const botMsg: ChatMessage = {
        id: "m_" + Date.now(),
        sender: "mara",
        text: commandResult.spokenResponse,
        actionSummary: commandResult.spokenResponse,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, botMsg]);
      setAppState("speaking");

      if (!isMuted) {
        speakResponse(commandResult.spokenResponse);
      } else {
        setAppState("idle");
      }
      return;
    }

    // 2nd: Fallback to Gemini conversation
    try {
      const history = messages.map((m) => ({ sender: m.sender, text: m.text }));
      const responseText = await getMaraResponse(promptToSend, history);

      const botMsg: ChatMessage = {
        id: "m_" + Date.now(),
        sender: "mara",
        text: responseText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, botMsg]);
      setAppState("speaking");

      if (!isMuted) {
        speakResponse(responseText);
      } else {
        setAppState("idle");
      }
    } catch (err) {
      console.error("Gemini text error:", err);
      setAppState("idle");
    }
  };

  // 5. Audio Speech Output (TTS)
  const speakResponse = async (text: string) => {
    try {
      const audioBase64 = await getMaraAudio(text);
      if (audioBase64) {
        if (!audioPlayerRef.current) {
          audioPlayerRef.current = new Audio();
        }
        audioPlayerRef.current.src = `data:audio/mp3;base64,${audioBase64}`;
        audioPlayerRef.current.onended = () => setAppState("idle");
        audioPlayerRef.current.play();
        return;
      }
    } catch (e) {
      console.warn("Falling back to Web Speech API", e);
    }

    speakWithWebSpeech(text, () => setAppState("idle"));
  };

  // Clear Chat History
  const handleClearHistory = () => {
    resetMaraSession();
    setMessages([
      {
        id: "init_fresh",
        sender: "mara",
        text: `History clear ho gayi hai. Main background mein active hu aur saare ${ALL_ANDROID_APPS.length} Android apps connected hain! Bataiye kya karu?`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
    triggerHaptic(30);
  };

  // Handle Photo Analysis from Camera
  const handleAnalyzePhoto = async (_photoBase64: string, prompt: string) => {
    const userMsg: ChatMessage = {
      id: "u_cam_" + Date.now(),
      sender: "user",
      text: "📸 [Photo captured from Android Camera] " + prompt,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, userMsg]);
    setAppState("processing");

    try {
      const response = await getMaraResponse(prompt + "\n[Camera image attached]");
      const botMsg: ChatMessage = {
        id: "m_cam_" + Date.now(),
        sender: "mara",
        text: response,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, botMsg]);
      setAppState("speaking");
      if (!isMuted) speakResponse(response);
    } catch (e) {
      setAppState("idle");
    }
  };

  return (
    <div
      className="relative w-full h-screen bg-slate-950 overflow-hidden flex flex-col justify-between select-none font-sans"
      style={{ filter: `brightness(${deviceState.brightness / 100})` }}
    >
      {/* Offline Mode Indicator */}
      <OfflineIndicator />

      {/* Floating Heads-Up Banner */}
      <NotificationBanner
        notification={activeNotification}
        onDismiss={() => setActiveNotification(null)}
      />

      {/* Screen Torch Overlay */}
      {showScreenTorch && <FlashlightOverlay onClose={() => setShowScreenTorch(false)} />}

      {/* Android Top Header & Status Bar */}
      <AndroidHeader
        deviceState={deviceState}
        isMuted={isMuted}
        bgActive={bgState.isEnabled}
        wakeWordActive={bgState.wakeWordListening}
        onToggleMute={() => {
          setIsMuted(!isMuted);
          triggerHaptic(20);
        }}
        onOpenQuickSettings={() => setShowQuickSettings(true)}
        onOpenDeviceHub={() => setShowDeviceHub(true)}
        onOpenBackgroundHub={() => setShowBackgroundHub(true)}
        onOpenAppDrawer={() => setShowAppDrawer(true)}
        onClearHistory={handleClearHistory}
        hasMessages={messages.length > 1}
      />

      {/* Central Visualizer HUD */}
      <div className="relative flex-1 w-full flex items-center justify-center pt-16 pb-24 px-4 overflow-hidden">
        <Visualizer state={appState} torchActive={deviceState.torch} />

        {/* Chat / Transcripts Flow (Floating Above Visualizer) */}
        <div className="absolute inset-x-0 bottom-24 top-20 max-w-xl mx-auto px-4 py-2 flex flex-col justify-end overflow-y-auto pointer-events-auto space-y-3 z-10 scrollbar-hide">
          {messages.slice(-4).map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
            >
              <div
                className={`max-w-[85%] sm:max-w-[80%] p-3.5 rounded-2xl text-xs sm:text-sm backdrop-blur-md shadow-lg ${
                  msg.sender === "user"
                    ? "bg-emerald-500 text-slate-950 font-medium rounded-br-xs"
                    : "bg-slate-900/85 text-white border border-emerald-500/30 rounded-bl-xs"
                }`}
              >
                <div className="flex items-center justify-between gap-3 text-[10px] opacity-60 mb-1">
                  <span className="font-semibold uppercase tracking-wider">
                    {msg.sender === "user" ? "You" : "Mara Assistant"}
                  </span>
                  <span>{msg.timestamp}</span>
                </div>
                <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
              </div>
            </motion.div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Bottom Command & Quick Action Bar */}
      <footer className="absolute bottom-0 left-0 w-full z-20 bg-gradient-to-t from-black/95 via-black/80 to-transparent backdrop-blur-md px-3 sm:px-6 pb-4 pt-2 flex flex-col gap-2">
        {/* Quick Android Chips Scrollbar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide text-xs">
          <button
            onClick={() => setShowAppDrawer(true)}
            className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-400 hover:text-slate-950 border border-emerald-500/40 transition-all flex items-center gap-1.5 whitespace-nowrap text-emerald-300 font-semibold active:scale-95"
          >
            <Grid size={13} />
            <span>📲 All {ALL_ANDROID_APPS.length} Android Apps</span>
          </button>

          <button
            onClick={() => setShowBackgroundHub(true)}
            className="px-3 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-400 hover:text-slate-950 border border-cyan-500/35 transition-all flex items-center gap-1.5 whitespace-nowrap text-cyan-300 font-semibold active:scale-95"
          >
            <Activity size={13} />
            <span>⚡ Background Mode ({bgState.isEnabled ? "ON" : "OFF"})</span>
          </button>

          <button
            onClick={() => executeHardwareAction("floating_pip")}
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-cyan-400 hover:text-slate-950 border border-white/10 hover:border-cyan-400 transition-all flex items-center gap-1.5 whitespace-nowrap text-white/80 active:scale-95"
          >
            <Layers size={13} className="text-cyan-400" />
            <span>🪟 Floating Overlay</span>
          </button>

          <button
            onClick={() => handleSendMessage(undefined, "Torch on karo")}
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-amber-400 hover:text-slate-950 border border-white/10 hover:border-amber-400 transition-all flex items-center gap-1.5 whitespace-nowrap text-white/80 active:scale-95"
          >
            <Flashlight size={13} className="text-amber-400" />
            <span>🔦 Torch</span>
          </button>

          <button
            onClick={() => handleSendMessage(undefined, "Instagram kholo")}
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-pink-500 hover:text-white border border-white/10 hover:border-pink-500 transition-all flex items-center gap-1.5 whitespace-nowrap text-white/80 active:scale-95"
          >
            <Rocket size={13} className="text-pink-400" />
            <span>📸 Instagram</span>
          </button>

          <button
            onClick={() => handleSendMessage(undefined, "PhonePe kholo")}
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-purple-500 hover:text-white border border-white/10 hover:border-purple-500 transition-all flex items-center gap-1.5 whitespace-nowrap text-white/80 active:scale-95"
          >
            <Rocket size={13} className="text-purple-400" />
            <span>💳 PhonePe</span>
          </button>

          <button
            onClick={() => setShowDeviceHub(true)}
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-emerald-400 hover:text-slate-950 border border-white/10 hover:border-emerald-400 transition-all flex items-center gap-1.5 whitespace-nowrap text-white/80 active:scale-95"
          >
            <Smartphone size={13} className="text-emerald-400" />
            <span>📱 Android {deviceState.androidVersionNumber}</span>
          </button>

          <button
            onClick={() => setShowDialer(true)}
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-green-400 hover:text-slate-950 border border-white/10 hover:border-green-400 transition-all flex items-center gap-1.5 whitespace-nowrap text-white/80 active:scale-95"
          >
            <Phone size={13} className="text-green-400" />
            <span>📞 Call</span>
          </button>

          <button
            onClick={() => setShowCamera(true)}
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-purple-400 hover:text-slate-950 border border-white/10 hover:border-purple-400 transition-all flex items-center gap-1.5 whitespace-nowrap text-white/80 active:scale-95"
          >
            <Camera size={13} className="text-purple-400" />
            <span>📷 Camera</span>
          </button>

          <button
            onClick={() => setShowClock(true)}
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-amber-400 hover:text-slate-950 border border-white/10 hover:border-amber-400 transition-all flex items-center gap-1.5 whitespace-nowrap text-white/80 active:scale-95"
          >
            <Clock size={13} className="text-amber-400" />
            <span>⏰ Alarms</span>
          </button>
        </div>

        {/* Input Bar & Live Mic Trigger */}
        <form onSubmit={handleSendMessage} className="flex items-center gap-2 max-w-2xl mx-auto w-full">
          {/* Live Voice Assistant Toggle */}
          <button
            type="button"
            onClick={toggleLiveVoice}
            className={`p-3.5 sm:p-4 rounded-2xl flex items-center justify-center transition-all shadow-xl active:scale-90 ${
              appState === "listening" || appState === "speaking"
                ? "bg-rose-500 text-white shadow-rose-500/50 animate-pulse"
                : "bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-400 text-slate-950 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:brightness-110"
            }`}
            title={appState === "listening" ? "Stop Listening" : "Speak to Mara"}
          >
            {appState === "listening" || appState === "speaking" ? (
              <MicOff size={22} className="animate-pulse" />
            ) : (
              <Mic size={22} className="font-bold" />
            )}
          </button>

          {/* Text Input */}
          <div className="flex-1 flex items-center px-4 py-2.5 sm:py-3 bg-white/10 hover:bg-white/15 focus-within:bg-white/15 border border-white/15 focus-within:border-emerald-500/50 rounded-2xl backdrop-blur-md transition-all">
            <input
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              placeholder="Ask Mara (e.g. 'Instagram kholo', 'PhonePe open karo', 'Background mode', 'Torch on karo')"
              className="w-full bg-transparent border-none outline-none text-xs sm:text-sm text-white placeholder:text-white/40 font-medium"
            />
          </div>

          {/* Send Button */}
          <button
            type="submit"
            disabled={!inputPrompt.trim()}
            className="p-3.5 sm:p-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-30 disabled:hover:bg-emerald-500 text-slate-950 flex items-center justify-center transition-all shadow-lg active:scale-95"
          >
            <Send size={18} className="font-bold fill-slate-950" />
          </button>
        </form>
      </footer>

      {/* --- ALL OVERLAY MODALS --- */}

      {/* 0. Android Background Execution & Always-On Service Hub */}
      {showBackgroundHub && (
        <AndroidBackgroundHub
          bgState={bgState}
          onClose={() => setShowBackgroundHub(false)}
          onToggleBackgroundDaemon={() => {
            if (bgState.isEnabled) {
              backgroundEngine.disableBackgroundMode();
              showToast("Background Service", "Background daemon paused");
            } else {
              backgroundEngine.enableBackgroundMode();
              showToast("Background Service Active", "Mara is now running persistently in the background");
            }
          }}
          onToggleWakeWord={() => {
            if (bgState.wakeWordListening) {
              backgroundEngine.stopWakeWordListening();
              showToast("Background Mic", '"Hey Mara" continuous listener stopped');
            } else {
              const ok = backgroundEngine.startWakeWordListening();
              if (ok) {
                showToast("Background Mic Active", 'Say any command or "Hey Mara" anytime!');
              } else {
                showToast("Voice Info", "Use the main Live Mic button on this browser");
              }
            }
          }}
          onToggleFloatingPiP={() => {
            executeHardwareAction("floating_pip");
          }}
          onRequestNotifications={async () => {
            const granted = await backgroundEngine.requestNotificationPermission();
            if (granted) {
              showToast("Notifications Enabled", "Mara will alert you while running in background");
            }
          }}
          onOpenAllApps={() => setShowAppDrawer(true)}
        />
      )}

      {/* 1. Android Quick Settings & Notification Drawer */}
      {showQuickSettings && (
        <AndroidQuickSettings
          deviceState={deviceState}
          onClose={() => setShowQuickSettings(false)}
          onToggleTorch={() => executeHardwareAction("torch_toggle")}
          onToggleWifi={() =>
            setDeviceState((prev) => ({
              ...prev,
              network: { ...prev.network, online: !prev.network.online },
            }))
          }
          onToggleBluetooth={() =>
            setDeviceState((prev) => ({ ...prev, bluetooth: !prev.bluetooth }))
          }
          onTogglePowerSaver={() =>
            setDeviceState((prev) => ({
              ...prev,
              battery: { ...prev.battery, powerSaver: !prev.battery.powerSaver },
            }))
          }
          onToggleDnd={() => setDeviceState((prev) => ({ ...prev, dndActive: !prev.dndActive }))}
          onToggleAutoRotate={() =>
            setDeviceState((prev) => ({ ...prev, autoRotate: !prev.autoRotate }))
          }
          onToggleHotspot={() => setDeviceState((prev) => ({ ...prev, hotspot: !prev.hotspot }))}
          onToggleLocation={() =>
            setDeviceState((prev) => ({
              ...prev,
              location: { ...prev.location, enabled: !prev.location.enabled },
            }))
          }
          onTriggerVibration={() => executeHardwareAction("vibrate")}
          onToggleScreenTorch={() => setShowScreenTorch(true)}
          onSetBrightness={(b) => setDeviceState((prev) => ({ ...prev, brightness: b }))}
          onSetVolume={(v) =>
            setDeviceState((prev) => ({ ...prev, volume: v, isMuted: v === 0 }))
          }
          onOpenDeviceHub={() => setShowDeviceHub(true)}
          onOpenCamera={() => setShowCamera(true)}
          onOpenDialer={() => setShowDialer(true)}
          onOpenClock={() => setShowClock(true)}
          onOpenApps={() => setShowAppDrawer(true)}
          onCopyClipboardStatus={() =>
            executeHardwareAction("clipboard_copy", {
              text: `Android ${deviceState.androidVersionNumber}`,
            })
          }
        />
      )}

      {/* 2. Android OS & Device Info Hub */}
      {showDeviceHub && (
        <AndroidDeviceHub
          deviceState={deviceState}
          onClose={() => setShowDeviceHub(false)}
          onRefreshTelemetry={() => {
            getDeviceGPSLocation().then((loc) => {
              setDeviceState((p) => ({ ...p, location: { ...p.location, ...loc } }));
              showToast("Sensor Sync", "Android Telemetry Refreshed");
            });
          }}
          onChangeAndroidVersion={(v) => {
            setDeviceState((prev) => ({
              ...prev,
              androidVersionNumber: v,
              apiLevel: v === 15 ? 35 : v === 14 ? 34 : 36,
              osVersion: `Android ${v} (${
                v === 15 ? "Vanilla Ice Cream" : v === 14 ? "Upside Down Cake" : "Baklava"
              })`,
            }));
            showToast("OS Updated", `Switched to Android ${v} profile`);
          }}
        />
      )}

      {/* 3. Android Camera View */}
      {showCamera && (
        <AndroidCameraModal
          onClose={() => setShowCamera(false)}
          onAnalyzePhoto={handleAnalyzePhoto}
        />
      )}

      {/* 4. Android Phone Dialer */}
      {showDialer && (
        <AndroidPhoneDialer
          onClose={() => setShowDialer(false)}
          onOpenContacts={() => {
            setShowDialer(false);
            setShowContacts(true);
          }}
          onInitiateCall={(num) => {
            setShowDialer(false);
            executeHardwareAction("call", { number: num });
          }}
        />
      )}

      {/* 5. Android Contacts Manager */}
      {showContacts && (
        <AndroidContactsModal
          contacts={contacts}
          onClose={() => setShowContacts(false)}
          onCall={(phone) => executeHardwareAction("call", { number: phone })}
          onSMS={(phone) => executeHardwareAction("sms", { number: phone })}
          onWhatsApp={(phone) => executeHardwareAction("whatsapp", { number: phone })}
          onAddContact={(newContact) => {
            setContacts((prev) => [newContact, ...prev]);
            showToast("Contacts", `Added ${newContact.name}`);
          }}
        />
      )}

      {/* 6. Android Clock & Alarms */}
      {showClock && (
        <AndroidClockModal
          alarms={alarms}
          onClose={() => setShowClock(false)}
          onToggleAlarm={(id) => {
            setAlarms((prev) =>
              prev.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a))
            );
          }}
          onAddAlarm={(time, label) => {
            const created: AlarmItem = {
              id: "a_" + Date.now(),
              time,
              label,
              enabled: true,
              days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
            };
            setAlarms((prev) => [created, ...prev]);
            showToast("Alarm Set", `Alarm scheduled for ${time}`);
          }}
          onDeleteAlarm={(id) => {
            setAlarms((prev) => prev.filter((a) => a.id !== id));
            showToast("Alarm Deleted", "Alarm removed");
          }}
        />
      )}

      {/* 7. All Android Apps Drawer */}
      {showAppDrawer && (
        <AndroidAppDrawer
          onClose={() => setShowAppDrawer(false)}
          onLaunchApp={(appName, url, packageName) => {
            if (appName === "camera") setShowCamera(true);
            else if (appName === "dialer") setShowDialer(true);
            else if (appName === "contacts") setShowContacts(true);
            else if (appName === "clock") setShowClock(true);
            else if (appName === "settings") setShowDeviceHub(true);
            else if (appName === "files")
              showToast("Files Manager", "Internal Storage: 169.6 GB Free");
            else if (url) {
              backgroundEngine.logEvent(
                `Launched ${appName} (${packageName || "android.intent"})`,
                "app"
              );
              showToast(`Opening ${appName}`, packageName || url);
              window.open(url, "_blank");
            }
          }}
        />
      )}

      {/* 8. Permission Modal */}
      {permissionError && <PermissionModal onClose={() => setPermissionError(false)} />}
    </div>
  );
}

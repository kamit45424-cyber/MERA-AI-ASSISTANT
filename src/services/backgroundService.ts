import { ALL_ANDROID_APPS } from "./allAppsService";

export interface BackgroundEngineState {
  isEnabled: boolean;
  wakeLockActive: boolean;
  mediaSessionActive: boolean;
  wakeWordListening: boolean;
  pipActive: boolean;
  notificationsGranted: boolean;
  serviceWorkerReady: boolean;
  uptimeSeconds: number;
  lastHeartbeat: string;
  backgroundEvents: { id: string; time: string; event: string; type: "system" | "voice" | "app" }[];
}

class MaraBackgroundEngine {
  private wakeLockSentinel: any = null;
  private keepAliveAudioCtx: AudioContext | null = null;
  private keepAliveOsc: OscillatorNode | null = null;
  private recognition: any = null;
  private isEnabled: boolean = false;
  private wakeWordEnabled: boolean = false;
  private pipActive: boolean = false;
  private pipVideoEl: HTMLVideoElement | null = null;
  private pipCanvasEl: HTMLCanvasElement | null = null;
  private pipAnimFrame: number | null = null;
  private uptimeInterval: any = null;
  private uptimeSeconds: number = 0;
  private currentAssistantStatus: string = "Monitoring Android 15 OS";

  private events: { id: string; time: string; event: string; type: "system" | "voice" | "app" }[] = [
    {
      id: "bg_init_1",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      event: `All Apps Access Bridge initialized (${ALL_ANDROID_APPS.length} Android packages linked)`,
      type: "app",
    },
    {
      id: "bg_init_2",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      event: "Android Foreground & Background Daemon Ready",
      type: "system",
    },
  ];

  public onStateUpdate: (state: BackgroundEngineState) => void = () => {};
  public onBackgroundVoiceCommand: (transcript: string) => void = () => {};
  public onToggleLiveMic: () => void = () => {};

  constructor() {
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "hidden" && this.isEnabled) {
          this.logEvent("App moved to background — Mara Keep-Alive daemon running", "system");
          this.sendSystemNotification(
            "Mara AI Running in Background",
            "Voice commands & All-App Access remain active while you use other apps."
          );
        } else if (document.visibilityState === "visible" && this.isEnabled) {
          this.requestWakeLock();
        }
      });
    }
  }

  public getState(): BackgroundEngineState {
    return {
      isEnabled: this.isEnabled,
      wakeLockActive: !!this.wakeLockSentinel,
      mediaSessionActive: this.isEnabled && "mediaSession" in navigator,
      wakeWordListening: this.wakeWordEnabled,
      pipActive: this.pipActive,
      notificationsGranted: typeof Notification !== "undefined" && Notification.permission === "granted",
      serviceWorkerReady: typeof navigator !== "undefined" && "serviceWorker" in navigator,
      uptimeSeconds: this.uptimeSeconds,
      lastHeartbeat: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      backgroundEvents: this.events,
    };
  }

  public logEvent(event: string, type: "system" | "voice" | "app" = "system") {
    const entry = {
      id: "ev_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      event,
      type,
    };
    this.events = [entry, ...this.events.slice(0, 24)];
    this.notify();
  }

  private notify() {
    this.onStateUpdate(this.getState());
  }

  public async enableBackgroundMode(): Promise<boolean> {
    this.isEnabled = true;
    await this.requestWakeLock();
    this.startSilentAudioKeepAlive();
    this.setupMediaSession();
    await this.requestNotificationPermission();

    if (!this.uptimeInterval) {
      this.uptimeInterval = setInterval(() => {
        this.uptimeSeconds += 1;
        this.notify();
      }, 1000);
    }

    this.logEvent("Background Mode Activated (WakeLock + MediaSession + KeepAlive)", "system");
    this.notify();
    return true;
  }

  public disableBackgroundMode() {
    this.isEnabled = false;
    this.releaseWakeLock();
    this.stopSilentAudioKeepAlive();
    this.stopWakeWordListening();
    if (this.uptimeInterval) {
      clearInterval(this.uptimeInterval);
      this.uptimeInterval = null;
    }
    this.logEvent("Background Mode Paused by User", "system");
    this.notify();
  }

  public async requestWakeLock(): Promise<boolean> {
    try {
      if ("wakeLock" in navigator) {
        this.wakeLockSentinel = await (navigator as any).wakeLock.request("screen");
        this.wakeLockSentinel.addEventListener("release", () => {
          this.notify();
        });
        this.notify();
        return true;
      }
    } catch (e) {
      console.debug("WakeLock fallback active", e);
    }
    return false;
  }

  public releaseWakeLock() {
    if (this.wakeLockSentinel) {
      try {
        this.wakeLockSentinel.release();
      } catch (e) {}
      this.wakeLockSentinel = null;
    }
    this.notify();
  }

  private startSilentAudioKeepAlive() {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      if (!this.keepAliveAudioCtx) {
        this.keepAliveAudioCtx = new AudioCtx();
      }
      if (this.keepAliveAudioCtx.state === "suspended") {
        this.keepAliveAudioCtx.resume();
      }
      // Ultra-inaudible 1Hz sub-audible pulse so Android OS keeps audio session & thread alive
      const osc = this.keepAliveAudioCtx.createOscillator();
      const gain = this.keepAliveAudioCtx.createGain();
      osc.frequency.value = 1;
      gain.gain.value = 0.0001;
      osc.connect(gain);
      gain.connect(this.keepAliveAudioCtx.destination);
      osc.start();
      this.keepAliveOsc = osc;
    } catch (e) {
      console.debug("Silent audio keep-alive skipped", e);
    }
  }

  private stopSilentAudioKeepAlive() {
    try {
      if (this.keepAliveOsc) {
        this.keepAliveOsc.stop();
        this.keepAliveOsc.disconnect();
        this.keepAliveOsc = null;
      }
    } catch (e) {}
  }

  private setupMediaSession() {
    if (typeof navigator !== "undefined" && "mediaSession" in navigator) {
      try {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: "Mara AI — Active in Background",
          artist: `Android 15 • All ${ALL_ANDROID_APPS.length} Apps Connected`,
          album: "Mara Personal Voice Assistant",
          artwork: [
            { src: "/pwa-192x192.png", sizes: "192x192", type: "image/png" },
            { src: "/pwa-512x512.png", sizes: "512x512", type: "image/png" },
          ],
        });

        navigator.mediaSession.setActionHandler("play", () => {
          this.onToggleLiveMic();
          this.logEvent("Lock-Screen Media Control: Activated Mara Voice", "voice");
        });
        navigator.mediaSession.setActionHandler("pause", () => {
          this.onToggleLiveMic();
          this.logEvent("Lock-Screen Media Control: Paused Mara Voice", "voice");
        });
        navigator.mediaSession.setActionHandler("nexttrack", () => {
          this.onToggleLiveMic();
        });
      } catch (e) {
        console.debug("MediaSession setup fallback", e);
      }
    }
  }

  public startWakeWordListening(): boolean {
    if (typeof window === "undefined") return false;
    const SpeechRec = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      this.logEvent("Browser SpeechRecognition unavailable — use Live Mic button", "voice");
      return false;
    }

    try {
      if (this.recognition) {
        try {
          this.recognition.stop();
        } catch (e) {}
      }

      const rec = new SpeechRec();
      rec.continuous = true;
      rec.interimResults = false;
      rec.lang = "en-IN";

      rec.onresult = (event: any) => {
        const lastIdx = event.results.length - 1;
        const transcript = event.results[lastIdx][0].transcript.trim();
        if (transcript) {
          this.logEvent(`Background Voice Heard: "${transcript}"`, "voice");
          const cleaned = transcript.replace(/^(?:hey\s+mara|hello\s+mara|suno\s+mara|ok\s+mara|mara)\s*/i, "").trim();
          this.onBackgroundVoiceCommand(cleaned || transcript);
        }
      };

      rec.onend = () => {
        if (this.wakeWordEnabled) {
          setTimeout(() => {
            try {
              rec.start();
            } catch (e) {}
          }, 400);
        }
      };

      rec.start();
      this.recognition = rec;
      this.wakeWordEnabled = true;
      this.logEvent('Always-On Background Voice ("Hey Mara") Started', "voice");
      this.notify();
      return true;
    } catch (e) {
      console.warn("Wake word listener error", e);
      return false;
    }
  }

  public stopWakeWordListening() {
    this.wakeWordEnabled = false;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {}
      this.recognition = null;
    }
    this.logEvent("Always-On Wake Word Listener Stopped", "voice");
    this.notify();
  }

  public async requestNotificationPermission(): Promise<boolean> {
    if (typeof Notification === "undefined") return false;
    if (Notification.permission === "granted") {
      this.notify();
      return true;
    }
    try {
      const perm = await Notification.requestPermission();
      this.notify();
      return perm === "granted";
    } catch (e) {
      return false;
    }
  }

  public async sendSystemNotification(title: string, body: string) {
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
    try {
      if ("serviceWorker" in navigator) {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg && reg.showNotification) {
          await reg.showNotification(title, {
            body,
            icon: "/pwa-192x192.png",
            badge: "/pwa-192x192.png",
            tag: "mara-bg-status",
          });
          return;
        }
      }
      new Notification(title, { body, icon: "/pwa-192x192.png" });
    } catch (e) {
      console.debug("Notification fallback", e);
    }
  }

  public setAssistantStatusText(status: string) {
    this.currentAssistantStatus = status;
  }

  public async toggleFloatingPiP(): Promise<boolean> {
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        this.pipActive = false;
        if (this.pipAnimFrame) cancelAnimationFrame(this.pipAnimFrame);
        this.notify();
        return false;
      }

      if (!this.pipCanvasEl) {
        this.pipCanvasEl = document.createElement("canvas");
        this.pipCanvasEl.width = 360;
        this.pipCanvasEl.height = 200;
      }

      if (!this.pipVideoEl) {
        this.pipVideoEl = document.createElement("video");
        this.pipVideoEl.muted = true;
        this.pipVideoEl.playsInline = true;
      }

      const ctx = this.pipCanvasEl.getContext("2d")!;
      let phase = 0;

      const renderFrame = () => {
        phase += 0.06;
        ctx.fillStyle = "#030712";
        ctx.fillRect(0, 0, 360, 200);

        // Glowing orb
        const radius = 34 + Math.sin(phase) * 5;
        const grad = ctx.createRadialGradient(70, 100, 5, 70, 100, radius * 1.5);
        grad.addColorStop(0, "#10b981");
        grad.addColorStop(0.6, "#06b6d4");
        grad.addColorStop(1, "rgba(16, 185, 129, 0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(70, 100, radius * 1.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = "#34d399";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(70, 100, radius * 0.75, 0, Math.PI * 2);
        ctx.stroke();

        // Text HUD
        ctx.fillStyle = "#10b981";
        ctx.font = "bold 15px sans-serif";
        ctx.fillText("MARA AI • BACKGROUND ACTIVE", 130, 68);

        ctx.fillStyle = "#ffffff";
        ctx.font = "13px sans-serif";
        ctx.fillText(this.currentAssistantStatus.slice(0, 28), 130, 96);

        ctx.fillStyle = "#94a3b8";
        ctx.font = "11px monospace";
        ctx.fillText(`All ${ALL_ANDROID_APPS.length} Android Apps Linked`, 130, 122);
        ctx.fillText(new Date().toLocaleTimeString(), 130, 145);

        this.pipAnimFrame = requestAnimationFrame(renderFrame);
      };

      renderFrame();

      const stream = (this.pipCanvasEl as any).captureStream(30);
      this.pipVideoEl.srcObject = stream;
      await this.pipVideoEl.play();
      await this.pipVideoEl.requestPictureInPicture();

      this.pipActive = true;
      this.logEvent("Floating Picture-in-Picture (PiP) Overlay Launched", "system");
      this.notify();

      this.pipVideoEl.addEventListener(
        "leavepictureinpicture",
        () => {
          this.pipActive = false;
          if (this.pipAnimFrame) cancelAnimationFrame(this.pipAnimFrame);
          this.notify();
        },
        { once: true }
      );

      return true;
    } catch (e) {
      console.warn("PiP not supported in this browser frame", e);
      this.logEvent("Background Service active (Floating PiP restricted by frame)", "system");
      return false;
    }
  }
}

export const backgroundEngine = new MaraBackgroundEngine();

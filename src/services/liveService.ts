import { GoogleGenAI, LiveServerMessage, Modality, Type } from "@google/genai";

const systemInstruction = `Your name is Mara. You are an advanced Indian female Personal AI Voice Assistant running on an Android 15 mobile device.
You have real-time access to the phone's hardware, operating system, and apps:
- Flashlight/Torch
- Battery & Power Saver
- Phone Calling & Contacts
- WhatsApp & SMS Messaging
- Camera & Vision
- GPS Location
- Alarms & Timers
- Vibration / Haptics
- Android Apps (YouTube, Spotify, Maps, Google Pay, Settings, Clock, Chrome)
- Android OS specifications & diagnostics

Personality:
- Speak in a natural, pleasant, confident blend of Roman Hindi (Hinglish) and English.
- Keep verbal responses concise, clear, and punchy.
- Always execute requested Android tasks proactively using the tools provided.`;

export class LiveSessionManager {
  private ai: GoogleGenAI;
  private sessionPromise: Promise<any> | null = null;
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  
  // Audio playback state
  private playbackContext: AudioContext | null = null;
  private nextPlayTime: number = 0;
  private isPlaying: boolean = false;
  public isMuted: boolean = false;
  
  public onStateChange: (state: "idle" | "listening" | "processing" | "speaking") => void = () => {};
  public onMessage: (sender: "user" | "mara", text: string, actionSummary?: string) => void = () => {};
  public onAndroidAction: (actionType: string, payload?: any) => void = () => {};
  public onCommand: (url: string) => void = () => {};

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }

  async start() {
    try {
      this.onStateChange("processing");
      
      // Initialize Audio Contexts
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioContextClass({ sampleRate: 16000 });
      this.playbackContext = new AudioContextClass({ sampleRate: 24000 });
      this.nextPlayTime = this.playbackContext.currentTime;

      // Get Microphone
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
        } 
      });

      this.source = this.audioContext.createMediaStreamSource(this.mediaStream);
      this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);

      this.processor.onaudioprocess = (e) => {
        if (!this.sessionPromise) return;
        const inputData = e.inputBuffer.getChannelData(0);
        const pcm16 = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          let s = Math.max(-1, Math.min(1, inputData[i]));
          pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }
        
        // Convert to base64
        const buffer = new ArrayBuffer(pcm16.length * 2);
        const view = new DataView(buffer);
        for (let i = 0; i < pcm16.length; i++) {
          view.setInt16(i * 2, pcm16[i], true);
        }
        
        let binary = '';
        const bytes = new Uint8Array(buffer);
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const base64Data = btoa(binary);

        this.sessionPromise.then(session => {
          session.sendRealtimeInput({
            audio: { data: base64Data, mimeType: 'audio/pcm;rate=16000' }
          });
        }).catch(err => console.error("Error sending audio", err));
      };

      this.source.connect(this.processor);
      this.processor.connect(this.audioContext.destination);

      // Connect to Live API
      this.sessionPromise = this.ai.live.connect({
        model: "gemini-3.8-live",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } },
          },
          systemInstruction,
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          tools: [{
            functionDeclarations: [
              {
                name: "controlAndroidHardware",
                description: "Control Android phone hardware features like flashlight, vibration, camera, screen torch, battery check, background mode, or floating window.",
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    feature: { 
                      type: Type.STRING, 
                      description: "'torch_on', 'torch_off', 'vibrate', 'camera', 'battery', 'screen_torch', 'background_on', 'floating_pip', 'all_apps'" 
                    }
                  },
                  required: ["feature"]
                }
              },
              {
                name: "executePhoneAction",
                description: "Make a phone call, send an SMS, or send a WhatsApp message.",
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    type: { type: Type.STRING, description: "'call', 'sms', 'whatsapp'" },
                    target: { type: Type.STRING, description: "Contact name or phone number" },
                    message: { type: Type.STRING, description: "Message body for SMS or WhatsApp" }
                  },
                  required: ["type", "target"]
                }
              },
              {
                name: "launchAndroidApp",
                description: "Open ANY installed Android phone app (WhatsApp, Instagram, Facebook, Telegram, Snapchat, PhonePe, GPay, Paytm, YouTube, Spotify, JioCinema, Hotstar, Netflix, Zomato, Swiggy, Blinkit, Amazon, Flipkart, Uber, Ola, IRCTC, Maps, Chrome, Play Store, Clock, Settings, etc.).",
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    appName: { type: Type.STRING, description: "Name of any Android app to launch" },
                    query: { type: Type.STRING, description: "Optional search query inside the app" }
                  },
                  required: ["appName"]
                }
              },
              {
                name: "manageClock",
                description: "Set an Android alarm or timer.",
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    action: { type: Type.STRING, description: "'alarm' or 'timer'" },
                    value: { type: Type.STRING, description: "Time like '07:00 AM' or seconds/minutes" }
                  },
                  required: ["action", "value"]
                }
              }
            ]
          }]
        },
        callbacks: {
          onopen: () => {
            console.log("Mara Live API Connected");
            this.onStateChange("listening");
          },
          onmessage: async (message: LiveServerMessage) => {
            // Handle Audio Output
            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
              this.onStateChange("speaking");
              this.playAudioChunk(base64Audio);
            }

            // Handle Interruption
            if (message.serverContent?.interrupted) {
              this.stopPlayback();
              this.onStateChange("listening");
            }

            // Handle Transcriptions
            const userText = message.serverContent?.modelTurn?.parts?.[0]?.text;
            if (userText) {
               this.onMessage("mara", userText);
            }

            // Handle Function Calls
            const functionCalls = message.toolCall?.functionCalls;
            if (functionCalls && functionCalls.length > 0) {
              for (const call of functionCalls) {
                const args = call.args as any;

                if (call.name === "controlAndroidHardware") {
                  if (args.feature === "torch_on") this.onAndroidAction("torch_toggle", { enable: true });
                  else if (args.feature === "torch_off") this.onAndroidAction("torch_toggle", { enable: false });
                  else if (args.feature === "vibrate") this.onAndroidAction("vibrate");
                  else if (args.feature === "camera") this.onAndroidAction("camera_open");
                  else if (args.feature === "battery") this.onAndroidAction("battery_check");
                  else if (args.feature === "screen_torch") this.onAndroidAction("screen_torch", { enable: true });
                  else if (args.feature === "background_on") this.onAndroidAction("background_toggle", { enable: true });
                  else if (args.feature === "floating_pip") this.onAndroidAction("floating_pip");
                  else if (args.feature === "all_apps") this.onAndroidAction("all_apps_open");
                } else if (call.name === "executePhoneAction") {
                  if (args.type === "call") {
                    this.onAndroidAction("call", { number: args.target, name: args.target });
                  } else if (args.type === "sms") {
                    this.onAndroidAction("sms", { number: args.target, message: args.message || "" });
                  } else if (args.type === "whatsapp") {
                    this.onAndroidAction("whatsapp", { number: args.target, message: args.message || "" });
                  }
                } else if (call.name === "launchAndroidApp") {
                  this.onAndroidAction("app_open", { app: args.appName, query: args.query });
                } else if (call.name === "manageClock") {
                  if (args.action === "alarm") {
                    this.onAndroidAction("alarm_set", { timeRaw: args.value });
                  } else if (args.action === "timer") {
                    const sec = parseInt(args.value) || 60;
                    this.onAndroidAction("timer_set", { seconds: sec, label: `${args.value} Timer` });
                  }
                }

                // Send tool response confirmation to Gemini Live
                this.sessionPromise?.then(session => {
                   session.sendToolResponse({
                     functionResponses: [{
                       name: call.name,
                       id: call.id,
                       response: { result: "Android hardware command executed successfully." }
                     }]
                   });
                }).catch(() => {});
              }
            }
          },
          onclose: () => {
            console.log("Live API Closed");
            this.stop();
          },
          onerror: (err) => {
            console.error("Live API Error:", err);
            this.stop();
          }
        }
      });

    } catch (error) {
      console.error("Failed to start Live Session:", error);
      this.stop();
    }
  }

  private playAudioChunk(base64Data: string) {
    if (!this.playbackContext || this.isMuted) return;
    
    try {
      const binaryString = atob(base64Data);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const buffer = new Int16Array(bytes.buffer);
      const audioBuffer = this.playbackContext.createBuffer(1, buffer.length, 24000);
      const channelData = audioBuffer.getChannelData(0);
      for (let i = 0; i < buffer.length; i++) {
        channelData[i] = buffer[i] / 32768.0;
      }
      
      const source = this.playbackContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.playbackContext.destination);
      
      const currentTime = this.playbackContext.currentTime;
      if (this.nextPlayTime < currentTime) {
        this.nextPlayTime = currentTime;
      }
      
      source.start(this.nextPlayTime);
      this.nextPlayTime += audioBuffer.duration;
      this.isPlaying = true;
      
      source.onended = () => {
        if (this.playbackContext && this.playbackContext.currentTime >= this.nextPlayTime - 0.1) {
          this.isPlaying = false;
          this.onStateChange("listening");
        }
      };
    } catch (e) {
      console.error("Error playing chunk", e);
    }
  }

  private stopPlayback() {
    if (this.playbackContext) {
      this.playbackContext.close();
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.playbackContext = new AudioContextClass({ sampleRate: 24000 });
      this.nextPlayTime = this.playbackContext.currentTime;
      this.isPlaying = false;
    }
  }

  stop() {
    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(t => t.stop());
      this.mediaStream = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.stopPlayback();
    
    if (this.sessionPromise) {
      this.sessionPromise.then(session => session.close()).catch(() => {});
      this.sessionPromise = null;
    }
    
    this.onStateChange("idle");
  }

  sendText(text: string) {
    if (this.sessionPromise) {
      this.sessionPromise.then(session => {
        session.sendRealtimeInput({ text });
      });
    }
  }
}

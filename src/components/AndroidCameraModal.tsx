import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, 
  Camera, 
  FlipHorizontal, 
  Flashlight, 
  Sparkles, 
  Check, 
  Image as ImageIcon,
  AlertCircle
} from "lucide-react";
import { playSynthesizedSound, triggerHaptic } from "../services/androidService";

interface CameraModalProps {
  onClose: () => void;
  onAnalyzePhoto: (photoBase64: string, prompt: string) => void;
}

export default function AndroidCameraModal({ onClose, onAnalyzePhoto }: CameraModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [flashActive, setFlashActive] = useState<boolean>(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [isShutterFlashing, setIsShutterFlashing] = useState<boolean>(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    let activeStream: MediaStream | null = null;

    async function startCamera() {
      try {
        setStreamError(null);
        if (stream) {
          stream.getTracks().forEach(t => t.stop());
        }

        const newStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode,
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          },
          audio: false
        });

        activeStream = newStream;
        setStream(newStream);

        if (videoRef.current) {
          videoRef.current.srcObject = newStream;
        }
      } catch (err: any) {
        console.error("Camera access error:", err);
        setStreamError("Camera permission denied or camera not found on this device.");
      }
    }

    startCamera();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(t => t.stop());
      }
    };
  }, [facingMode]);

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;

    triggerHaptic([30, 20, 50]);
    playSynthesizedSound("shutter");
    setIsShutterFlashing(true);
    setTimeout(() => setIsShutterFlashing(false), 200);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      if (facingMode === "user") {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
      setCapturedImage(dataUrl);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
  };

  const handleSendToMara = () => {
    if (capturedImage) {
      onAnalyzePhoto(capturedImage, "Mara, please inspect this photo from my Android camera and tell me what you see.");
      onClose();
    }
  };

  const toggleCamera = () => {
    triggerHaptic(30);
    setFacingMode(prev => prev === "environment" ? "user" : "environment");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-2 sm:p-4 text-white">
      {/* Hidden processing canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Shutter White Flash Animation */}
      <AnimatePresence>
        {isShutterFlashing && (
          <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-white z-60 pointer-events-none"
          />
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg h-[85vh] max-h-[720px] bg-slate-950 border border-white/20 rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between relative"
      >
        {/* Top Camera Controls */}
        <div className="absolute top-0 left-0 w-full z-20 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30">
              <Camera size={18} />
            </div>
            <span className="text-xs font-bold font-mono tracking-wider">
              {facingMode === "environment" ? "REAR 4K SENSOR" : "FRONT SELFIE"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleCamera}
              className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              title="Switch Camera"
            >
              <FlipHorizontal size={18} />
            </button>
            <button
              onClick={onClose}
              className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Live Viewport or Captured View */}
        <div className="relative flex-1 w-full bg-black flex items-center justify-center overflow-hidden">
          {streamError ? (
            <div className="flex flex-col items-center p-6 text-center text-white/70 gap-3">
              <AlertCircle size={36} className="text-rose-400" />
              <p className="text-xs">{streamError}</p>
              <button
                onClick={() => setFacingMode(prev => prev === "environment" ? "user" : "environment")}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs text-white"
              >
                Try Other Camera
              </button>
            </div>
          ) : capturedImage ? (
            <img 
              src={capturedImage} 
              alt="Captured frame" 
              className="w-full h-full object-contain"
            />
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${facingMode === "user" ? "scale-x-[-1]" : ""}`}
            />
          )}

          {/* Grid lines overlay for photography */}
          <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-20 border border-white/40">
            <div className="border-r border-b border-white" />
            <div className="border-r border-b border-white" />
            <div className="border-b border-white" />
            <div className="border-r border-b border-white" />
            <div className="border-r border-b border-white" />
            <div className="border-b border-white" />
            <div className="border-r border-white" />
            <div className="border-r border-white" />
            <div />
          </div>
        </div>

        {/* Bottom Shutter Controls */}
        <div className="p-5 bg-black/90 border-t border-white/10 flex items-center justify-between z-20">
          {capturedImage ? (
            <div className="w-full flex items-center justify-between gap-4">
              <button
                onClick={handleRetake}
                className="flex-1 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs transition-colors"
              >
                Retake
              </button>
              <button
                onClick={handleSendToMara}
                className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg"
              >
                <Sparkles size={16} />
                <span>Ask Mara</span>
              </button>
            </div>
          ) : (
            <div className="w-full flex items-center justify-around">
              <div className="w-12 h-12 flex items-center justify-center" />

              {/* Shutter Button */}
              <button
                onClick={handleCapture}
                className="w-18 h-18 rounded-full border-4 border-white p-1 flex items-center justify-center active:scale-95 transition-transform"
              >
                <div className="w-full h-full rounded-full bg-white hover:bg-white/90" />
              </button>

              <button
                onClick={toggleCamera}
                className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
                title="Switch Camera"
              >
                <FlipHorizontal size={20} />
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

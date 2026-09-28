import { useState } from "react";
import { motion } from "motion/react";
import { 
  X, 
  Phone, 
  PhoneCall, 
  Delete, 
  UserPlus, 
  Users, 
  History, 
  Clock, 
  Check,
  ArrowUpRight,
  ArrowDownLeft
} from "lucide-react";
import { playSynthesizedSound, triggerHaptic } from "../services/androidService";

interface DialerProps {
  onClose: () => void;
  onOpenContacts: () => void;
  onInitiateCall: (phoneNumber: string) => void;
}

export default function AndroidPhoneDialer({ onClose, onOpenContacts, onInitiateCall }: DialerProps) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [activeTab, setActiveTab] = useState<"keypad" | "recents">("keypad");

  const [recents, setRecents] = useState([
    { id: "r1", name: "Mummy", number: "+91 98765 43210", type: "incoming", time: "Today, 10:45 AM", duration: "3m 12s" },
    { id: "r2", name: "Papa", number: "+91 98112 34567", type: "outgoing", time: "Yesterday, 8:20 PM", duration: "1m 45s" },
    { id: "r3", name: "Rohit Sharma", number: "+91 99887 76655", type: "outgoing", time: "Yesterday, 2:15 PM", duration: "12m 04s" },
    { id: "r4", name: "+91 98991 12233", number: "+91 98991 12233", type: "missed", time: "Aug 29, 6:00 PM", duration: "Missed" },
  ]);

  const handleDigit = (digit: string) => {
    triggerHaptic(20);
    playSynthesizedSound("tap");
    setPhoneNumber(prev => prev + digit);
  };

  const handleDelete = () => {
    triggerHaptic(20);
    setPhoneNumber(prev => prev.slice(0, -1));
  };

  const handleCall = (numToCall?: string) => {
    const target = numToCall || phoneNumber;
    if (!target) return;
    triggerHaptic(50);
    playSynthesizedSound("chime");
    onInitiateCall(target);
  };

  const keys = [
    { main: "1", sub: "" },
    { main: "2", sub: "ABC" },
    { main: "3", sub: "DEF" },
    { main: "4", sub: "GHI" },
    { main: "5", sub: "JKL" },
    { main: "6", sub: "MNO" },
    { main: "7", sub: "PQRS" },
    { main: "8", sub: "TUV" },
    { main: "9", sub: "WXYZ" },
    { main: "*", sub: "" },
    { main: "0", sub: "+" },
    { main: "#", sub: "" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 text-white">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md bg-slate-950 border border-green-500/30 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-green-500/20 text-green-400 border border-green-500/30">
              <Phone size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Android Phone Dialer</h2>
              <p className="text-[11px] text-white/50">HD Voice Call & Logs</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={onOpenContacts}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 text-xs flex items-center gap-1 transition-colors"
              title="Open Contacts"
            >
              <Users size={16} />
              <span className="hidden xs:inline">Contacts</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Navigation Switcher */}
        <div className="flex items-center gap-1 p-1 bg-white/5 rounded-2xl border border-white/10">
          <button
            onClick={() => setActiveTab("keypad")}
            className={`flex-1 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === "keypad" ? "bg-green-500 text-slate-950 shadow-md" : "text-white/70 hover:text-white"
            }`}
          >
            Keypad
          </button>
          <button
            onClick={() => setActiveTab("recents")}
            className={`flex-1 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === "recents" ? "bg-green-500 text-slate-950 shadow-md" : "text-white/70 hover:text-white"
            }`}
          >
            Recent Calls
          </button>
        </div>

        {/* Tab 1: Keypad */}
        {activeTab === "keypad" && (
          <div className="flex flex-col gap-3">
            {/* Number Display */}
            <div className="h-16 flex items-center justify-between px-4 bg-white/5 rounded-2xl border border-white/10">
              <input
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Enter phone number..."
                className="w-full bg-transparent border-none outline-none font-mono text-xl sm:text-2xl text-white font-bold tracking-wider placeholder:text-white/30 text-center"
              />
              {phoneNumber && (
                <button
                  onClick={handleDelete}
                  className="p-2 text-white/60 hover:text-rose-400 transition-colors"
                >
                  <Delete size={20} />
                </button>
              )}
            </div>

            {/* Keypad Grid */}
            <div className="grid grid-cols-3 gap-2.5">
              {keys.map((k) => (
                <button
                  key={k.main}
                  onClick={() => handleDigit(k.main)}
                  className="h-14 sm:h-16 rounded-2xl bg-white/5 hover:bg-white/10 active:bg-green-500/20 active:border-green-500/40 border border-white/10 flex flex-col items-center justify-center transition-all active:scale-95"
                >
                  <span className="text-xl sm:text-2xl font-bold text-white font-mono leading-none">{k.main}</span>
                  {k.sub && <span className="text-[9px] text-white/40 tracking-widest font-mono mt-0.5">{k.sub}</span>}
                </button>
              ))}
            </div>

            {/* Call Action Button */}
            <div className="flex justify-center pt-2">
              <button
                onClick={() => handleCall()}
                disabled={!phoneNumber.trim()}
                className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-400 disabled:opacity-30 disabled:hover:bg-green-500 text-slate-950 flex items-center justify-center shadow-[0_0_25px_rgba(34,197,94,0.4)] active:scale-90 transition-all"
              >
                <PhoneCall size={26} className="fill-slate-950" />
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Recent Call Logs */}
        {activeTab === "recents" && (
          <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
            {recents.map((call) => (
              <div
                key={call.id}
                className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-between transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-white/10">
                    {call.type === "outgoing" && <ArrowUpRight size={16} className="text-cyan-400" />}
                    {call.type === "incoming" && <ArrowDownLeft size={16} className="text-green-400" />}
                    {call.type === "missed" && <ArrowDownLeft size={16} className="text-rose-400" />}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">{call.name}</h4>
                    <p className="text-[10px] text-white/50 font-mono">{call.number} • {call.time}</p>
                  </div>
                </div>

                <button
                  onClick={() => handleCall(call.number)}
                  className="p-2.5 rounded-full bg-green-500/20 text-green-400 hover:bg-green-500 hover:text-slate-950 transition-all border border-green-500/30"
                  title="Call Back"
                >
                  <Phone size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}

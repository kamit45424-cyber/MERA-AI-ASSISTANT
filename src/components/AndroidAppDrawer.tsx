import { useState } from "react";
import { motion } from "motion/react";
import {
  X,
  Search,
  Grid,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Rocket,
  CheckCircle2,
} from "lucide-react";
import { triggerHaptic } from "../services/androidService";
import {
  ALL_ANDROID_APPS,
  AndroidInstalledApp,
  resolveAppLaunchUrl,
} from "../services/allAppsService";

interface AppDrawerProps {
  onClose: () => void;
  onLaunchApp: (appName: string, url?: string, packageName?: string) => void;
}

const CATEGORIES = [
  "All",
  "Social",
  "UPI & Pay",
  "Media",
  "Shopping & Food",
  "Travel",
  "Google & System",
] as const;

export default function AndroidAppDrawer({ onClose, onLaunchApp }: AppDrawerProps) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [customAppQuery, setCustomAppQuery] = useState("");

  const filtered = ALL_ANDROID_APPS.filter((app) => {
    const matchesCategory =
      selectedCategory === "All" || app.category === selectedCategory;
    const matchesSearch =
      app.name.toLowerCase().includes(search.toLowerCase()) ||
      app.packageName.toLowerCase().includes(search.toLowerCase()) ||
      app.category.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleAppClick = (app: AndroidInstalledApp) => {
    triggerHaptic(35);
    onClose();
    if (app.internalAction) {
      onLaunchApp(app.internalAction, undefined, app.packageName);
    } else {
      const targetUrl = resolveAppLaunchUrl(app);
      onLaunchApp(app.name, targetUrl, app.packageName);
    }
  };

  const handleCustomLaunch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = customAppQuery.trim();
    if (!q) return;
    triggerHaptic(40);
    onClose();
    // Check if matches known app
    const existing = ALL_ANDROID_APPS.find(
      (a) =>
        a.name.toLowerCase().includes(q.toLowerCase()) ||
        a.id.toLowerCase() === q.toLowerCase()
    );
    if (existing) {
      if (existing.internalAction) {
        onLaunchApp(existing.internalAction, undefined, existing.packageName);
      } else {
        onLaunchApp(existing.name, existing.webUrl, existing.packageName);
      }
      return;
    }
    // Otherwise launch via Google Play / Universal Web Intent
    const url = q.includes(".")
      ? `https://play.google.com/store/apps/details?id=${encodeURIComponent(q)}`
      : `https://www.google.com/search?q=${encodeURIComponent(q + " app")}`;
    onLaunchApp(q, url, q);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2.5 sm:p-4 text-white">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl bg-slate-950 border border-emerald-500/30 rounded-3xl p-4 sm:p-6 shadow-2xl flex flex-col gap-3.5 max-h-[92vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Grid size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white">
                  All Android Phone Apps Access
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                  <CheckCircle2 size={10} />
                  {ALL_ANDROID_APPS.length} APPS LINKED
                </span>
              </div>
              <p className="text-[11px] text-white/50">
                QUERY_ALL_PACKAGES • Deep-Link & Android Intent Bridge Active
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search Input */}
        <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-white/5 border border-white/10 focus-within:border-emerald-500/50">
          <Search size={16} className="text-emerald-400 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search any installed Android app or package (e.g. WhatsApp, PhonePe, Instagram, Zomato, Uber)..."
            className="w-full bg-transparent border-none outline-none text-xs sm:text-sm text-white placeholder:text-white/40"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="text-[10px] text-white/50 hover:text-white px-1.5"
            >
              Clear
            </button>
          )}
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                triggerHaptic(15);
                setSelectedCategory(cat);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? "bg-emerald-500 text-slate-950 shadow-md"
                  : "bg-white/5 hover:bg-white/10 text-white/70 border border-white/5"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Apps Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5 sm:gap-3 overflow-y-auto pr-1 py-1 max-h-[420px] scrollbar-hide">
          {filtered.map((app) => (
            <button
              key={app.id}
              onClick={() => handleAppClick(app)}
              className="flex flex-col items-center justify-between gap-2 p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 hover:border-emerald-500/40 border border-white/5 transition-all group active:scale-95 text-center relative"
              title={`${app.name} (${app.packageName})`}
            >
              <div
                className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr ${app.gradient} flex items-center justify-center text-white font-bold text-xs sm:text-sm tracking-tight shadow-md group-hover:scale-105 transition-transform`}
              >
                {app.badgeText}
              </div>
              <div className="w-full">
                <span className="text-[11px] font-semibold text-white truncate block">
                  {app.name}
                </span>
                <span className="text-[9px] font-mono text-white/40 truncate block">
                  {app.packageName}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Custom Any-App / Package Intent Launcher */}
        <form
          onSubmit={handleCustomLaunch}
          className="pt-2 border-t border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
        >
          <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10">
            <Rocket size={14} className="text-cyan-400 shrink-0" />
            <input
              type="text"
              value={customAppQuery}
              onChange={(e) => setCustomAppQuery(e.target.value)}
              placeholder="Launch any custom Android app or package ID (e.g. 'Hotstar', 'in.swiggy.android')..."
              className="w-full bg-transparent border-none outline-none text-xs text-white placeholder:text-white/40"
            />
          </div>
          <button
            type="submit"
            disabled={!customAppQuery.trim()}
            className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shrink-0"
          >
            <ExternalLink size={13} />
            <span>Open App</span>
          </button>
        </form>
      </motion.div>
    </div>
  );
}

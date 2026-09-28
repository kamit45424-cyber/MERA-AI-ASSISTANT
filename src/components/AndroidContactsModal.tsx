import { useState, type FormEvent } from "react";
import { motion } from "motion/react";
import { 
  X, 
  Users, 
  Search, 
  Phone, 
  MessageSquare, 
  Share2, 
  Star, 
  UserPlus, 
  Check, 
  Plus
} from "lucide-react";
import { Contact } from "../types";
import { triggerHaptic } from "../services/androidService";

interface ContactsModalProps {
  contacts: Contact[];
  onClose: () => void;
  onCall: (phone: string) => void;
  onSMS: (phone: string, name: string) => void;
  onWhatsApp: (phone: string, name: string) => void;
  onAddContact: (contact: Contact) => void;
}

export default function AndroidContactsModal({
  contacts,
  onClose,
  onCall,
  onSMS,
  onWhatsApp,
  onAddContact,
}: ContactsModalProps) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newCategory, setNewCategory] = useState<"Family" | "Work" | "Friends" | "Emergency">("Friends");

  const filtered = contacts.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search);
    const matchesCat = selectedCategory === "All" || c.category === selectedCategory || (selectedCategory === "Favorites" && c.favorite);
    return matchesSearch && matchesCat;
  });

  const handleSaveContact = (e: FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPhone.trim()) return;

    const colors = [
      "from-purple-500 to-indigo-500",
      "from-emerald-500 to-teal-500",
      "from-rose-500 to-pink-500",
      "from-amber-500 to-orange-500",
      "from-cyan-500 to-blue-500"
    ];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const created: Contact = {
      id: "c_" + Date.now(),
      name: newName.trim(),
      phone: newPhone.trim(),
      category: newCategory,
      avatarColor: randomColor,
      favorite: false
    };

    onAddContact(created);
    setNewName("");
    setNewPhone("");
    setShowAddForm(false);
    triggerHaptic(40);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 text-white">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg bg-slate-950 border border-blue-500/30 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <Users size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Android Contacts</h2>
              <p className="text-[11px] text-white/50">{contacts.length} Contacts Synced</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="p-2 rounded-xl bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 border border-blue-500/30 text-xs flex items-center gap-1 transition-colors"
            >
              <UserPlus size={16} />
              <span className="hidden xs:inline">Add</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Add Contact Form (Toggleable) */}
        {showAddForm && (
          <form onSubmit={handleSaveContact} className="p-3.5 rounded-2xl bg-blue-950/40 border border-blue-500/40 flex flex-col gap-2.5">
            <span className="text-xs font-bold text-blue-300">Add New Phone Contact</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Full Name (e.g. Rahul)"
                className="px-3 py-2 rounded-xl bg-white/10 border border-white/10 text-xs text-white placeholder:text-white/40 outline-none"
                required
              />
              <input
                type="tel"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="Phone (+91...)"
                className="px-3 py-2 rounded-xl bg-white/10 border border-white/10 text-xs text-white placeholder:text-white/40 outline-none font-mono"
                required
              />
            </div>
            <div className="flex items-center justify-between gap-2 pt-1">
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as any)}
                className="px-2.5 py-1.5 rounded-xl bg-white/10 border border-white/10 text-xs text-white outline-none"
              >
                <option value="Family" className="bg-slate-900">Family</option>
                <option value="Friends" className="bg-slate-900">Friends</option>
                <option value="Work" className="bg-slate-900">Work</option>
                <option value="Emergency" className="bg-slate-900">Emergency</option>
              </select>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-white/70"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold text-xs"
                >
                  Save
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Search Bar */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-white/5 border border-white/10">
          <Search size={16} className="text-white/50" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or number..."
            className="w-full bg-transparent border-none outline-none text-xs text-white placeholder:text-white/40"
          />
        </div>

        {/* Categories Bar */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide text-xs">
          {["All", "Favorites", "Family", "Friends", "Work", "Emergency"].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap font-medium transition-all ${
                selectedCategory === cat
                  ? "bg-blue-500 text-slate-950 font-bold shadow-sm"
                  : "bg-white/5 hover:bg-white/10 text-white/70 hover:text-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Contacts List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[380px]">
          {filtered.length === 0 ? (
            <div className="text-center py-8 text-white/40 text-xs">
              No contacts found matching search.
            </div>
          ) : (
            filtered.map((contact) => (
              <div
                key={contact.id}
                className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-between transition-colors gap-2"
              >
                {/* Contact Avatar & Info */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-10 h-10 rounded-2xl bg-gradient-to-tr ${contact.avatarColor} flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-md`}>
                    {contact.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 overflow-hidden">
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs font-bold text-white truncate">{contact.name}</h4>
                      {contact.favorite && <Star size={12} className="text-amber-400 fill-amber-400 shrink-0" />}
                    </div>
                    <p className="text-[11px] text-white/50 font-mono truncate">{contact.phone}</p>
                  </div>
                </div>

                {/* Direct Action Intents (Call, SMS, WhatsApp) */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => onCall(contact.phone)}
                    className="p-2 rounded-xl bg-green-500/20 text-green-400 hover:bg-green-500 hover:text-slate-950 transition-all border border-green-500/30"
                    title={`Call ${contact.name}`}
                  >
                    <Phone size={14} />
                  </button>
                  <button
                    onClick={() => onSMS(contact.phone, contact.name)}
                    className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500 hover:text-slate-950 transition-all border border-cyan-500/30"
                    title={`SMS to ${contact.name}`}
                  >
                    <MessageSquare size={14} />
                  </button>
                  <button
                    onClick={() => onWhatsApp(contact.phone, contact.name)}
                    className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-slate-950 transition-all border border-emerald-500/30"
                    title={`WhatsApp ${contact.name}`}
                  >
                    <Share2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}

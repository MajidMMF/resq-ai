import React, { useState } from "react";
import useAuth from "../../hooks/useAuth";
import PageHeader from "../../components/shared/PageHeader";
import { User, Phone, Mail, Shield, Heart, Plus, Trash2, LogOut } from "lucide-react";
import { toast } from "sonner";

export const Profile = () => {
  const { user, logout } = useAuth();

  const [emergencyContacts, setEmergencyContacts] = useState([
    { name: "Sarah Johnson", relation: "Spouse", phone: "+91 9876543210" },
  ]);

  const [newContact, setNewContact] = useState({ name: "", relation: "", phone: "" });
  const [showAddContact, setShowAddContact] = useState(false);

  const handleAddContact = (e) => {
    e.preventDefault();
    if (!newContact.name || !newContact.phone) {
      toast.error("Contact name and phone are required");
      return;
    }
    setEmergencyContacts([...emergencyContacts, newContact]);
    setNewContact({ name: "", relation: "", phone: "" });
    setShowAddContact(false);
    toast.success("Emergency contact saved");
  };

  const handleRemoveContact = (index) => {
    setEmergencyContacts(emergencyContacts.filter((_, i) => i !== index));
    toast.info("Contact removed");
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="User Profile & Safety"
        subtitle="Manage personal details, verified identity, and rapid emergency contacts."
      />

      {/* 1. Account Details Card */}
      <div className="p-6 rounded-2xl bg-dark-900 border border-dark-700 shadow-xl space-y-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-2xl bg-dark-800 border-2 border-cyan-400/40 flex items-center justify-center text-xl font-bold text-cyan-400 shadow-lg shadow-cyan-950/40">
            {user?.name ? user.name[0].toUpperCase() : "U"}
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">{user?.name || "Citizen User"}</h2>
            <p className="text-xs text-dark-400 font-mono mt-0.5">{user?.email}</p>
            <div className="flex items-center space-x-2 mt-2">
              <span className="px-2 py-0.5 rounded bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 text-[10px] font-bold font-mono">
                {user?.roles?.join(", ") || "USER"}
              </span>
              <span className="px-2 py-0.5 rounded bg-success-500/15 border border-success-500/30 text-success-400 text-[10px] font-bold font-mono">
                VERIFIED
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-dark-700/80">
          <div>
            <label className="block text-xs uppercase font-mono text-dark-400 mb-1">Full Name</label>
            <div className="flex items-center space-x-2 p-3 rounded-xl bg-dark-800 border border-dark-700 text-sm text-slate-200">
              <User className="w-4 h-4 text-dark-400" />
              <span>{user?.name || "Not provided"}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase font-mono text-dark-400 mb-1">Email Address</label>
            <div className="flex items-center space-x-2 p-3 rounded-xl bg-dark-800 border border-dark-700 text-sm text-slate-200">
              <Mail className="w-4 h-4 text-dark-400" />
              <span>{user?.email || "Not provided"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Emergency Contacts (Crucial for Triage) */}
      <div className="p-6 rounded-2xl bg-dark-900 border border-dark-700 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Heart className="w-4 h-4 text-emergency-500" />
              <span>Saved Emergency Contacts</span>
            </h3>
            <p className="text-xs text-dark-400">
              Authorized contacts accessible to ER staff in critical triage scenarios.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowAddContact(!showAddContact)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emergency-600/20 hover:bg-emergency-600/30 border border-emergency-500/40 text-emergency-400 font-semibold text-xs transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Contact</span>
          </button>
        </div>

        {/* Add Contact Form */}
        {showAddContact && (
          <form onSubmit={handleAddContact} className="p-4 rounded-xl bg-dark-800 border border-dark-600 space-y-3">
            <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">New Contact</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                value={newContact.name}
                onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                placeholder="Full Name"
                className="bg-dark-700 border border-dark-600 rounded-xl px-3 py-2 text-xs text-white"
              />
              <input
                type="text"
                value={newContact.relation}
                onChange={(e) => setNewContact({ ...newContact, relation: e.target.value })}
                placeholder="Relation (e.g. Parent)"
                className="bg-dark-700 border border-dark-600 rounded-xl px-3 py-2 text-xs text-white"
              />
              <input
                type="tel"
                value={newContact.phone}
                onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                placeholder="Phone (+91...)"
                className="bg-dark-700 border border-dark-600 rounded-xl px-3 py-2 text-xs text-white font-mono"
              />
            </div>
            <div className="flex justify-end space-x-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAddContact(false)}
                className="px-3 py-1.5 rounded-lg border border-dark-600 text-xs text-dark-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-emergency-600 text-white font-bold text-xs shadow-md"
              >
                Save Contact
              </button>
            </div>
          </form>
        )}

        {/* Contacts List */}
        <div className="space-y-2.5">
          {emergencyContacts.map((c, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-dark-800/60 border border-dark-700 flex items-center justify-between"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-dark-700 flex items-center justify-center text-emergency-400">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">
                    {c.name} {c.relation && <span className="text-dark-400 font-normal">({c.relation})</span>}
                  </p>
                  <p className="text-[11px] text-cyan-400 font-mono mt-0.5">{c.phone}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleRemoveContact(idx)}
                className="p-1.5 text-dark-500 hover:text-emergency-400 transition"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Security & Sign Out */}
      <div className="p-6 rounded-2xl bg-dark-900 border border-dark-700 shadow-xl flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-white">Sign Out of ResQ AI</h3>
          <p className="text-xs text-dark-400 mt-0.5">End your current session on this device.</p>
        </div>

        <button
          type="button"
          onClick={logout}
          className="px-5 py-2.5 rounded-xl bg-dark-800 hover:bg-emergency-900/30 border border-dark-600 hover:border-emergency-500/50 text-emergency-400 font-bold text-xs transition active:scale-95 flex items-center space-x-2"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export default Profile;


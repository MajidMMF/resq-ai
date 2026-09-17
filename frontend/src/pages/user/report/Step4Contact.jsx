import React from "react";
import { Phone, UserCheck, Shield } from "lucide-react";

export const Step4Contact = ({ formData, updateForm, nextStep, prevStep }) => {
  const { contact } = formData;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-white mb-1">Emergency Contact (Optional)</h3>
        <p className="text-xs text-dark-400">
          Provide someone who can be notified by ResQ dispatchers or medical staff if needed.
        </p>
      </div>

      <div className="p-5 rounded-2xl bg-dark-800 border border-dark-600 space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-dark-400 mb-1">
            Contact Name
          </label>
          <input
            type="text"
            value={contact.name}
            onChange={(e) =>
              updateForm({ contact: { ...contact, name: e.target.value } })
            }
            placeholder="e.g., Sarah Johnson (Spouse / Parent)"
            className="w-full bg-dark-700 border border-dark-600 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-dark-500 focus:outline-none focus:border-cyan-400"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-dark-400 mb-1">
            Contact Phone Number
          </label>
          <input
            type="tel"
            value={contact.phone}
            onChange={(e) =>
              updateForm({ contact: { ...contact, phone: e.target.value } })
            }
            placeholder="+91 9876543210"
            className="w-full bg-dark-700 border border-dark-600 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-dark-500 focus:outline-none focus:border-cyan-400 font-mono"
          />
        </div>

        <div className="flex items-start space-x-2 pt-2 text-[11px] text-dark-400">
          <Shield className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <span>
            This contact will ONLY be reached by hospital triage staff in case of serious patient
            injury.
          </span>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-dark-700">
        <button
          type="button"
          onClick={prevStep}
          className="px-5 py-2.5 rounded-xl border border-dark-600 hover:bg-dark-700 text-xs font-semibold text-dark-300"
        >
          &larr; Back
        </button>

        <button
          type="button"
          onClick={nextStep}
          className="px-8 py-3 rounded-xl bg-emergency-600 hover:bg-emergency-500 text-white font-bold text-xs shadow-lg shadow-emergency-600/30 transition active:scale-95"
        >
          Next: Review & Confirm &rarr;
        </button>
      </div>
    </div>
  );
};

export default Step4Contact;


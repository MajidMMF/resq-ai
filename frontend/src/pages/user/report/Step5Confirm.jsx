import React from "react";
import { AlertTriangle, ShieldCheck, MapPin, Image, Phone, FileText, Loader2 } from "lucide-react";
import useReverseGeocode from "../../../hooks/useReverseGeocode";

export const Step5Confirm = ({ formData, onSubmit, prevStep, isSubmitting }) => {
  const { type, location, images, description, contact } = formData;
  const { placeName, address } = useReverseGeocode(location?.lat, location?.lng);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-white mb-1">Review & Dispatch</h3>
        <p className="text-xs text-dark-400">
          Verify incident details before submitting to the automated AI triage network.
        </p>
      </div>

      {/* Summary Container */}
      <div className="p-5 rounded-2xl bg-dark-800 border border-dark-600 space-y-4 text-xs">
        {/* Type & Location */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-dark-700">
          <div>
            <span className="text-[10px] uppercase font-mono text-dark-400 block mb-1">Incident Type</span>
            <span className="font-bold text-white text-sm uppercase">{type.replace(/_/g, " ")}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono text-dark-400 block mb-1">Incident Location</span>
            <span className="font-bold text-white text-sm block">
              {placeName || `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`}
            </span>
            {address && (
              <span className="text-[11px] text-dark-400 truncate block mt-0.5" title={address}>
                {address}
              </span>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="pb-4 border-b border-dark-700">
          <span className="text-[10px] uppercase font-mono text-dark-400 block mb-1">Scene Description</span>
          <p className="text-slate-200 leading-relaxed font-sans">
            {description || "No written description provided. AI vision & GPS will guide dispatch."}
          </p>
        </div>

        {/* Evidence & Contact */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <span className="text-[10px] uppercase font-mono text-dark-400 block mb-1">Photos Attached</span>
            <span className="text-white font-medium">{images.length} photo(s) ready for upload</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono text-dark-400 block mb-1">Emergency Contact</span>
            <span className="text-white font-medium">
              {contact.name ? `${contact.name} (${contact.phone})` : "None specified"}
            </span>
          </div>
        </div>
      </div>

      {/* Legal & Medical Banner */}
      <div className="p-4 rounded-xl bg-emergency-950/30 border border-emergency-500/30 flex items-start space-x-3 text-xs text-emergency-300">
        <AlertTriangle className="w-5 h-5 text-emergency-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <span className="font-bold">Automated EMS Dispatch:</span> Submitting will immediately
          trigger AI classification, locate nearby ambulances, and notify trauma centers.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-dark-700">
        <button
          type="button"
          onClick={prevStep}
          disabled={isSubmitting}
          className="px-5 py-2.5 rounded-xl border border-dark-600 hover:bg-dark-700 text-xs font-semibold text-dark-300 disabled:opacity-50"
        >
          &larr; Back
        </button>

        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting}
          className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-emergency-600 via-emergency-500 to-emergency-600 text-white font-extrabold text-xs uppercase tracking-wider shadow-xl shadow-emergency-600/40 hover:scale-105 active:scale-95 transition flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Broadcasting Emergency...</span>
            </>
          ) : (
            <>
              <ShieldCheck className="w-4 h-4" />
              <span>Confirm & Dispatch Rescue</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default Step5Confirm;


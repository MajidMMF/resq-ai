import React from "react";
import { Check, X, ShieldAlert, HeartPulse, Activity } from "lucide-react";
import PriorityBadge from "../../../components/shared/PriorityBadge";

export const AIAnalysisCard = ({ analysis = {} }) => {
  const {
    incidentType = "ROAD_ACCIDENT",
    priority = "HIGH",
    confidence = 94,
    sceneDescription = "Two-vehicle collision with passenger side impact.",
    hazards = ["Spilled engine oil", "High-speed traffic lane"],
    dos = [
      "Keep victims still; avoid moving neck or spine",
      "Turn off vehicle ignition if accessible without entering",
      "Deploy warning markers 50m behind incident",
    ],
    donts = [
      "DO NOT remove helmet of motorcycle victims",
      "DO NOT offer fluids or food to unconscious or semi-conscious persons",
      "DO NOT pull trapped victims from crushed vehicle frames",
    ],
  } = analysis;

  return (
    <div className="p-6 rounded-2xl bg-dark-900 border border-dark-700 shadow-xl space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-dark-700/80">
        <div>
          <div className="flex items-center space-x-2.5">
            <span className="text-xs font-mono uppercase text-dark-400">Classified as</span>
            <span className="text-sm font-bold text-white uppercase">{incidentType.replace(/_/g, " ")}</span>
          </div>
          <p className="text-xs text-dark-300 mt-1">{sceneDescription}</p>
        </div>

        <div className="flex items-center space-x-3">
          <PriorityBadge priority={priority} />
          <div className="px-2.5 py-1 rounded-lg bg-dark-800 border border-dark-600 text-cyan-400 font-mono text-xs font-bold">
            {confidence}% Confidence
          </div>
        </div>
      </div>

      {/* Hazards Tag List */}
      {hazards.length > 0 && (
        <div>
          <span className="text-[10px] uppercase font-mono tracking-wider text-warning-400 font-bold block mb-1.5 flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5 text-warning-400" />
            Detected Scene Hazards:
          </span>
          <div className="flex flex-wrap gap-2">
            {hazards.map((h, i) => (
              <span
                key={i}
                className="px-2.5 py-1 rounded-lg bg-warning-500/10 border border-warning-500/30 text-warning-300 text-xs font-medium"
              >
                ⚠ {h}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Immediate Guidance: Do's and Don'ts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* DO's */}
        <div className="p-4 rounded-xl bg-success-500/5 border border-success-500/20">
          <h4 className="text-xs font-bold text-success-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <Check className="w-4 h-4 text-success-400 stroke-[3]" />
            Immediate Bystander Actions (DO):
          </h4>
          <ul className="space-y-2 text-xs text-slate-200">
            {dos.map((item, idx) => (
              <li key={idx} className="flex items-start space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-success-400 shrink-0 mt-1.5" />
                <span className="leading-tight">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* DONT's */}
        <div className="p-4 rounded-xl bg-emergency-500/5 border border-emergency-500/20">
          <h4 className="text-xs font-bold text-emergency-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <X className="w-4 h-4 text-emergency-400 stroke-[3]" />
            Dangerous Actions (DO NOT):
          </h4>
          <ul className="space-y-2 text-xs text-slate-200">
            {donts.map((item, idx) => (
              <li key={idx} className="flex items-start space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emergency-400 shrink-0 mt-1.5" />
                <span className="leading-tight">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <p className="text-[10px] text-dark-400 text-center font-mono">
        AI assists emergency response. Professional medical teams are being coordinated.
      </p>
    </div>
  );
};

export default AIAnalysisCard;


import React from "react";
import { Check } from "lucide-react";

const LIFECYCLE_STEPS = [
  { id: "REPORTED", label: "Reported" },
  { id: "ANALYZED", label: "AI Triaged" },
  { id: "HOSPITAL_SELECTED", label: "Hospital Alerted" },
  { id: "AMBULANCE_REQUESTED", label: "Ambulance Dispatched" },
  { id: "ARRIVED", label: "Arrived On Scene" },
  { id: "IN_TRANSIT", label: "En Route to ER" },
  { id: "RESOLVED", label: "Admitted & Resolved" },
];

export const StatusStepper = ({ currentStatus = "REPORTED" }) => {
  const getStepIndex = (status) => {
    switch (status) {
      case "REPORTED":
      case "ANALYZING":
        return 0;
      case "TRIAGED":
      case "ANALYZED":
        return 1;
      case "HOSPITAL_SELECTED":
      case "HOSPITAL_ACCEPTED":
      case "HOSPITAL_READY":
        return 2;
      case "AMBULANCE_REQUESTED":
      case "AMBULANCE_ACCEPTED":
      case "EN_ROUTE":
        return 3;
      case "ARRIVED":
      case "OTP_VERIFIED":
        return 4;
      case "IN_TRANSIT":
      case "PATIENT_ADMITTED":
        return 5;
      case "RESOLVED":
      case "COMPLETED":
        return 6;
      default:
        return 0;
    }
  };

  const currentIndex = getStepIndex(currentStatus);

  return (
    <div className="p-4 rounded-2xl bg-dark-900 border border-dark-700/80 shadow-md">
      <div className="flex items-center justify-between relative overflow-x-auto py-2">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-dark-700 w-full z-0" />
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-gradient-to-r from-cyan-400 to-emergency-500 z-0 transition-all duration-500"
          style={{ width: `${(currentIndex / (LIFECYCLE_STEPS.length - 1)) * 100}%` }}
        />

        {LIFECYCLE_STEPS.map((s, idx) => {
          const isDone = idx < currentIndex;
          const isCurrent = idx === currentIndex;

          return (
            <div key={s.id} className="relative z-10 flex flex-col items-center shrink-0 px-2 sm:px-0">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition ${
                  isDone
                    ? "bg-cyan-500 text-dark-950"
                    : isCurrent
                    ? "bg-emergency-600 text-white ring-4 ring-emergency-500/25"
                    : "bg-dark-800 border border-dark-600 text-dark-400"
                }`}
              >
                {isDone ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : idx + 1}
              </div>
              <span
                className={`text-[9px] font-mono mt-1 text-center whitespace-nowrap ${
                  isCurrent ? "text-cyan-400 font-bold" : isDone ? "text-slate-300" : "text-dark-500"
                }`}
              >
                {s.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StatusStepper;


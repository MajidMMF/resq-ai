import React, { useState, useEffect } from "react";
import { CheckCircle2, Loader2, Sparkles } from "lucide-react";

const STAGES = [
  "Extracting visual coordinates & road telemetry...",
  "Analyzing vehicle deformation & entrapment risk...",
  "Classifying trauma priority (Level 1–4)...",
  "Evaluating nearby hospital trauma ICU capabilities...",
  "Generating immediate bystander first-aid guidance...",
];

export const AIProcessingTimeline = ({ onComplete }) => {
  const [currentStage, setCurrentStage] = useState(0);

  useEffect(() => {
    if (currentStage < STAGES.length - 1) {
      const timer = setTimeout(() => {
        setCurrentStage((prev) => prev + 1);
      }, 1200);
      return () => clearTimeout(timer);
    } else if (onComplete) {
      const finalTimer = setTimeout(onComplete, 800);
      return () => clearTimeout(finalTimer);
    }
  }, [currentStage, onComplete]);

  return (
    <div className="p-6 rounded-2xl bg-dark-900 border border-cyan-500/30 shadow-2xl relative overflow-hidden">
      <div className="flex items-center space-x-2.5 mb-5 pb-3 border-b border-dark-700">
        <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
          <Sparkles className="w-4 h-4 animate-spin" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white tracking-tight">
            ResQ AI Autonomous Triage Engine
          </h3>
          <p className="text-[10px] text-cyan-400 font-mono">
            Multi-Agent LangGraph Vision & Medical Pipeline
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {STAGES.map((text, idx) => {
          const isDone = idx < currentStage;
          const isCurrent = idx === currentStage;

          return (
            <div
              key={idx}
              className={`flex items-center space-x-3 text-xs transition-opacity duration-300 ${
                isDone
                  ? "text-slate-300 opacity-90"
                  : isCurrent
                  ? "text-cyan-400 font-bold"
                  : "text-dark-500 opacity-40"
              }`}
            >
              {isDone ? (
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
              ) : isCurrent ? (
                <Loader2 className="w-4 h-4 text-cyan-400 animate-spin shrink-0" />
              ) : (
                <div className="w-4 h-4 rounded-full border border-dark-600 shrink-0" />
              )}
              <span className="leading-tight">{text}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AIProcessingTimeline;


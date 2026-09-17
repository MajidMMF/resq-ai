import React, { useState } from "react";
import { Mic, MicOff, Volume2 } from "lucide-react";
import { toast } from "sonner";

export const Step3Describe = ({ formData, updateForm, nextStep, prevStep }) => {
  const { description } = formData;
  const [isRecording, setIsRecording] = useState(false);

  // Web Speech API speech-to-text
  const toggleSpeechRecognition = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.error("Voice dictation is not supported in this browser");
      return;
    }

    if (isRecording) {
      setIsRecording(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setIsRecording(true);
        toast.info("Listening... Speak scene description");
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        const updated = description ? `${description} ${transcript}` : transcript;
        updateForm({ description: updated });
        setIsRecording(false);
        toast.success("Voice transcript captured");
      };

      recognition.onerror = (err) => {
        console.warn("Speech error:", err);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.start();
    } catch (e) {
      setIsRecording(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-white mb-1">Describe The Scene</h3>
        <p className="text-xs text-dark-400">
          Mention injuries, trapped persons, vehicle smoke, or dangerous fluids on the road.
        </p>
      </div>

      {/* Textarea + Voice Button */}
      <div className="relative">
        <textarea
          rows={5}
          value={description}
          onChange={(e) => updateForm({ description: e.target.value })}
          placeholder="e.g., Two cars collided at intersection. Driver in sedan appears unconscious with head laceration. Smoke coming from engine."
          className="w-full rounded-2xl bg-dark-800 border border-dark-600 p-4 text-sm text-slate-100 placeholder:text-dark-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition leading-relaxed"
        />

        {/* Voice Dictation Trigger */}
        <button
          type="button"
          onClick={toggleSpeechRecognition}
          className={`absolute right-3.5 bottom-3.5 px-3 py-1.5 rounded-xl border flex items-center space-x-1.5 text-xs font-semibold transition ${
            isRecording
              ? "bg-emergency-600 border-emergency-400 text-white animate-pulse"
              : "bg-dark-700/80 border-dark-600 text-cyan-400 hover:bg-dark-600"
          }`}
        >
          {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
          <span>{isRecording ? "Listening..." : "Speak Description"}</span>
        </button>
      </div>

      {/* Suggested Quick Tags */}
      <div>
        <span className="text-[10px] uppercase font-mono tracking-wider text-dark-400 block mb-2">
          Quick Incident Tags:
        </span>
        <div className="flex flex-wrap gap-2">
          {[
            "Unconscious victim",
            "Trapped in car",
            "Severe bleeding",
            "Smoke / Fire",
            "Children involved",
            "Motorcyclist down",
          ].map((tag) => (
            <button
              type="button"
              key={tag}
              onClick={() => {
                const updated = description ? `${description}. ${tag}` : tag;
                updateForm({ description: updated });
              }}
              className="px-2.5 py-1 rounded-lg bg-dark-700 hover:bg-dark-600 border border-dark-600 text-[11px] text-dark-300 transition"
            >
              + {tag}
            </button>
          ))}
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
          Next: Emergency Contact &rarr;
        </button>
      </div>
    </div>
  );
};

export default Step3Describe;


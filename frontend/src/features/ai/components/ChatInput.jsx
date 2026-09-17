import React, { useState } from "react";
import { Send, Mic, MicOff } from "lucide-react";
import { toast } from "sonner";

export const ChatInput = ({ onSend, disabled = false }) => {
  const [text, setText] = useState("");
  const [isListening, setIsListening] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim() || disabled) return;
    onSend(text.trim());
    setText("");
  };

  const toggleSpeech = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.error("Voice input is not supported in this browser");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "en-US";
      recognition.onstart = () => {
        setIsListening(true);
        toast.info("Listening...");
      };
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setText((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setIsListening(false);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-3 border-t border-dark-700 bg-dark-950 flex items-center space-x-2">
      <button
        type="button"
        onClick={toggleSpeech}
        className={`p-2 rounded-xl border transition ${
          isListening
            ? "bg-emergency-600 border-emergency-500 text-white animate-pulse"
            : "bg-dark-800 border-dark-700 text-dark-400 hover:text-cyan-400"
        }`}
        title="Voice Input"
      >
        {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
      </button>

      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Ask medical / triage question..."
        disabled={disabled}
        className="flex-1 bg-dark-800 border border-dark-600 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-dark-500 focus:outline-none focus:border-cyan-400 disabled:opacity-50"
      />

      <button
        type="submit"
        disabled={!text.trim() || disabled}
        className="p-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-dark-950 font-bold disabled:opacity-40 disabled:cursor-not-allowed transition"
      >
        <Send className="w-4 h-4" />
      </button>
    </form>
  );
};

export default ChatInput;


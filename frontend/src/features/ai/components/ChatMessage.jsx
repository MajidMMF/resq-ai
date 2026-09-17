import React from "react";
import { Bot, User } from "lucide-react";

export const ChatMessage = ({ message }) => {
  const isAi = message.role === "assistant" || message.sender === "ai";

  return (
    <div className={`flex items-start space-x-2.5 ${isAi ? "" : "flex-row-reverse space-x-reverse"}`}>
      <div
        className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
          isAi
            ? "bg-cyan-500/10 border border-cyan-500/30 text-cyan-400"
            : "bg-emergency-600/20 border border-emergency-500/40 text-emergency-400"
        }`}
      >
        {isAi ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
      </div>

      <div
        className={`p-3 rounded-2xl text-xs max-w-[80%] leading-relaxed ${
          isAi
            ? "bg-dark-800 border border-dark-700 text-slate-200"
            : "bg-emergency-600 text-white shadow-md shadow-emergency-600/20"
        }`}
      >
        <p className="whitespace-pre-wrap">{message.text || message.content}</p>
        <span className="text-[9px] text-dark-400 font-mono mt-1 block text-right">
          {new Date(message.timestamp || Date.now()).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
    </div>
  );
};

export default ChatMessage;


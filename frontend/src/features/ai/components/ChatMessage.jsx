import React from "react";
import { Bot, User } from "lucide-react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

export const ChatMessage = ({ message }) => {
  const isAi = message.role === "assistant" || message.sender === "ai";
  const content = message.text || message.content || "";

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
        className={`p-3 rounded-2xl text-xs max-w-[85%] leading-relaxed ${
          isAi
            ? "bg-dark-800 border border-dark-700 text-slate-200"
            : "bg-emergency-600 text-white shadow-md shadow-emergency-600/20"
        }`}
      >
        {isAi ? (
          <div className="text-slate-200 space-y-2">
            <Markdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ children }) => (
                  <h1 className="text-sm font-bold text-white mt-2 mb-1 border-b border-dark-600 pb-1">
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-xs font-bold text-cyan-400 mt-2 mb-1">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-xs font-semibold text-cyan-300 mt-1.5 mb-1">
                    {children}
                  </h3>
                ),
                p: ({ children }) => (
                  <p className="mb-2 whitespace-pre-wrap leading-relaxed">{children}</p>
                ),
                ul: ({ children }) => (
                  <ul className="mb-2 list-disc pl-4 space-y-1">{children}</ul>
                ),
                ol: ({ children }) => (
                  <ol className="mb-2 list-decimal pl-4 space-y-1">{children}</ol>
                ),
                li: ({ children }) => (
                  <li className="leading-relaxed">{children}</li>
                ),
                strong: ({ children }) => (
                  <strong className="font-bold text-white">{children}</strong>
                ),
                em: ({ children }) => <em className="italic text-slate-300">{children}</em>,
                blockquote: ({ children }) => (
                  <blockquote className="border-l-2 border-cyan-500/60 pl-3 my-2 text-dark-300 italic bg-dark-700/40 py-1 rounded-r">
                    {children}
                  </blockquote>
                ),
                code: ({ children }) => (
                  <code className="px-1.5 py-0.5 rounded bg-dark-700 text-cyan-400 font-mono text-[11px]">
                    {children}
                  </code>
                ),
              }}
            >
              {content}
            </Markdown>
          </div>
        ) : (
          <p className="whitespace-pre-wrap">{content}</p>
        )}

        <span className="text-[9px] text-dark-400 font-mono mt-1.5 block text-right">
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


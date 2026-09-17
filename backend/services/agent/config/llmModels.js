import dotenv from "dotenv";
import { ChatOpenRouter } from "@langchain/openrouter";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatGroq } from "@langchain/groq";

dotenv.config();

const getKey = (k) => process.env[k]?.trim();

/* OpenRouter (DeepSeek) */
const openrouter = getKey("OPENROUTER_API_KEY")
  ? new ChatOpenRouter({
      apiKey: getKey("OPENROUTER_API_KEY"),
      model: "deepseek/deepseek-chat",
      temperature: 0,
      maxTokens: 8000,
    })
  : null;

/* Gemini */
const gemini = getKey("GOOGLE_API_KEY")
  ? new ChatGoogleGenerativeAI({
      apiKey: getKey("GOOGLE_API_KEY"),
      model: "gemini-1.5-flash",
    })
  : null;

/* Groq */
const groq = getKey("GROQ_API_KEY")
  ? new ChatGroq({
      apiKey: getKey("GROQ_API_KEY"),
      model: "llama-3.1-70b-versatile",
    })
  : null;

const unavailable = (task) => ({
  async invoke() {
    const err = new Error(`AI provider unavailable for ${task}`);
    err.status = 503;
    throw err;
  },
});

export const getModel = (task) => {
  switch (task) {
    // Vision — multimodal
    case "vision":
      return gemini || openrouter || groq || unavailable(task);

    // Text tasks — OpenRouter → Gemini → Groq
    case "incident":
    case "chat":
    case "triage":
    case "router":
      return openrouter || gemini || groq || unavailable(task);

    default:
      return openrouter || gemini || groq || unavailable(task);
  }
};
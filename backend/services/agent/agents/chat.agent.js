import {
  AIMessage,
  HumanMessage,
  SystemMessage,
} from "@langchain/core/messages";

import { getModel } from "../config/llmModels.js";
import { getMemory } from "../config/memory.js";

export const chatbotAgent = async (state) => {
  try {
    const llm = getModel("chat");
    const history = await getMemory(state.incidentId, state.userId);

    const systemPrompt = `You are ResQ AI Emergency Assistant.

Created by Mohammed Majid and Rahat Khan.

You help users during emergencies with safe, calm, clear guidance.

Current incident context:
- Incident ID: ${state.incidentId || "unknown"}
- Type: ${state.incident?.type || "unknown"}
- Priority: ${state.incident?.priority || "unknown"}
- Scene: ${state.vision?.sceneType || "unknown"}
- Visible concerns: ${state.vision?.visibleObservations?.join(", ") || "none reported"}
- Ambulance status: ${state.ambulanceStatus || "not yet assigned"}
- Hospital: ${state.hospitalName || "not yet selected"}

RULES (CRITICAL):
- NEVER diagnose medical conditions.
- NEVER claim certainty about injuries.
- NEVER invent symptoms that are not visible.
- ALWAYS recommend contacting emergency services.
- Provide only general first-aid level guidance.
- Keep responses short, calm, and reassuring.
- If the user is panicking, calm them first.
- If unsure, say "I don't know, please call emergency services."
- Always add: "This is not a medical diagnosis."

Formatting:
- Use plain text for simple answers.
- Use bullet points for step-by-step guidance.
- Keep paragraphs short.
- Avoid markdown headings.

Tone:
- Calm
- Clear
- Reassuring
- Professional

Creators:
Mohammed Majid and Rahat Khan
`;

    const messages = [new SystemMessage({ content: systemPrompt })];

    const normalizedHistory = Array.isArray(history) ? [...history] : [];

    const lastHistoryMessage = normalizedHistory[normalizedHistory.length - 1];
    const shouldAppendPrompt = !(
      lastHistoryMessage?.role === "user" &&
      String(lastHistoryMessage?.content || "") === String(state.prompt || "")
    );

    normalizedHistory.forEach((msg) => {
      if (!msg?.content) return;

      if (msg.role === "user") {
        messages.push(new HumanMessage({ content: msg.content }));
      } else if (msg.role === "assistant") {
        messages.push(new AIMessage({ content: msg.content }));
      }
    });

    if (shouldAppendPrompt && state.prompt) {
      messages.push(new HumanMessage({ content: state.prompt }));
    }

    console.log("MESSAGES SENT TO AI:", messages.length);

    const response = await llm.invoke(messages);

    return {
      ...state,
      aiResponse: response.content,
    };
  } catch (error) {
    console.error("chatbot agent error:", error);

    return {
      ...state,
      aiResponse:
        error?.data?.message ||
        error?.message ||
        "AI assistant temporarily unavailable. Please try again.",
    };
  }
};
import { getModel } from "../config/llmModels.js";

export const router = async (state) => {
  /* ──────────────────────────────────────────
     1. Explicit agent from caller (direct override)
     ────────────────────────────────────────── */
  if (state.agent) {
    const normalized = String(state.agent).trim().toLowerCase();

    // Valid entry agents → use directly
    if (normalized === "vision" || normalized === "chatbot") {
      return { ...state, agent: normalized };
    }

    // Any other explicit value (e.g., "incident", "analysis")
    // → treat as vision path (analysis)
    if (normalized !== "auto") {
      return { ...state, agent: "vision" };
    }
  }

  /* ──────────────────────────────────────────
     2. Deterministic routing (based on input)
     ────────────────────────────────────────── */

  // If image present → vision path (analysis)
  if (state.file?.mimetype?.startsWith("image/") || state.imageUrl) {
    return { ...state, agent: "vision" };
  }

  // If description + incidentId → analysis without image
  if (state.incidentId && state.description) {
    return { ...state, agent: "vision" };
  }

  // If prompt → chat
  if (state.prompt) {
    return { ...state, agent: "chatbot" };
  }

  /* ──────────────────────────────────────────
     3. LLM fallback (rare cases)
     ────────────────────────────────────────── */
  const llm = getModel("router");

  const routerPrompt = `You are ResQ AI Request Router.

Route the user's request to ONE agent only.

Available agents:
- vision   : if the user is describing an accident scene, injury, or image analysis is needed
- chatbot  : if the user is asking a question, seeking guidance, or chatting

Return ONLY one lowercase word: vision or chatbot

User Query:
${state.prompt || state.description || ""}`;

  try {
    const response = await llm.invoke(routerPrompt);
    let agent = response.content.trim().toLowerCase().replace(".", "");

    if (!["vision", "chatbot"].includes(agent)) {
      agent = "chatbot";
    }

    return { ...state, agent };
  } catch (err) {
    console.warn("Router LLM failed, defaulting to chatbot:", err.message);
    return { ...state, agent: "chatbot" };
  }
};
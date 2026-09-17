import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { getModel } from "../config/llmModels.js";

const DEFAULT_FALLBACK_TRIAGE = {
  urgencyGuidance: "Contact emergency services immediately.",
  safeFirstResponse: [
    "Call emergency services if not already done",
    "Ensure your own safety before approaching the scene",
    "Stay with the person and keep them calm until help arrives",
  ],
  dangerWarnings: [
    "Do not attempt to diagnose injuries or administer medication",
    "Do not move an injured person unless there is immediate danger (e.g. fire)",
  ],
};

export const triageAgent = async (state) => {
  try {
    const llm = getModel("triage");

    const systemPrompt = `You are ResQ AI Emergency Triage Agent.

Created by Mohammed Majid and Rahat Khan.

Your duty is to provide SAFE, essential first-response guidance while individuals wait for certified emergency medical personnel to arrive.

CRITICAL MEDICAL SAFETY DIRECTIVES:
- NEVER diagnose medical conditions or label injuries.
- NEVER claim certainty about internal or physical trauma.
- NEVER invent symptoms or assume unconfirmed medical facts.
- NEVER recommend invasive or dangerous medical procedures.
- ALWAYS emphasize contacting local emergency services right away.
- Provide ONLY general, certified first-aid level non-invasive actions that any bystander can safely execute.
- If unsure or the scene is chaotic, advise waiting safely for professional first responders.

Response Guidelines:
- urgencyGuidance: Exactly one concise, urgent sentence instructing the very first immediate action.
- safeFirstResponse: Array of 3 to 5 clear, actionable, safe bystander steps.
- dangerWarnings: Array of 2 to 4 critical "DO NOT" warnings to prevent further harm.

Return ONLY valid JSON in this exact structure:
{
  "urgencyGuidance": "Call emergency services immediately and do not enter the roadway.",
  "safeFirstResponse": [
    "Call local emergency services (e.g. 911 / 112 / 108)",
    "Keep bystanders at a safe distance from traffic",
    "Keep the individual calm, warm, and still without moving their head or neck"
  ],
  "dangerWarnings": [
    "Do not move injured individuals unless there is imminent fire or explosion risk",
    "Do not remove helmets from motorcycle riders",
    "Do not give any food, water, or medication"
  ]
}

No markdown code fences, no introductory remarks, no extra text.`;

    const triageContext = {
      incidentType: state.incident?.type || "OTHER",
      priority: state.incident?.priority || "MEDIUM",
      sceneType: state.vision?.sceneType || "Unknown scene",
      visibleObservations: state.vision?.visibleObservations || [],
      urgencyIndicators: state.vision?.urgencyIndicators || [],
      userDescription: state.description || "No user description provided",
    };

    const userMessageContent = `Provide immediate bystander safety instructions for this emergency scene:
${JSON.stringify(triageContext, null, 2)}`;

    const messages = [
      new SystemMessage({ content: systemPrompt }),
      new HumanMessage({ content: userMessageContent }),
    ];

    const response = await llm.invoke(messages);

    const text =
      typeof response.content === "string"
        ? response.content
        : response.content?.[0]?.text || "";

    const cleaned = text
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    let parsed = JSON.parse(cleaned);

    // Validate and sanitize content
    const urgencyGuidance =
      typeof parsed?.urgencyGuidance === "string" && parsed.urgencyGuidance.trim().length > 0
        ? parsed.urgencyGuidance.trim()
        : DEFAULT_FALLBACK_TRIAGE.urgencyGuidance;

    let safeFirstResponse = Array.isArray(parsed?.safeFirstResponse)
      ? parsed.safeFirstResponse.filter((item) => typeof item === "string" && item.trim().length > 0).slice(0, 5)
      : [];

    if (safeFirstResponse.length === 0) {
      safeFirstResponse = [...DEFAULT_FALLBACK_TRIAGE.safeFirstResponse];
    }

    let dangerWarnings = Array.isArray(parsed?.dangerWarnings)
      ? parsed.dangerWarnings.filter((item) => typeof item === "string" && item.trim().length > 0).slice(0, 5)
      : [];

    if (dangerWarnings.length === 0) {
      dangerWarnings = [...DEFAULT_FALLBACK_TRIAGE.dangerWarnings];
    }

    return {
      ...state,
      triage: {
        urgencyGuidance,
        safeFirstResponse,
        dangerWarnings,
      },
    };
  } catch (error) {
    console.error("Triage Agent Error:", error?.message || error);

    return {
      ...state,
      triage: {
        ...DEFAULT_FALLBACK_TRIAGE,
        error: error?.message || "Triage processing failed",
      },
    };
  }
};


import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { getModel } from "../config/llmModels.js";

const VALID_TYPES = ["ROAD_ACCIDENT", "FIRE", "MEDICAL", "FALL", "OTHER"];
const VALID_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

export const incidentAgent = async (state) => {
  try {
    const llm = getModel("incident");

    const systemPrompt = `You are ResQ AI Incident Classification Agent.

Created by Mohammed Majid and Rahat Khan.

Your job is to classify reported emergency incidents into standardized types and priority levels based on available scene data and reporter descriptions.

Classification Types:
- ROAD_ACCIDENT: Vehicle collisions, bike/motorcycle accidents, pedestrian hit-and-run
- FIRE: Active fire, smoke, structural burning, gas leaks with fire risk
- MEDICAL: Sudden acute illness, chest pain, unconsciousness, seizure, cardiac arrest
- FALL: Person fallen from height, slipping, tripping with significant trauma
- OTHER: Any situation not clearly belonging to the categories above

Priority Levels:
- CRITICAL: Life-threatening emergencies, unconscious victim, heavy uncontrolled bleeding, active fire, trapped individuals, airway obstruction
- HIGH: Visible severe injury, multiple victims involved, victim lying on road/traffic
- MEDIUM: Moderate or minor vehicle damage, person standing or responsive, non-life-threatening situation, unclear severity
- LOW: No visible injury, minor property impact, no urgency indicators

Safety Rules:
- NEVER perform medical diagnosis.
- Classify ONLY using the provided scene data and user description.
- If uncertain, default to type "OTHER" and priority "MEDIUM".
- Return ONLY valid JSON. No markdown code blocks, no backticks, no commentary.

Required JSON Output Format:
{
  "type": "ROAD_ACCIDENT",
  "priority": "HIGH",
  "confidence": 0.85
}`;

    const contextPayload = {
      sceneDescription: state.vision?.sceneType || "No scene type detected",
      visibleObservations: state.vision?.visibleObservations || [],
      urgencyIndicators: state.vision?.urgencyIndicators || [],
      userDescription: state.description || "No user description provided",
      location: state.location || null,
    };

    const userMessageContent = `Classify the emergency incident using the following collected data:
${JSON.stringify(contextPayload, null, 2)}`;

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

    // Validate enum values and confidence score
    const validatedType = VALID_TYPES.includes(parsed?.type?.toUpperCase())
      ? parsed.type.toUpperCase()
      : "OTHER";

    const validatedPriority = VALID_PRIORITIES.includes(parsed?.priority?.toUpperCase())
      ? parsed.priority.toUpperCase()
      : "MEDIUM";

    const validatedConfidence =
      typeof parsed?.confidence === "number" && !isNaN(parsed.confidence)
        ? Math.max(0, Math.min(1, parsed.confidence))
        : 0.5;

    return {
      ...state,
      incident: {
        type: validatedType,
        priority: validatedPriority,
        confidence: validatedConfidence,
      },
    };
  } catch (error) {
    console.error("Incident Agent Error:", error?.message || error);

    // Safe fallback defaults on any error or parsing failure
    return {
      ...state,
      incident: {
        type: "OTHER",
        priority: "MEDIUM",
        confidence: 0,
        error: error?.message || "Incident classification failed",
      },
    };
  }
};


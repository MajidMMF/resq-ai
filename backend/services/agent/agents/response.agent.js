/**
 * Response Agent
 * Combines outputs from visionAgent, incidentAgent, and triageAgent
 * into the standardized response contract consumed by frontend views.
 *
 * PURE JAVASCRIPT — NO LLM INVOCATION
 */
export const responseAgent = async (state) => {
  try {
    const vision = state.vision || {};
    const incident = state.incident || {};
    const triage = state.triage || {};

    const incidentType = incident.type || "OTHER";
    const priority = incident.priority || "MEDIUM";
    const sceneDescription = vision.sceneType || state.description || "Scene reported";
    const visibleConcerns = Array.isArray(vision.visibleObservations)
      ? vision.visibleObservations
      : [];
    const urgencyIndicators = Array.isArray(vision.urgencyIndicators)
      ? vision.urgencyIndicators
      : [];

    const urgencyGuidance =
      triage.urgencyGuidance || "Contact emergency services immediately.";

    const guidance = Array.isArray(triage.safeFirstResponse) && triage.safeFirstResponse.length > 0
      ? triage.safeFirstResponse
      : ["Call emergency services immediately if not yet contacted"];

    const dangerWarnings = Array.isArray(triage.dangerWarnings) && triage.dangerWarnings.length > 0
      ? triage.dangerWarnings
      : ["Do not attempt to move injured persons unless in immediate danger"];

    // Confidence is the minimum of vision confidence and incident classification confidence
    const visionConf = typeof vision.confidence === "number" ? vision.confidence : 0.5;
    const incidentConf = typeof incident.confidence === "number" ? incident.confidence : 0.5;
    const rawConfidence = Math.min(visionConf, incidentConf);
    const confidence = Math.round(Math.max(0, Math.min(1, rawConfidence)) * 100) / 100;

    const finalResponse = {
      incidentType,
      priority,
      sceneDescription,
      visibleConcerns,
      urgencyIndicators,
      urgencyGuidance,
      guidance,
      dangerWarnings,
      confidence,
      medicalDisclaimer: true,

      // Nested sub-structures for extended frontend backwards compatibility
      vision: {
        sceneType: sceneDescription,
        visibleObservations: visibleConcerns,
        urgencyIndicators,
        confidence: visionConf,
      },
      triage: {
        urgencyGuidance,
        safeFirstResponse: guidance,
        dangerWarnings,
      },
      summary: sceneDescription,
    };

    return {
      ...state,
      finalResponse,
    };
  } catch (error) {
    console.error("Response Agent Error:", error?.message || error);

    return {
      ...state,
      finalResponse: {
        incidentType: "OTHER",
        priority: "MEDIUM",
        sceneDescription: "Unknown scene",
        visibleConcerns: [],
        urgencyIndicators: [],
        urgencyGuidance: "Contact emergency services immediately.",
        guidance: ["Call emergency services if not already done"],
        dangerWarnings: ["Do not attempt to diagnose or move injured persons"],
        confidence: 0,
        medicalDisclaimer: true,
        error: error?.message || "Failed to assemble response",
      },
    };
  }
};


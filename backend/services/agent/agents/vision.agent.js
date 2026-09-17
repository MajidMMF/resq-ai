import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { getModel } from "../config/llmModels.js";
import fs from "fs/promises";

export const visionAgent = async (state) => {
  try {
    const llm = getModel("vision");

    /* ──────────────────────────────────────────
       Build image content
       From multer file OR imageUrl
       ────────────────────────────────────────── */
    let imageContent = null;

    if (state.file?.path) {
      const imageBuffer = await fs.readFile(state.file.path);
      const base64image = imageBuffer.toString("base64");
      imageContent = {
        type: "image_url",
        image_url: {
          url: `data:${state.file.mimetype};base64,${base64image}`,
        },
      };
    } else if (state.imageUrl) {
      imageContent = {
        type: "image_url",
        image_url: { url: state.imageUrl },
      };
    }

    /* ──────────────────────────────────────────
       System prompt
       ────────────────────────────────────────── */
    const systemPrompt = `You are ResQ AI Vision Agent.

Created by Mohammed Majid and Rahat Khan.

You analyze accident scene images to assist emergency responders.

Rules:
- Analyze only the uploaded image.
- Describe ONLY what is VISIBLE.
- NEVER diagnose medical conditions.
- NEVER claim certainty about injuries.
- NEVER invent details not visible.
- If something is unclear, say so.
- Focus on: scene type, visible hazards, people, vehicles, fire, smoke, damage.

Return ONLY valid JSON in this exact format:
{
  "sceneType": "short scene description (max 15 words)",
  "visibleObservations": ["observation 1", "observation 2"],
  "urgencyIndicators": ["indicator 1", "indicator 2"],
  "confidence": 0.0
}

No other text. No markdown. Only JSON.`;

    /* ──────────────────────────────────────────
       Build messages
       ────────────────────────────────────────── */
    const messages = [new SystemMessage(systemPrompt)];

    if (imageContent) {
      messages.push(
        new HumanMessage({
          content: [
            {
              type: "text",
              text: state.description || "Analyze this accident scene.",
            },
            imageContent,
          ],
        })
      );
    } else {
      messages.push(
        new HumanMessage({
          content: `No image available. Analyze from this description only: ${
            state.description || "No description provided."
          }`,
        })
      );
    }

    /* ──────────────────────────────────────────
       Invoke LLM
       ────────────────────────────────────────── */
    const response = await llm.invoke(messages);

    /* ──────────────────────────────────────────
       Parse JSON output
       ────────────────────────────────────────── */
    let parsed = {
      sceneType: "unknown",
      visibleObservations: [],
      urgencyIndicators: [],
      confidence: 0.5,
    };

    try {
      const text =
        typeof response.content === "string"
          ? response.content
          : response.content?.[0]?.text || "";

      const cleaned = text
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      const json = JSON.parse(cleaned);

      parsed = {
        sceneType: json.sceneType || "unknown",
        visibleObservations: Array.isArray(json.visibleObservations)
          ? json.visibleObservations
          : [],
        urgencyIndicators: Array.isArray(json.urgencyIndicators)
          ? json.urgencyIndicators
          : [],
        confidence:
          typeof json.confidence === "number" ? json.confidence : 0.5,
      };
    } catch (parseErr) {
      console.warn("Vision JSON parse failed:", parseErr.message);
      parsed.sceneType = String(response.content).slice(0, 200);
    }

    return {
      ...state,
      vision: parsed,
    };
  } catch (error) {
    console.error("Vision Agent Error:", error);

    return {
      ...state,
      vision: {
        sceneType: "unknown",
        visibleObservations: [],
        urgencyIndicators: [],
        confidence: 0,
        error:
          error?.data?.message ||
          error?.message ||
          "Vision analysis failed",
      },
    };
  } finally {
    // Cleanup multer temp file
    if (state.file?.path) {
      await fs.unlink(state.file.path).catch(() => {});
    }
  }
};
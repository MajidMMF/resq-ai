import { StateGraph } from "@langchain/langgraph";
import { agentState } from "./state.js";

import { visionAgent } from "../agents/vision.agent.js";
import { chatbotAgent } from "../agents/chat.agent.js";
import { incidentAgent } from "../agents/incident.agent.js";
import { triageAgent } from "../agents/triage.agent.js";
import { responseAgent } from "../agents/response.agent.js";

const workflow = new StateGraph(agentState);

/* ──────────────────────────────────────────
   NODES
   (Node names distinct from state channel keys to avoid LangGraph collisions)
   ────────────────────────────────────────── */
workflow.addNode("vision_agent", visionAgent);
workflow.addNode("incident_agent", incidentAgent);
workflow.addNode("triage_agent", triageAgent);
workflow.addNode("response_agent", responseAgent);
workflow.addNode("chatbot_agent", chatbotAgent);

/* ──────────────────────────────────────────
   START ROUTING
   Direct conditional edge from __start__ based on state.agent
   ────────────────────────────────────────── */
workflow.addConditionalEdges(
  "__start__",
  (state) => {
    const agent = String(state?.agent || "").toLowerCase().trim();
    return agent === "chatbot" ? "chatbot_agent" : "vision_agent";
  },
  {
    vision_agent: "vision_agent",
    chatbot_agent: "chatbot_agent",
  }
);

/* ──────────────────────────────────────────
   ANALYSIS PIPELINE
   vision → incident → triage → response → END
   ────────────────────────────────────────── */
workflow.addEdge("vision_agent", "incident_agent");
workflow.addEdge("incident_agent", "triage_agent");
workflow.addEdge("triage_agent", "response_agent");
workflow.addEdge("response_agent", "__end__");

/* ──────────────────────────────────────────
   CHATBOT PATH
   chatbot → END
   ────────────────────────────────────────── */
workflow.addEdge("chatbot_agent", "__end__");

export const graph = workflow.compile();
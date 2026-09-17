import { Annotation } from "@langchain/langgraph";

export const agentState = Annotation.Root({
  // Inputs
  prompt: Annotation(),
  description: Annotation(),
  location: Annotation(),
  imageUrl: Annotation(),
  incidentId: Annotation(),
  userId: Annotation(),
  file: Annotation(),
  agent: Annotation(),
  conversationId: Annotation(),

  // Agent outputs
  vision: Annotation(),
  incident: Annotation(),
  triage: Annotation(),
  finalResponse: Annotation(),

  // Chat & Memory
  aiResponse: Annotation(),
  searchResults: Annotation(),
  images: Annotation(),
  artifacts: Annotation(),
  ambulanceStatus: Annotation(),
  hospitalName: Annotation(),
});
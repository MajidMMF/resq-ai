import { TavilySearch } from "@langchain/tavily";

export const searchTool = new TavilySearch({
  maxResults: 5,
  topic: "general",
  includeImages: false,   // images ResQ me kaam ke nahi
});
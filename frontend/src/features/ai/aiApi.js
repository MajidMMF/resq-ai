import baseApi from "../../store/api/baseApi";

export const aiApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    analyzeIncident: builder.mutation({
      query: (formData) => ({
        url: "/api/ai/analyze",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["AI", "Incident"],
    }),
    sendChatMessage: builder.mutation({
      query: ({ incidentId, prompt }) => ({
        url: "/api/ai/chat",
        method: "POST",
        body: { incidentId, prompt },
      }),
      invalidatesTags: ["AI"],
    }),
    getChatMessages: builder.query({
      query: (incidentId) => ({
        url: `/api/ai/chat/messages/${incidentId}`,
        method: "GET",
      }),
      providesTags: ["AI"],
    }),
  }),
});

export const {
  useAnalyzeIncidentMutation,
  useSendChatMessageMutation,
  useGetChatMessagesQuery,
} = aiApi;

export default aiApi;


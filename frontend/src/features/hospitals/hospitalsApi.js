import baseApi from "../../store/api/baseApi";

export const hospitalsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAvailableHospitals: builder.query({
      query: ({ lat, lng, radius = 15000, traumaLevel, bloodGroup, service }) => ({
        url: "/api/hospitals/available",
        method: "GET",
        params: { lat, lng, radius, traumaLevel, bloodGroup, service },
      }),
      providesTags: ["Hospital"],
    }),
    getMyHospital: builder.query({
      query: () => ({
        url: "/api/hospitals/me",
        method: "GET",
      }),
      providesTags: ["Hospital"],
    }),
    getIncomingPatients: builder.query({
      query: () => ({
        url: "/api/hospitals/me/incoming",
        method: "GET",
      }),
      providesTags: ["Hospital"],
    }),
    acceptIncomingPatient: builder.mutation({
      query: ({ incidentId, estimatedPreparationTimeMinutes, notes }) => ({
        url: `/api/hospitals/me/incoming/${incidentId}/accept`,
        method: "POST",
        body: { estimatedPreparationTimeMinutes, notes },
      }),
      invalidatesTags: ["Hospital", "Incident"],
    }),
    markHospitalReady: builder.mutation({
      query: ({ incidentId, allocatedBed, teamLead, readyDetails }) => ({
        url: `/api/hospitals/me/incoming/${incidentId}/ready`,
        method: "POST",
        body: { allocatedBed, teamLead, readyDetails },
      }),
      invalidatesTags: ["Hospital", "Incident"],
    }),
    markHospitalUnavailable: builder.mutation({
      query: ({ incidentId, reason, diversionSuggestion }) => ({
        url: `/api/hospitals/me/incoming/${incidentId}/unavailable`,
        method: "POST",
        body: { reason, diversionSuggestion },
      }),
      invalidatesTags: ["Hospital", "Incident"],
    }),
    updateHospitalProfile: builder.mutation({
      query: (body) => ({
        url: "/api/hospitals/me",
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Hospital"],
    }),
    updateHospitalCapability: builder.mutation({
      query: (body) => ({
        url: "/api/hospitals/me/capability",
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Hospital"],
    }),
    getActiveHospitalPatients: builder.query({
      query: () => ({
        url: "/api/hospitals/me/active",
        method: "GET",
      }),
      providesTags: ["Hospital"],
    }),
    getHospitalPatientHistory: builder.query({
      query: () => ({
        url: "/api/hospitals/me/history",
        method: "GET",
      }),
      providesTags: ["Hospital"],
    }),
    listAllHospitals: builder.query({
      query: (params) => ({
        url: "/api/hospitals",
        method: "GET",
        params,
      }),
      providesTags: ["Hospital"],
    }),
    approveHospital: builder.mutation({
      query: (id) => ({
        url: `/api/hospitals/${id}/approve`,
        method: "PATCH",
      }),
      invalidatesTags: ["Hospital"],
    }),
    suspendHospital: builder.mutation({
      query: (id) => ({
        url: `/api/hospitals/${id}/suspend`,
        method: "PATCH",
      }),
      invalidatesTags: ["Hospital"],
    }),
  }),
});

export const {
  useGetAvailableHospitalsQuery,
  useGetMyHospitalQuery,
  useGetIncomingPatientsQuery,
  useAcceptIncomingPatientMutation,
  useMarkHospitalReadyMutation,
  useMarkHospitalUnavailableMutation,
  useUpdateHospitalProfileMutation,
  useUpdateHospitalCapabilityMutation,
  useGetActiveHospitalPatientsQuery,
  useGetHospitalPatientHistoryQuery,
  useListAllHospitalsQuery,
  useApproveHospitalMutation,
  useSuspendHospitalMutation,
} = hospitalsApi;

export default hospitalsApi;



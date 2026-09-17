import baseApi from "../../store/api/baseApi";

export const incidentsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createIncident: builder.mutation({
      query: (body) => ({
        url: "/api/incidents",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Incident"],
    }),
    getMyIncidents: builder.query({
      query: (params) => ({
        url: "/api/incidents",
        method: "GET",
        params,
      }),
      providesTags: ["Incident"],
    }),
    getActiveIncidents: builder.query({
      query: () => ({
        url: "/api/incidents",
        method: "GET",
        params: { live: "true", status: "ACTIVE" },
      }),
      providesTags: ["Incident"],
    }),
    getIncidentById: builder.query({
      query: (id) => ({
        url: `/api/incidents/${id}`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [{ type: "Incident", id }],
    }),
    getIncidentTimeline: builder.query({
      query: (id) => ({
        url: `/api/incidents/${id}/timeline`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [{ type: "Incident", id: `${id}-timeline` }],
    }),
    selectHospital: builder.mutation({
      query: ({ id, hospitalId, hospitalData }) => ({
        url: `/api/incidents/${id}/select-hospital`,
        method: "POST",
        body: { hospitalId, hospitalData },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Incident", id },
        "Incident",
      ],
    }),
    requestAmbulance: builder.mutation({
      query: ({ id, ambulanceId, hospitalId, ambulanceData }) => ({
        url: `/api/incidents/${id}/request-ambulance`,
        method: "POST",
        body: { ambulanceId, hospitalId, ambulanceData },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Incident", id },
        "Incident",
        "Ambulance",
      ],
    }),
    cancelIncident: builder.mutation({
      query: ({ id, reason }) => ({
        url: `/api/incidents/${id}/cancel`,
        method: "POST",
        body: { reason },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Incident", id },
        "Incident",
      ],
    }),
  }),
});

export const {
  useCreateIncidentMutation,
  useGetMyIncidentsQuery,
  useGetActiveIncidentsQuery,
  useGetIncidentByIdQuery,
  useGetIncidentTimelineQuery,
  useSelectHospitalMutation,
  useRequestAmbulanceMutation,
  useCancelIncidentMutation,
} = incidentsApi;

export default incidentsApi;


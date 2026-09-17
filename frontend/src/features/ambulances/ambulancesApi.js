import baseApi from "../../store/api/baseApi";

export const ambulancesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAvailableAmbulances: builder.query({
      query: ({ lat, lng, radius = 10000 }) => ({
        url: "/api/ambulances/available",
        method: "GET",
        params: { lat, lng, radius },
      }),
      providesTags: ["Ambulance"],
    }),
    getMyAmbulance: builder.query({
      query: () => ({
        url: "/api/ambulances/me",
        method: "GET",
      }),
      providesTags: ["Ambulance"],
    }),
    updateAmbulanceStatus: builder.mutation({
      query: (status) => ({
        url: "/api/ambulances/me/status",
        method: "PATCH",
        body: { status },
      }),
      invalidatesTags: ["Ambulance"],
    }),
    updateAmbulanceLocation: builder.mutation({
      query: (location) => ({
        url: "/api/ambulances/me/location",
        method: "PATCH",
        body: location,
      }),
    }),
    getMyAssignments: builder.query({
      query: () => ({
        url: "/api/ambulances/me/assignments",
        method: "GET",
      }),
      providesTags: ["Ambulance"],
    }),
    acceptAssignment: builder.mutation({
      query: (id) => ({
        url: `/api/ambulances/me/assignments/${id}/accept`,
        method: "POST",
      }),
      invalidatesTags: ["Ambulance", "Incident"],
    }),
    rejectAssignment: builder.mutation({
      query: ({ id, reason }) => ({
        url: `/api/ambulances/me/assignments/${id}/reject`,
        method: "POST",
        body: { reason },
      }),
      invalidatesTags: ["Ambulance", "Incident"],
    }),
    startTrip: builder.mutation({
      query: (id) => ({
        url: `/api/ambulances/me/assignments/${id}/start`,
        method: "POST",
      }),
      invalidatesTags: ["Ambulance", "Incident"],
    }),
    arriveAtScene: builder.mutation({
      query: (id) => ({
        url: `/api/ambulances/me/assignments/${id}/arrive`,
        method: "POST",
      }),
      invalidatesTags: ["Ambulance", "Incident"],
    }),
    verifyArrivalOtp: builder.mutation({
      query: ({ id, otp }) => ({
        url: `/api/ambulances/me/assignments/${id}/verify-otp`,
        method: "POST",
        body: { otp },
      }),
      invalidatesTags: ["Ambulance", "Incident"],
    }),
    resendArrivalOtp: builder.mutation({
      query: (id) => ({
        url: `/api/ambulances/me/assignments/${id}/resend-otp`,
        method: "POST",
      }),
    }),
    completeTrip: builder.mutation({
      query: (id) => ({
        url: `/api/ambulances/me/assignments/${id}/complete`,
        method: "POST",
      }),
      invalidatesTags: ["Ambulance", "Incident"],
    }),
    listAllAmbulances: builder.query({
      query: (params) => ({
        url: "/api/ambulances",
        method: "GET",
        params,
      }),
      providesTags: ["Ambulance"],
    }),
    approveAmbulance: builder.mutation({
      query: (id) => ({
        url: `/api/ambulances/${id}/approve`,
        method: "PATCH",
      }),
      invalidatesTags: ["Ambulance"],
    }),
    suspendAmbulance: builder.mutation({
      query: (id) => ({
        url: `/api/ambulances/${id}/suspend`,
        method: "PATCH",
      }),
      invalidatesTags: ["Ambulance"],
    }),
  }),
});

export const {
  useGetAvailableAmbulancesQuery,
  useGetMyAmbulanceQuery,
  useUpdateAmbulanceStatusMutation,
  useUpdateAmbulanceLocationMutation,
  useGetMyAssignmentsQuery,
  useAcceptAssignmentMutation,
  useRejectAssignmentMutation,
  useStartTripMutation,
  useArriveAtSceneMutation,
  useVerifyArrivalOtpMutation,
  useResendArrivalOtpMutation,
  useCompleteTripMutation,
  useListAllAmbulancesQuery,
  useApproveAmbulanceMutation,
  useSuspendAmbulanceMutation,
} = ambulancesApi;

export default ambulancesApi;


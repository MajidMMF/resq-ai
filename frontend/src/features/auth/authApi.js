import baseApi from "../../store/api/baseApi";

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (credentials) => ({
        url: "/api/auth/login",
        method: "POST",
        body: credentials,
      }),
      invalidatesTags: ["Auth"],
    }),
    register: builder.mutation({
      query: (userData) => ({
        url: "/api/auth/register",
        method: "POST",
        body: userData,
      }),
      invalidatesTags: ["Auth"],
    }),
    verifyOtp: builder.mutation({
      query: ({ email, otp }) => ({
        url: "/api/auth/verify-otp",
        method: "POST",
        body: { email, otp },
      }),
      invalidatesTags: ["Auth"],
    }),
    resendOtp: builder.mutation({
      query: ({ email }) => ({
        url: "/api/auth/resend-otp",
        method: "POST",
        body: { email },
      }),
    }),
    logout: builder.mutation({
      query: () => ({
        url: "/api/auth/logout",
        method: "POST",
      }),
      invalidatesTags: ["Auth"],
    }),
    getMe: builder.query({
      query: () => ({
        url: "/api/auth/me",
        method: "GET",
      }),
      providesTags: ["Auth"],
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useVerifyOtpMutation,
  useResendOtpMutation,
  useLogoutMutation,
  useGetMeQuery,
} = authApi;

export default authApi;


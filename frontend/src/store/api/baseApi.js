import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
    credentials: "include",
    prepareHeaders: (headers, { getState }) => {
      const user = getState()?.auth?.user;
      const uid = user?.userId || user?._id || user?.id;
      if (uid) {
        headers.set("x-user-id", String(uid));
      }
      return headers;
    },
  }),
  tagTypes: ["Auth", "Incident", "Hospital", "Ambulance", "AI", "Notification"],
  endpoints: () => ({}),
});

export default baseApi;


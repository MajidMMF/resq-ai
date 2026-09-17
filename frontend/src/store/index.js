import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import baseApi from "./api/baseApi";
import authReducer from "../features/auth/authSlice";
import incidentsReducer from "../features/incidents/incidentsSlice";
import ambulancesReducer from "../features/ambulances/ambulancesSlice";
import hospitalsReducer from "../features/hospitals/hospitalsSlice";
import notificationsReducer from "../features/notifications/notificationsSlice";
import aiReducer from "../features/ai/aiSlice";
import adminReducer from "../features/admin/adminSlice";

export const store = configureStore({
  reducer: {
    [baseApi.reducerPath]: baseApi.reducer,
    auth: authReducer,
    incidents: incidentsReducer,
    ambulances: ambulancesReducer,
    hospitals: hospitalsReducer,
    notifications: notificationsReducer,
    ai: aiReducer,
    admin: adminReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(baseApi.middleware),
});

setupListeners(store.dispatch);

export default store;

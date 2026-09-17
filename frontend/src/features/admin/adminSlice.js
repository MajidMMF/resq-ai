import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  activeTab: "overview", // overview, fleet, hospitals, incidents, logs
  searchQuery: "",
  fleetFilter: "ALL", // ALL, online, busy, offline, pending
  hospitalFilter: "ALL", // ALL, active, pending
  incidentFilter: "ALL", // ALL, ACTIVE, RESOLVED
  autoRefreshInterval: 5000,
};

const adminSlice = createSlice({
  name: "admin",
  initialState,
  reducers: {
    setActiveAdminTab: (state, action) => {
      state.activeTab = action.payload;
    },
    setAdminSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
    },
    setFleetFilter: (state, action) => {
      state.fleetFilter = action.payload;
    },
    setHospitalFilter: (state, action) => {
      state.hospitalFilter = action.payload;
    },
    setIncidentFilter: (state, action) => {
      state.incidentFilter = action.payload;
    },
  },
});

export const {
  setActiveAdminTab,
  setAdminSearchQuery,
  setFleetFilter,
  setHospitalFilter,
  setIncidentFilter,
} = adminSlice.actions;

export const selectActiveAdminTab = (state) => state.admin?.activeTab;
export const selectAdminSearchQuery = (state) => state.admin?.searchQuery;
export const selectFleetFilter = (state) => state.admin?.fleetFilter;
export const selectHospitalFilter = (state) => state.admin?.hospitalFilter;

export default adminSlice.reducer;


import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  selectedIncidentId: null,
  activeTab: "incoming", // incoming, active, beds, history
  audioAlertEnabled: true,
  lastAlertTimestamp: null,
};

const hospitalsSlice = createSlice({
  name: "hospitals",
  initialState,
  reducers: {
    setSelectedIncidentId: (state, action) => {
      state.selectedIncidentId = action.payload;
    },
    setActiveTab: (state, action) => {
      state.activeTab = action.payload;
    },
    toggleAudioAlert: (state) => {
      state.audioAlertEnabled = !state.audioAlertEnabled;
    },
    setLastAlertTimestamp: (state, action) => {
      state.lastAlertTimestamp = action.payload;
    },
  },
});

export const {
  setSelectedIncidentId,
  setActiveTab,
  toggleAudioAlert,
  setLastAlertTimestamp,
} = hospitalsSlice.actions;

export const selectSelectedIncidentId = (state) => state.hospitals?.selectedIncidentId;
export const selectHospitalActiveTab = (state) => state.hospitals?.activeTab;
export const selectAudioAlertEnabled = (state) => state.hospitals?.audioAlertEnabled;

export default hospitalsSlice.reducer;


import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  activeIncidentId: null,
  activeIncident: null,
  recentIncidents: [],
  selectedHospital: null,
  selectedAmbulance: null,
};

export const incidentsSlice = createSlice({
  name: "incidents",
  initialState,
  reducers: {
    setActiveIncidentId: (state, action) => {
      state.activeIncidentId = action.payload;
    },
    setActiveIncident: (state, action) => {
      state.activeIncident = action.payload;
      if (action.payload?._id) {
        state.activeIncidentId = action.payload._id;
      }
    },
    clearActiveIncident: (state) => {
      state.activeIncidentId = null;
      state.activeIncident = null;
      state.selectedHospital = null;
      state.selectedAmbulance = null;
    },
    setSelectedHospital: (state, action) => {
      state.selectedHospital = action.payload;
    },
    setSelectedAmbulance: (state, action) => {
      state.selectedAmbulance = action.payload;
    },
    setRecentIncidents: (state, action) => {
      state.recentIncidents = action.payload;
    },
  },
});

export const {
  setActiveIncidentId,
  setActiveIncident,
  clearActiveIncident,
  setSelectedHospital,
  setSelectedAmbulance,
  setRecentIncidents,
} = incidentsSlice.actions;

export const selectActiveIncidentId = (state) => state.incidents.activeIncidentId;
export const selectActiveIncident = (state) => state.incidents.activeIncident;
export const selectSelectedHospital = (state) => state.incidents.selectedHospital;
export const selectSelectedAmbulance = (state) => state.incidents.selectedAmbulance;
export const selectRecentIncidents = (state) => state.incidents.recentIncidents;

export default incidentsSlice.reducer;


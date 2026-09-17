import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  liveLocations: {}, // { [ambulanceId]: { lat, lng, heading, speed, ts } }
  activeAssignment: null,
};

export const ambulancesSlice = createSlice({
  name: "ambulances",
  initialState,
  reducers: {
    updateLiveLocation: (state, action) => {
      const { ambulanceId, lat, lng, heading, speed, ts } = action.payload;
      state.liveLocations[ambulanceId] = {
        lat,
        lng,
        heading: heading || 0,
        speed: speed || 0,
        ts: ts || Date.now(),
      };
    },
    setActiveAssignment: (state, action) => {
      state.activeAssignment = action.payload;
    },
    clearActiveAssignment: (state) => {
      state.activeAssignment = null;
    },
  },
});

export const { updateLiveLocation, setActiveAssignment, clearActiveAssignment } =
  ambulancesSlice.actions;

export const selectLiveLocations = (state) => state.ambulances.liveLocations;
export const selectActiveAssignment = (state) => state.ambulances.activeAssignment;

export default ambulancesSlice.reducer;


import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  unreadCount: 0,
};

export const notificationsSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    setUnreadCount: (state, action) => {
      state.unreadCount = Math.max(0, action.payload);
    },
    incrementUnreadCount: (state) => {
      state.unreadCount += 1;
    },
    decrementUnreadCount: (state) => {
      state.unreadCount = Math.max(0, state.unreadCount - 1);
    },
    clearUnreadCount: (state) => {
      state.unreadCount = 0;
    },
  },
});

export const {
  setUnreadCount,
  incrementUnreadCount,
  decrementUnreadCount,
  clearUnreadCount,
} = notificationsSlice.actions;

export const selectUnreadCount = (state) => state.notifications.unreadCount;

export default notificationsSlice.reducer;


import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  user: null,
  roles: [],
  isAuthenticated: false,
  loading: false,
  error: null,
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
      if (action.payload) {
        state.roles = Array.isArray(action.payload.roles)
          ? action.payload.roles
          : action.payload.role
          ? [action.payload.role]
          : [];
      } else {
        state.roles = [];
      }
      state.error = null;
    },
    setRoles: (state, action) => {
      state.roles = Array.isArray(action.payload) ? action.payload : [action.payload];
    },
    clearUser: (state) => {
      state.user = null;
      state.roles = [];
      state.isAuthenticated = false;
      state.error = null;
    },
    setAuthLoading: (state, action) => {
      state.loading = action.payload;
    },
    setAuthError: (state, action) => {
      state.error = action.payload;
    },
  },
});

export const { setUser, setRoles, clearUser, setAuthLoading, setAuthError } =
  authSlice.actions;

export const selectUser = (state) => state.auth.user;
export const selectRoles = (state) => state.auth.roles;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectAuthLoading = (state) => state.auth.loading;
export const selectAuthError = (state) => state.auth.error;

export default authSlice.reducer;


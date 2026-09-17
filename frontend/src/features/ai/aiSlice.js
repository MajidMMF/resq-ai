import { createSlice } from "@reduxjs/toolkit";

const loadSavedState = () => {
  if (typeof window === "undefined") return {};
  try {
    const saved = localStorage.getItem("resq_ai_panel_state");
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
};

const savedState = loadSavedState();

const initialState = {
  isOpen: false,
  isMinimized: false,
  isExpanded: false,
  position: savedState.position || null,
  activeIncidentId: null,
  messages: [],
  isLoading: false,
  error: null,
};

const saveStateToStorage = (state) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      "resq_ai_panel_state",
      JSON.stringify({
        position: state.position,
        isExpanded: state.isExpanded,
      })
    );
  } catch {}
};

export const aiSlice = createSlice({
  name: "ai",
  initialState,
  reducers: {
    // Existing reducers - preserved 100%
    toggleAIChat: (state) => {
      state.isOpen = !state.isOpen;
      if (state.isOpen) {
        state.isMinimized = false;
      }
    },
    setAIChatOpen: (state, action) => {
      state.isOpen = action.payload;
      if (action.payload) {
        state.isMinimized = false;
      }
    },
    setAIChatIncidentId: (state, action) => {
      state.activeIncidentId = action.payload;
    },
    addMessage: (state, action) => {
      state.messages.push(action.payload);
    },
    setMessages: (state, action) => {
      state.messages = action.payload;
    },
    clearMessages: (state) => {
      state.messages = [];
    },
    setAILoading: (state, action) => {
      state.isLoading = action.payload;
    },

    // New additions for panel management
    minimizePanel: (state) => {
      state.isMinimized = true;
    },
    restorePanel: (state) => {
      state.isMinimized = false;
    },
    toggleExpand: (state) => {
      state.isExpanded = !state.isExpanded;
      if (state.isExpanded) {
        state.isMinimized = false;
      }
      saveStateToStorage(state);
    },
    setPanelPosition: (state, action) => {
      state.position = action.payload;
      saveStateToStorage(state);
    },
    setAIError: (state, action) => {
      state.error = action.payload;
    },
  },
});

export const {
  toggleAIChat,
  setAIChatOpen,
  setAIChatIncidentId,
  addMessage,
  setMessages,
  clearMessages,
  setAILoading,
  minimizePanel,
  restorePanel,
  toggleExpand,
  setPanelPosition,
  setAIError,
} = aiSlice.actions;

// Selectors
export const selectIsAIOpen = (state) => state.ai.isOpen;
export const selectIsAIMinimized = (state) => state.ai.isMinimized;
export const selectIsAIExpanded = (state) => state.ai.isExpanded;
export const selectAIPanelPosition = (state) => state.ai.position;
export const selectAIChatIncidentId = (state) => state.ai.activeIncidentId;
export const selectAIMessages = (state) => state.ai.messages;
export const selectIsAILoading = (state) => state.ai.isLoading;
export const selectAIError = (state) => state.ai.error;

export default aiSlice.reducer;

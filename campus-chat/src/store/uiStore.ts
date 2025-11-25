import { create } from "zustand";

interface TypingState {
  [threadId: string]: {
    [userId: string]: boolean;
  };
}

export interface ModalState {
  isOpen: boolean;
  type: "create-channel" | "channel-settings" | "user-settings" | null;
  data?: any;
}

interface UIState {
  sidebarOpen: boolean;
  activePanel: "chat" | "search" | "files" | "settings";
  modal: ModalState;
  typingState: TypingState;
  
  // Actions
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setActivePanel: (panel: "chat" | "search" | "files" | "settings") => void;
  openModal: (type: ModalState["type"], data?: any) => void;
  closeModal: () => void;
  
  setTypingState: (threadId: string, userId: string, isTyping: boolean) => void;
  clearTypingState: (threadId: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  activePanel: "chat",
  modal: { isOpen: false, type: null },
  typingState: {},

  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setActivePanel: (activePanel) => set({ activePanel }),
  
  openModal: (type, data) => set({ modal: { isOpen: true, type, data } }),
  closeModal: () => set({ modal: { isOpen: false, type: null, data: undefined } }),

  setTypingState: (threadId, userId, isTyping) =>
    set((state) => ({
      typingState: {
        ...state.typingState,
        [threadId]: {
          ...state.typingState[threadId],
          [userId]: isTyping,
        },
      },
    })),
  clearTypingState: (threadId) =>
    set((state) => {
      const next = { ...state.typingState };
      delete next[threadId];
      return { typingState: next };
    }),
}));

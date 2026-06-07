import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { enableMapSet } from 'immer';

// Required for Immer to support JS Maps and Sets
enableMapSet();

export type ViewType = 'grid' | 'charts' | 'analysis' | 'ai' | 'report';
export type PanelType = 'sidebar' | 'aiPanel' | 'columnProfile' | 'chartConfig' | 'pivot';
export type ModalType = 'upload' | 'export' | 'settings' | 'shortcuts';

interface UIState {
  activeView: ViewType;
  openPanels: Set<PanelType>;
  activeModal: ModalType | null;
  commandPaletteOpen: boolean;
  sidebarCollapsed: boolean;
  rightPanelWidth: number;
  isMobile: boolean;
  theme: 'dark' | 'light';

  // Actions
  setActiveView: (view: ViewType) => void;
  togglePanel: (panel: PanelType) => void;
  openModal: (modal: ModalType) => void;
  closeModal: () => void;
  toggleCommandPalette: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setRightPanelWidth: (width: number) => void;
  setIsMobile: (isMobile: boolean) => void;
  toggleTheme: () => void;
}

export const useUIStore = create<UIState>()(
  immer((set) => ({
    activeView: 'grid',
    openPanels: new Set<PanelType>(['sidebar']),
    activeModal: null,
    commandPaletteOpen: false,
    sidebarCollapsed: false,
    rightPanelWidth: 380,
    isMobile: false,
    theme: 'dark',

    setActiveView: (view) => set((state) => {
      state.activeView = view;
    }),

    togglePanel: (panel) => set((state) => {
      if (state.openPanels.has(panel)) {
        state.openPanels.delete(panel);
      } else {
        state.openPanels.add(panel);
      }
    }),

    openModal: (modal) => set((state) => {
      state.activeModal = modal;
    }),

    closeModal: () => set((state) => {
      state.activeModal = null;
    }),

    toggleCommandPalette: () => set((state) => {
      state.commandPaletteOpen = !state.commandPaletteOpen;
    }),

    setSidebarCollapsed: (collapsed) => set((state) => {
      state.sidebarCollapsed = collapsed;
    }),

    setRightPanelWidth: (width) => set((state) => {
      state.rightPanelWidth = width;
    }),

    setIsMobile: (isMobile) => set((state) => {
      state.isMobile = isMobile;
    }),

    toggleTheme: () => set((state) => {
      state.theme = state.theme === 'dark' ? 'light' : 'dark';
    }),
  }))
);

import { create } from 'zustand'

interface UIState {
    isLoginOpen: boolean
    isSignupOpen: boolean
    openLogin: () => void
    closeLogin: () => void
    openSignup: () => void
    closeSignup: () => void

    // Grid & Zoom State
    isGridEnabled: boolean
    toggleGrid: () => void
    isAxisEnabled: boolean
    toggleAxis: () => void
    showGridDimensions: boolean
    toggleGridDimensions: () => void
    gridUnit: string
    setGridUnit: (unit: string) => void
    cameraZoomLevel: number // meters
    setCameraZoomLevel: (level: number) => void
}

export const useUIStore = create<UIState>((set) => ({
    isLoginOpen: false,
    isSignupOpen: false,
    openLogin: () => set({ isLoginOpen: true, isSignupOpen: false }),
    closeLogin: () => set({ isLoginOpen: false }),
    openSignup: () => set({ isSignupOpen: true, isLoginOpen: false }),
    closeSignup: () => set({ isSignupOpen: false }),

    isGridEnabled: true,
    toggleGrid: () => set((state) => ({ isGridEnabled: !state.isGridEnabled })),
    isAxisEnabled: true,
    toggleAxis: () => set((state) => ({ isAxisEnabled: !state.isAxisEnabled })),
    showGridDimensions: false,
    toggleGridDimensions: () => set((state) => ({ showGridDimensions: !state.showGridDimensions })),
    gridUnit: 'mm',
    setGridUnit: (unit) => set({ gridUnit: unit }),
    cameraZoomLevel: 1.5,
    setCameraZoomLevel: (level) => set({ cameraZoomLevel: level }),
}))

import { create } from 'zustand'

interface UIState {
    isLoginOpen: boolean
    isSignupOpen: boolean
    openLogin: () => void
    closeLogin: () => void
    openSignup: () => void
    closeSignup: () => void
}

export const useUIStore = create<UIState>((set) => ({
    isLoginOpen: false,
    isSignupOpen: false,
    openLogin: () => set({ isLoginOpen: true, isSignupOpen: false }),
    closeLogin: () => set({ isLoginOpen: false }),
    openSignup: () => set({ isSignupOpen: true, isLoginOpen: false }),
    closeSignup: () => set({ isSignupOpen: false }),
}))

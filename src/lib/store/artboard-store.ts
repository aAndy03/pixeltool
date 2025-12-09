import { create } from 'zustand'

export interface Artboard {
    id: string
    name: string
    width: number // stored in pixels (base unit)
    height: number // stored in pixels
    x: number
    y: number
    dpi: number // Target resolution
    physicalWidth: number // stored in mm for reference/re-calc
    physicalHeight: number // stored in mm
}

interface ArtboardState {
    artboards: Artboard[]
    addArtboard: (artboard: Artboard) => void
    updateArtboard: (id: string, updates: Partial<Artboard>) => void
    removeArtboard: (id: string) => void
}

export const useArtboardStore = create<ArtboardState>((set) => ({
    artboards: [],
    addArtboard: (artboard) => set((state) => ({ artboards: [...state.artboards, artboard] })),
    updateArtboard: (id, updates) => set((state) => ({
        artboards: state.artboards.map((ab) => ab.id === id ? { ...ab, ...updates } : ab)
    })),
    removeArtboard: (id) => set((state) => ({ artboards: state.artboards.filter((ab) => ab.id !== id) })),
}))

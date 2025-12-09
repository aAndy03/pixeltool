import { create } from 'zustand'
import { createArtboard, getArtboards, updateArtboard, deleteArtboard } from '@/app/actions/artboards'

export interface Artboard {
    id: string
    name: string
    width: number // stored in pixels
    height: number // stored in pixels
    x: number
    y: number
    settings?: any // dpi, physical dimensions
}

interface ArtboardState {
    artboards: Artboard[]
    isLoading: boolean

    loadArtboards: (projectId: string) => Promise<void>

    // Actions now return Promise for UI feedback
    create: (projectId: string, data: Omit<Artboard, 'id'>) => Promise<boolean>
    update: (id: string, updates: Partial<Artboard>) => Promise<void>
    remove: (id: string) => Promise<void>
}

export const useArtboardStore = create<ArtboardState>((set, get) => ({
    artboards: [],
    isLoading: false,

    loadArtboards: async (projectId: string) => {
        set({ isLoading: true })
        const { success, data } = await getArtboards(projectId)
        if (success && data) {
            // Map DB fields if necessary, currently they match
            set({ artboards: data as Artboard[], isLoading: false })
        } else {
            console.error('Failed to load artboards')
            set({ artboards: [], isLoading: false })
        }
    },

    create: async (projectId, data) => {
        const { success, artboard } = await createArtboard(projectId, {
            name: data.name,
            width: data.width,
            height: data.height,
            x: data.x,
            y: data.y,
            settings: data.settings || {}
        })

        if (success && artboard) {
            set(state => ({ artboards: [...state.artboards, artboard as Artboard] }))
            return true
        }
        return false
    },

    update: async (id, updates) => {
        // Optimistic update
        set(state => ({
            artboards: state.artboards.map(ab => ab.id === id ? { ...ab, ...updates } : ab)
        }))

        // Sync with server
        // Map 'settings' if it's partial? 
        // existing updateArtboard takes 'any', we should be careful.
        await updateArtboard(id, updates)
    },

    remove: async (id) => {
        // Optimistic remove
        const previousArtboards = get().artboards
        set(state => ({ artboards: state.artboards.filter(ab => ab.id !== id) }))

        const { success } = await deleteArtboard(id)
        if (!success) {
            // Revert
            set({ artboards: previousArtboards })
        }
    }
}))

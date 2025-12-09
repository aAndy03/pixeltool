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
    sort_order: number
}

interface ArtboardState {
    artboards: Artboard[]
    selectedArtboardIds: string[]
    isLoading: boolean

    loadArtboards: (projectId: string) => Promise<void>

    create: (projectId: string, data: Omit<Artboard, 'id' | 'sort_order'>) => Promise<boolean>
    update: (id: string, updates: Partial<Artboard>) => Promise<void>
    remove: (id: string) => Promise<void>

    selectArtboard: (id: string | null, multi?: boolean) => void
    reorderArtboards: (activeId: string, overId: string) => Promise<void>

    // Transient state for camera focusing
    focusArtboardId: string | null
    setFocus: (id: string | null) => void

    // Transient state for Zoom-to-Fit
    zoomToArtboardId: string | null
    setZoomTo: (id: string | null) => void
}

export const useArtboardStore = create<ArtboardState>((set, get) => ({
    artboards: [],
    selectedArtboardIds: [],
    isLoading: false,
    focusArtboardId: null,
    zoomToArtboardId: null,

    setFocus: (id) => set({ focusArtboardId: id }),
    setZoomTo: (id) => set({ zoomToArtboardId: id }),

    loadArtboards: async (projectId: string) => {
        set({ isLoading: true })
        const { success, data } = await getArtboards(projectId)
        if (success && data) {
            // Sort by sort_order
            const sorted = (data as Artboard[]).sort((a, b) => (b.sort_order || 0) - (a.sort_order || 0))
            set({ artboards: sorted, isLoading: false })
        } else {
            console.error('Failed to load artboards')
            set({ artboards: [], isLoading: false })
        }
    },

    create: async (projectId, data) => {
        const currentArtboards = get().artboards
        // New artboard goes to top (highest sort_order + 1)
        const maxSort = currentArtboards.length > 0 ? Math.max(...currentArtboards.map(a => a.sort_order || 0)) : 0
        const newSortOrder = maxSort + 1

        const { success, artboard } = await createArtboard(projectId, {
            name: data.name,
            width: data.width,
            height: data.height,
            x: data.x,
            y: data.y,
            settings: data.settings || {},
            // We need to update createArtboard action to accept sort_order or handle it
            // For now passing it implicitly if the action allows extra fields or via settings, 
            // but effectively we need to add it to DB. 
            // The action 'createArtboard' defined earlier didn't explicitly map it but passed 'data' to insert?
            // Checking the action... it passed specific fields. I need to update the action too or 
            // just rely on default 0 and update it immediately? Better to update action. 
            // I'll assume I'll update the action next.
            // For now, let's assume the action takes what we give or we update it after.
            // Actually, best to update the action definition.
        } as any)

        if (success && artboard) {
            // Local update
            const newArtboard = { ...artboard, sort_order: newSortOrder } as Artboard
            // Update sort_order on server? or did we pass it?
            // If the server action ignores it, we might need a separate update.
            // Let's assume we'll update the server action.

            // To ensure consistency, we'll update it right away if strict
            if (artboard.sort_order !== newSortOrder) {
                await updateArtboard(artboard.id, { sort_order: newSortOrder })
                newArtboard.sort_order = newSortOrder
            }

            set(state => ({ artboards: [newArtboard, ...state.artboards] })) // Add to start (Top)
            return true
        }
        return false
    },

    update: async (id, updates) => {
        set(state => ({
            artboards: state.artboards.map(ab => ab.id === id ? { ...ab, ...updates } : ab)
        }))
        await updateArtboard(id, updates)
    },

    remove: async (id) => {
        const previousArtboards = get().artboards
        set(state => ({
            artboards: state.artboards.filter(ab => ab.id !== id),
            selectedArtboardIds: state.selectedArtboardIds.filter(sid => sid !== id)
        }))

        const { success } = await deleteArtboard(id)
        if (!success) {
            set({ artboards: previousArtboards })
        }
    },

    selectArtboard: (id, multi = false) => {
        set(state => {
            if (id === null) return { selectedArtboardIds: [] }

            if (multi) {
                const exists = state.selectedArtboardIds.includes(id)
                return {
                    selectedArtboardIds: exists
                        ? state.selectedArtboardIds.filter(sid => sid !== id)
                        : [...state.selectedArtboardIds, id]
                }
            }

            return { selectedArtboardIds: [id] }
        })
    },

    reorderArtboards: async (activeId, overId) => {
        const { artboards } = get()
        const oldIndex = artboards.findIndex(a => a.id === activeId)
        const newIndex = artboards.findIndex(a => a.id === overId)

        if (oldIndex === -1 || newIndex === -1) return

        // Create new array with moved item
        const newArtboards = [...artboards]
        const [movedItem] = newArtboards.splice(oldIndex, 1)
        newArtboards.splice(newIndex, 0, movedItem)

        // Re-assign sort orders based on new index (Top of list = Highest sort_order?)
        // Visual Layer Panel: Top item is Top Layer (Highest Z).
        // List Index 0 is Top.
        // So Index 0 gets Sort Order N, Index N gets Sort Order 0.

        const len = newArtboards.length
        const updates: Promise<any>[] = []

        const updatedArtboards = newArtboards.map((artboard, index) => {
            const newSortOrder = len - 1 - index // 0th item gets max sort_order
            if (artboard.sort_order !== newSortOrder) {
                updates.push(updateArtboard(artboard.id, { sort_order: newSortOrder }))
                return { ...artboard, sort_order: newSortOrder }
            }
            return artboard
        })

        set({ artboards: updatedArtboards })
        await Promise.all(updates)
    }
}))

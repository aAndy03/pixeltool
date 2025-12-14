import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import { db, LayerOrder } from '@/lib/db'
import { syncEngine } from '@/lib/sync/sync-engine'

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

    // Camera States
    focusArtboardId: string | null
    zoomToArtboardId: string | null

    setFocus: (id: string | null) => void
    setZoomTo: (id: string | null) => void

    loadArtboards: (projectId: string) => Promise<void>

    create: (projectId: string, data: Omit<Artboard, 'id' | 'sort_order'>) => Promise<boolean>
    update: (id: string, updates: Partial<Artboard>) => Promise<void>
    remove: (id: string) => Promise<void>

    selectArtboard: (id: string | null, multi?: boolean) => void
    reorderArtboards: (activeId: string, overId: string) => Promise<void>
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

        // 1. Load from LocalDB (Instant)
        const localArtboards = await db.artboards
            .where('project_id')
            .equals(projectId)
            .toArray() as Artboard[] // Dexie types can be loose

        // Sort
        const sorted = localArtboards.sort((a, b) => (b.sort_order || 0) - (a.sort_order || 0))

        set({ artboards: sorted, isLoading: false })

        // 2. Trigger Background Sync (Pull)
        syncEngine.pullChanges(projectId).then(async () => {
            // Re-read after sync (could optimize to only update if changed)
            const syncedArtboards = await db.artboards
                .where('project_id')
                .equals(projectId)
                .toArray() as Artboard[]

            const sortedSynced = syncedArtboards.sort((a, b) => (b.sort_order || 0) - (a.sort_order || 0))
            set({ artboards: sortedSynced })
        })
    },

    create: async (projectId, data) => {
        const currentArtboards = get().artboards
        const maxSort = currentArtboards.length > 0 ? Math.max(...currentArtboards.map(a => a.sort_order || 0)) : 0
        const newSortOrder = maxSort + 1

        // GEN UUID LOCALLY
        const newId = uuidv4()

        const newArtboard: Artboard & { project_id: string } = {
            id: newId,
            project_id: projectId,
            name: data.name,
            width: data.width,
            height: data.height,
            x: data.x,
            y: data.y,
            settings: data.settings || {},
            sort_order: newSortOrder
        }

        // Optimistic UI
        set(state => ({ artboards: [newArtboard, ...state.artboards] }))

        // Local Persist
        await db.artboards.put(newArtboard)

        // Queue Sync for artboard
        await db.pendingSync.put({
            id: uuidv4(),
            entityType: 'artboard',
            entityId: newId,
            action: 'create',
            timestamp: Date.now()
        })

        // Also create layer_order entry for unified ordering
        const layerOrderEntry: LayerOrder = {
            id: uuidv4(),
            project_id: projectId,
            layer_id: newId,
            layer_type: 'artboard',
            sort_order: newSortOrder
        }
        await db.layerOrder.put(layerOrderEntry)
        await db.pendingSync.put({
            id: uuidv4(),
            entityType: 'layer_order',
            entityId: layerOrderEntry.id,
            action: 'create',
            timestamp: Date.now()
        })

        syncEngine.schedulePush()
        return true
    },

    update: async (id, updates) => {
        // Optimistic UI
        set(state => ({
            artboards: state.artboards.map(ab => ab.id === id ? { ...ab, ...updates } : ab)
        }))

        // Local Persist (Merge)
        // We need to fetch existing to keep projectId and other fields if updates is partial
        const existing = await db.artboards.get(id)
        if (existing) {
            const updated = { ...existing, ...updates }
            await db.artboards.put(updated)

            // Queue Sync
            await db.pendingSync.put({
                id: uuidv4(),
                entityType: 'artboard',
                entityId: id,
                action: 'update',
                timestamp: Date.now()
            })

            syncEngine.schedulePush()
        }
    },

    remove: async (id) => {
        const previousArtboards = get().artboards
        set(state => ({
            artboards: state.artboards.filter(ab => ab.id !== id),
            selectedArtboardIds: state.selectedArtboardIds.filter(sid => sid !== id)
        }))

        // Local Persist
        await db.artboards.delete(id)

        // Queue Sync for artboard
        await db.pendingSync.put({
            id: uuidv4(),
            entityType: 'artboard',
            entityId: id,
            action: 'delete',
            timestamp: Date.now()
        })

        // Also delete from layer_order
        const layerOrderEntry = await db.layerOrder.where('layer_id').equals(id).first()
        if (layerOrderEntry) {
            await db.layerOrder.delete(layerOrderEntry.id)
            await db.pendingSync.put({
                id: uuidv4(),
                entityType: 'layer_order',
                entityId: layerOrderEntry.id,
                action: 'delete',
                timestamp: Date.now()
            })
        }

        syncEngine.schedulePush()
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

        const newArtboards = [...artboards]
        const [movedItem] = newArtboards.splice(oldIndex, 1)
        newArtboards.splice(newIndex, 0, movedItem)

        const len = newArtboards.length

        // Batch Updates for DB
        const updates: Promise<any>[] = []

        const updatedArtboards = newArtboards.map((artboard, index) => {
            const newSortOrder = len - 1 - index
            if (artboard.sort_order !== newSortOrder) {
                // Update LocalDB
                updates.push((async () => {
                    const existing = await db.artboards.get(artboard.id)
                    if (existing) {
                        await db.artboards.put({ ...existing, sort_order: newSortOrder })
                        await db.pendingSync.put({
                            id: uuidv4(),
                            entityType: 'artboard',
                            entityId: artboard.id,
                            action: 'update',
                            timestamp: Date.now()
                        })
                    }
                })())
                return { ...artboard, sort_order: newSortOrder }
            }
            return artboard
        })

        set({ artboards: updatedArtboards })

        await Promise.all(updates)
        syncEngine.schedulePush()
    }
}))

import { create } from 'zustand'
import { db, LayerOrder } from '@/lib/db'
import { syncEngine } from '@/lib/sync/sync-engine'

interface LayerOrderState {
    layerOrder: LayerOrder[]

    // Load order for a project
    loadLayerOrder: (projectId: string) => Promise<void>

    // Set order for a layer (create or update)
    setLayerOrder: (projectId: string, layerId: string, layerType: string, sortOrder: number) => Promise<void>

    // Reorder layers (swap two layers)
    reorderLayers: (projectId: string, fromLayerId: string, toLayerId: string) => Promise<void>

    // Remove layer from order (when layer is deleted)
    removeLayerOrder: (layerId: string) => Promise<void>

    // Get sorted layers for display
    getSortedLayerIds: (projectId: string) => string[]

    // Get sort order for a specific layer
    getLayerSortOrder: (layerId: string) => number
}

export const useLayerOrderStore = create<LayerOrderState>((set, get) => ({
    layerOrder: [],

    loadLayerOrder: async (projectId: string) => {
        // First, load existing layer_order entries
        const items = await db.layerOrder
            .where('project_id')
            .equals(projectId)
            .sortBy('sort_order')

        // Get all existing artboards and references
        const artboards = await db.artboards
            .where('project_id')
            .equals(projectId)
            .toArray()

        const references = await db.references
            .where('project_id')
            .equals(projectId)
            .toArray()

        // Find layers without layer_order entries (legacy data)
        const existingLayerIds = new Set(items.map(i => i.layer_id))
        const missingArtboards = artboards.filter(a => !existingLayerIds.has(a.id))
        const missingReferences = references.filter(r => !existingLayerIds.has(r.id))

        // Backfill: create layer_order entries for missing layers
        if (missingArtboards.length > 0 || missingReferences.length > 0) {
            const maxSort = items.length > 0
                ? Math.max(...items.map(i => i.sort_order || 0))
                : 0

            let nextSort = maxSort + 1

            // Add missing artboards
            for (const artboard of missingArtboards) {
                const newEntry: LayerOrder = {
                    id: crypto.randomUUID(),
                    project_id: projectId,
                    layer_id: artboard.id,
                    layer_type: 'artboard',
                    sort_order: nextSort++
                }
                await db.layerOrder.add(newEntry)
                items.push(newEntry)

                // Queue for sync
                await db.pendingSync.add({
                    id: crypto.randomUUID(),
                    entityType: 'layer_order',
                    entityId: newEntry.id,
                    action: 'create',
                    timestamp: Date.now()
                })
            }

            // Add missing references
            for (const reference of missingReferences) {
                const newEntry: LayerOrder = {
                    id: crypto.randomUUID(),
                    project_id: projectId,
                    layer_id: reference.id,
                    layer_type: 'reference',
                    sort_order: nextSort++
                }
                await db.layerOrder.add(newEntry)
                items.push(newEntry)

                // Queue for sync
                await db.pendingSync.add({
                    id: crypto.randomUUID(),
                    entityType: 'layer_order',
                    entityId: newEntry.id,
                    action: 'create',
                    timestamp: Date.now()
                })
            }

            // Schedule sync for backfilled entries
            syncEngine.schedulePush()
        }

        // Sort and set state
        const sorted = items.sort((a, b) => (b.sort_order || 0) - (a.sort_order || 0))
        set({ layerOrder: sorted })
    },

    setLayerOrder: async (projectId: string, layerId: string, layerType: string, sortOrder: number) => {
        const existing = await db.layerOrder.where('layer_id').equals(layerId).first()

        if (existing) {
            await db.layerOrder.update(existing.id, { sort_order: sortOrder })
            await db.pendingSync.add({
                id: crypto.randomUUID(),
                entityType: 'layer_order',
                entityId: existing.id,
                action: 'update',
                timestamp: Date.now()
            })
        } else {
            const newOrder: LayerOrder = {
                id: crypto.randomUUID(),
                project_id: projectId,
                layer_id: layerId,
                layer_type: layerType,
                sort_order: sortOrder
            }
            await db.layerOrder.add(newOrder)
            await db.pendingSync.add({
                id: crypto.randomUUID(),
                entityType: 'layer_order',
                entityId: newOrder.id,
                action: 'create',
                timestamp: Date.now()
            })
        }

        // Reload
        await get().loadLayerOrder(projectId)
        syncEngine.schedulePush()
    },

    reorderLayers: async (projectId: string, fromLayerId: string, toLayerId: string) => {
        const { layerOrder } = get()
        const fromItem = layerOrder.find(l => l.layer_id === fromLayerId)
        const toItem = layerOrder.find(l => l.layer_id === toLayerId)

        if (!fromItem || !toItem) return

        // Swap sort orders
        const fromOrder = fromItem.sort_order
        const toOrder = toItem.sort_order

        await db.layerOrder.update(fromItem.id, { sort_order: toOrder })
        await db.layerOrder.update(toItem.id, { sort_order: fromOrder })

        // Add to pending sync
        await db.pendingSync.bulkAdd([
            {
                id: crypto.randomUUID(),
                entityType: 'layer_order',
                entityId: fromItem.id,
                action: 'update',
                timestamp: Date.now()
            },
            {
                id: crypto.randomUUID(),
                entityType: 'layer_order',
                entityId: toItem.id,
                action: 'update',
                timestamp: Date.now()
            }
        ])

        await get().loadLayerOrder(projectId)
        syncEngine.schedulePush()
    },

    removeLayerOrder: async (layerId: string) => {
        const item = await db.layerOrder.where('layer_id').equals(layerId).first()
        if (!item) return

        await db.layerOrder.delete(item.id)
        await db.pendingSync.add({
            id: crypto.randomUUID(),
            entityType: 'layer_order',
            entityId: item.id,
            action: 'delete',
            timestamp: Date.now()
        })

        set(state => ({
            layerOrder: state.layerOrder.filter(l => l.layer_id !== layerId)
        }))
        syncEngine.schedulePush()
    },

    getSortedLayerIds: (projectId: string) => {
        const { layerOrder } = get()
        return layerOrder
            .filter(l => l.project_id === projectId)
            .sort((a, b) => b.sort_order - a.sort_order)
            .map(l => l.layer_id)
    },

    getLayerSortOrder: (layerId: string) => {
        const { layerOrder } = get()
        const item = layerOrder.find(l => l.layer_id === layerId)
        return item?.sort_order ?? 0
    }
}))

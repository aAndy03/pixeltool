'use client'

import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import { db } from '@/lib/db'
import { syncEngine } from '@/lib/sync/sync-engine'
import { DisplayUnit, toPx, DEFAULT_PPI } from '@/lib/math/units'

// Reference data from references.json
import referencesData from '@/data/references.json'

export interface ReferenceLayer {
    id: string
    referenceId: string      // ID from references.json (e.g., "Ikea Cup")
    viewType: 'top' | 'side' | 'bottom'
    name: string
    width: number            // pixels (converted from reference dimensions)
    height: number           // pixels
    x: number
    y: number
    settings: {
        showMeasurements?: boolean
        opacity?: number     // default 0.4
        physicalUnit?: DisplayUnit
        physicalWidth?: number
        physicalHeight?: number
        svgPath?: string
    }
    sort_order: number
}

interface ReferenceState {
    references: ReferenceLayer[]
    selectedReferenceIds: string[]
    isLoading: boolean

    // Camera States
    focusReferenceId: string | null
    zoomToReferenceId: string | null

    setFocus: (id: string | null) => void
    setZoomTo: (id: string | null) => void

    loadReferences: (projectId: string) => Promise<void>

    create: (projectId: string, data: {
        referenceId: string
        viewType: 'top' | 'side' | 'bottom'
        name: string
        viewportCenter: { x: number, y: number }
    }) => Promise<boolean>
    update: (id: string, updates: Partial<ReferenceLayer>) => Promise<void>
    remove: (id: string) => Promise<void>

    selectReference: (id: string | null, multi?: boolean) => void
    reorderReferences: (activeId: string, overId: string) => Promise<void>
}

// Helper to get reference data from JSON
function getReferenceData(referenceId: string) {
    return referencesData.find((r: any) => r.id === referenceId)
}

export const useReferenceStore = create<ReferenceState>((set, get) => ({
    references: [],
    selectedReferenceIds: [],
    isLoading: false,
    focusReferenceId: null,
    zoomToReferenceId: null,

    setFocus: (id) => set({ focusReferenceId: id }),
    setZoomTo: (id) => set({ zoomToReferenceId: id }),

    loadReferences: async (projectId: string) => {
        set({ isLoading: true })

        // Load from LocalDB
        const localReferences = await db.references
            .where('project_id')
            .equals(projectId)
            .toArray() as ReferenceLayer[]

        // Sort by sort_order (descending, like artboards)
        const sorted = localReferences.sort((a, b) => (b.sort_order || 0) - (a.sort_order || 0))

        set({ references: sorted, isLoading: false })
    },

    create: async (projectId, data) => {
        const { referenceId, viewType, name, viewportCenter } = data

        // Get reference data from JSON
        const refData = getReferenceData(referenceId)
        if (!refData) {
            console.error(`Reference not found: ${referenceId}`)
            return false
        }

        const view = (refData.views as any)[viewType]
        if (!view || view.svg_path === 'none') {
            console.error(`View not available: ${viewType}`)
            return false
        }

        // Convert dimensions to pixels
        const unit = view.unit as DisplayUnit
        const widthPx = toPx(view.width, unit, DEFAULT_PPI)
        const heightPx = toPx(view.height, unit, DEFAULT_PPI)

        const currentReferences = get().references
        const maxSort = currentReferences.length > 0
            ? Math.max(...currentReferences.map(r => r.sort_order || 0))
            : 0
        const newSortOrder = maxSort + 1

        const newId = uuidv4()

        const newReference: ReferenceLayer & { project_id: string } = {
            id: newId,
            project_id: projectId,
            referenceId,
            viewType,
            name,
            width: widthPx,
            height: heightPx,
            x: viewportCenter.x,
            y: viewportCenter.y,
            settings: {
                showMeasurements: false,
                opacity: 0.4,
                physicalUnit: unit,
                physicalWidth: view.width,
                physicalHeight: view.height,
                svgPath: view.svg_path
            },
            sort_order: newSortOrder
        }

        // Optimistic UI
        set(state => ({ references: [newReference, ...state.references] }))

        // Local Persist
        await db.references.put(newReference)

        // Queue Sync
        await db.pendingSync.put({
            id: uuidv4(),
            entityType: 'reference',
            entityId: newId,
            action: 'create',
            timestamp: Date.now()
        })

        syncEngine.schedulePush()
        return true
    },

    update: async (id, updates) => {
        // Optimistic UI
        set(state => ({
            references: state.references.map(ref =>
                ref.id === id ? { ...ref, ...updates } : ref
            )
        }))

        // Local Persist
        const existing = await db.references.get(id)
        if (existing) {
            const updated = { ...existing, ...updates }
            await db.references.put(updated)

            // Queue Sync
            await db.pendingSync.put({
                id: uuidv4(),
                entityType: 'reference',
                entityId: id,
                action: 'update',
                timestamp: Date.now()
            })

            syncEngine.schedulePush()
        }
    },

    remove: async (id) => {
        set(state => ({
            references: state.references.filter(ref => ref.id !== id),
            selectedReferenceIds: state.selectedReferenceIds.filter(sid => sid !== id)
        }))

        // Local Persist
        await db.references.delete(id)

        // Queue Sync
        await db.pendingSync.put({
            id: uuidv4(),
            entityType: 'reference',
            entityId: id,
            action: 'delete',
            timestamp: Date.now()
        })

        syncEngine.schedulePush()
    },

    selectReference: (id, multi = false) => {
        set(state => {
            if (id === null) return { selectedReferenceIds: [] }

            if (multi) {
                const exists = state.selectedReferenceIds.includes(id)
                return {
                    selectedReferenceIds: exists
                        ? state.selectedReferenceIds.filter(sid => sid !== id)
                        : [...state.selectedReferenceIds, id]
                }
            }
            return { selectedReferenceIds: [id] }
        })
    },

    reorderReferences: async (activeId, overId) => {
        const { references } = get()
        const oldIndex = references.findIndex(r => r.id === activeId)
        const newIndex = references.findIndex(r => r.id === overId)

        if (oldIndex === -1 || newIndex === -1) return

        const newReferences = [...references]
        const [movedItem] = newReferences.splice(oldIndex, 1)
        newReferences.splice(newIndex, 0, movedItem)

        const len = newReferences.length
        const updates: Promise<any>[] = []

        const updatedReferences = newReferences.map((reference, index) => {
            const newSortOrder = len - 1 - index
            if (reference.sort_order !== newSortOrder) {
                updates.push((async () => {
                    const existing = await db.references.get(reference.id)
                    if (existing) {
                        await db.references.put({ ...existing, sort_order: newSortOrder })
                        await db.pendingSync.put({
                            id: uuidv4(),
                            entityType: 'reference',
                            entityId: reference.id,
                            action: 'update',
                            timestamp: Date.now()
                        })
                    }
                })())
                return { ...reference, sort_order: newSortOrder }
            }
            return reference
        })

        set({ references: updatedReferences })

        await Promise.all(updates)
        syncEngine.schedulePush()
    }
}))

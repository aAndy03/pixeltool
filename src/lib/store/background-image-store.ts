'use client'

import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import { db, BackgroundImage } from '@/lib/db'
import { syncEngine } from '@/lib/sync/sync-engine'
import { DEFAULT_PPI } from '@/lib/math/units'

interface BackgroundImageState {
    backgroundImages: BackgroundImage[]
    selectedBackgroundImageIds: string[]
    isLoading: boolean

    loadBackgroundImages: (projectId: string) => Promise<void>

    create: (projectId: string, artboardId: string, data: {
        imageUrl: string
        naturalWidth: number
        naturalHeight: number
        width?: number
        height?: number
    }) => Promise<string | null>

    update: (id: string, updates: Partial<BackgroundImage>) => Promise<void>
    remove: (id: string) => Promise<void>

    selectBackgroundImage: (id: string | null, multi?: boolean) => void

    // Get background images for a specific artboard
    getByArtboard: (artboardId: string) => BackgroundImage[]
}

export const useBackgroundImageStore = create<BackgroundImageState>((set, get) => ({
    backgroundImages: [],
    selectedBackgroundImageIds: [],
    isLoading: false,

    loadBackgroundImages: async (projectId: string) => {
        set({ isLoading: true })

        // Load from LocalDB
        const localImages = await db.backgroundImages
            .where('project_id')
            .equals(projectId)
            .toArray()

        // Sort by artboard_id, then sort_order
        const sorted = localImages.sort((a, b) => {
            if (a.artboard_id !== b.artboard_id) {
                return a.artboard_id.localeCompare(b.artboard_id)
            }
            return (b.sort_order || 0) - (a.sort_order || 0)
        })

        set({ backgroundImages: sorted, isLoading: false })
    },

    create: async (projectId, artboardId, data) => {
        const { imageUrl, naturalWidth, naturalHeight, width, height } = data

        // Default to natural size if not specified
        const renderWidth = width || naturalWidth
        const renderHeight = height || naturalHeight

        const currentImages = get().backgroundImages.filter(i => i.artboard_id === artboardId)
        const maxSort = currentImages.length > 0
            ? Math.max(...currentImages.map(i => i.sort_order || 0))
            : 0
        const newSortOrder = maxSort + 1

        const newId = uuidv4()

        const newImage: BackgroundImage = {
            id: newId,
            project_id: projectId,
            artboard_id: artboardId,
            image_url: imageUrl,
            natural_width: naturalWidth,
            natural_height: naturalHeight,
            x: 0,
            y: 0,
            width: renderWidth,
            height: renderHeight,
            settings: {
                opacity: 1,
                linkDimensions: true,
                fit: 'custom',
                clip: true
            },
            sort_order: newSortOrder
        }

        // Optimistic UI
        set(state => ({ backgroundImages: [...state.backgroundImages, newImage] }))

        // Local Persist
        await db.backgroundImages.put(newImage)

        // Queue Sync
        await db.pendingSync.put({
            id: uuidv4(),
            entityType: 'background_image',
            entityId: newId,
            action: 'create',
            timestamp: Date.now()
        })

        syncEngine.schedulePush()
        return newId
    },

    update: async (id, updates) => {
        // Optimistic UI
        set(state => ({
            backgroundImages: state.backgroundImages.map(img =>
                img.id === id ? { ...img, ...updates } : img
            )
        }))

        // Local Persist
        const existing = await db.backgroundImages.get(id)
        if (existing) {
            const updated = { ...existing, ...updates }
            await db.backgroundImages.put(updated)

            // Queue Sync
            await db.pendingSync.put({
                id: uuidv4(),
                entityType: 'background_image',
                entityId: id,
                action: 'update',
                timestamp: Date.now()
            })

            syncEngine.schedulePush()
        }
    },

    remove: async (id) => {
        set(state => ({
            backgroundImages: state.backgroundImages.filter(img => img.id !== id),
            selectedBackgroundImageIds: state.selectedBackgroundImageIds.filter(sid => sid !== id)
        }))

        // Local Persist
        await db.backgroundImages.delete(id)

        // Queue Sync
        await db.pendingSync.put({
            id: uuidv4(),
            entityType: 'background_image',
            entityId: id,
            action: 'delete',
            timestamp: Date.now()
        })

        syncEngine.schedulePush()
    },

    selectBackgroundImage: (id, multi = false) => {
        set(state => {
            if (id === null) return { selectedBackgroundImageIds: [] }

            if (multi) {
                const exists = state.selectedBackgroundImageIds.includes(id)
                return {
                    selectedBackgroundImageIds: exists
                        ? state.selectedBackgroundImageIds.filter(sid => sid !== id)
                        : [...state.selectedBackgroundImageIds, id]
                }
            }
            return { selectedBackgroundImageIds: [id] }
        })
    },

    getByArtboard: (artboardId: string) => {
        return get().backgroundImages.filter(img => img.artboard_id === artboardId)
    }
}))

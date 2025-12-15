import Dexie, { Table } from 'dexie'
import { Artboard } from '@/lib/store/artboard-store'
import { Project } from '@/lib/store/project-store'
import { ReferenceLayer } from '@/lib/store/reference-store'

export interface SyncStatus {
    id: string
    entityType: 'artboard' | 'project' | 'reference' | 'layer_order' | 'background_image'
    entityId: string
    action: 'create' | 'update' | 'delete'
    data?: any
    timestamp: number
}

// Unified layer ordering across all layer types
export interface LayerOrder {
    id: string
    project_id: string
    layer_id: string      // ID of the layer (artboard, reference, etc.)
    layer_type: string    // 'artboard', 'reference', 'image', etc.
    sort_order: number
}

// Background image for artboards (clipping mask)
export interface BackgroundImage {
    id: string
    project_id: string
    artboard_id: string
    image_url: string
    natural_width: number   // Original image dimensions
    natural_height: number
    x: number              // Position offset within artboard
    y: number
    width: number          // Current rendered dimensions
    height: number
    settings?: {
        opacity?: number
        linkDimensions?: boolean  // Link W/H together
        physicalUnit?: string
        dpi?: number
    }
    sort_order: number
}

export class PixelDB extends Dexie {
    artboards!: Table<Artboard & { project_id: string; updated_at?: string }, string>
    projects!: Table<Project, string>
    references!: Table<ReferenceLayer & { project_id: string; updated_at?: string }, string>
    layerOrder!: Table<LayerOrder, string>
    backgroundImages!: Table<BackgroundImage, string>
    pendingSync!: Table<SyncStatus, string>

    constructor() {
        super('PixelDB')

        this.version(1).stores({
            artboards: 'id, project_id, [project_id+sort_order]',
            pendingSync: 'id, entityType, entityId, timestamp'
        })

        // Add Version 2 for Projects
        this.version(2).stores({
            projects: 'id, updated_at'
        })

        // Add Version 3 for References
        this.version(3).stores({
            references: 'id, project_id, [project_id+sort_order]'
        })

        // Add Version 4 for Unified Layer Order
        this.version(4).stores({
            layerOrder: 'id, project_id, layer_id, [project_id+sort_order]'
        })

        // Add Version 5 for Background Images
        this.version(5).stores({
            backgroundImages: 'id, project_id, artboard_id, [project_id+sort_order]'
        })
    }
}

export const db = new PixelDB()


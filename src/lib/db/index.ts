import Dexie, { Table } from 'dexie'
import { Artboard } from '@/lib/store/artboard-store'
import { Project } from '@/lib/store/project-store'
import { ReferenceLayer } from '@/lib/store/reference-store'

export interface SyncStatus {
    id: string
    entityType: 'artboard' | 'project' | 'reference'
    entityId: string
    action: 'create' | 'update' | 'delete'
    data?: any
    timestamp: number
}

export class PixelDB extends Dexie {
    artboards!: Table<Artboard & { project_id: string; updated_at?: string }, string>
    projects!: Table<Project, string>
    references!: Table<ReferenceLayer & { project_id: string; updated_at?: string }, string>
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
    }
}

export const db = new PixelDB()

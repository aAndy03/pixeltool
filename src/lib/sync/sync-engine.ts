import { db } from '@/lib/db'
import { bulkUpsertArtboards, bulkDeleteArtboards, getArtboards } from '@/app/actions/artboards'
import { bulkUpsertProjects, bulkDeleteProjects } from '@/app/actions/projects'
import { useEffect } from 'react'

const debounce = (func: Function, wait: number) => {
    let timeout: NodeJS.Timeout
    return (...args: any[]) => {
        clearTimeout(timeout)
        timeout = setTimeout(() => func(...args), wait)
    }
}

export class SyncEngine {
    private isSyncing = false

    // Schedule a push operation (Debounced)
    schedulePush = debounce(() => {
        this.pushChanges()
    }, 3000) // 3 seconds debounce

    async pushChanges() {
        if (this.isSyncing) return
        this.isSyncing = true

        try {
            // Get all pending changes
            const pending = await db.pendingSync.orderBy('timestamp').toArray()
            if (pending.length === 0) {
                this.isSyncing = false
                return
            }

            // --- STRATEGY: Collapse & Group ---

            // Map: EntityId -> Latest Action Task
            const latestOps = new Map<string, any>()

            for (const task of pending) {
                if (task.action === 'delete') {
                    latestOps.set(task.entityId, task)
                } else {
                    // Create/Update: If existing is Delete, Delete wins.
                    const existing = latestOps.get(task.entityId)
                    if (!existing || existing.action !== 'delete') {
                        latestOps.set(task.entityId, task)
                    }
                }
            }

            // Buckets
            const artboardsToUpsert: any[] = []
            const artboardsToDelete: string[] = []
            const projectsToUpsert: any[] = []
            const projectsToDelete: string[] = []

            // Process Map
            for (const [id, task] of latestOps) {
                if (task.entityType === 'artboard') {
                    if (task.action === 'delete') {
                        artboardsToDelete.push(id)
                    } else {
                        const data = await db.artboards.get(id)
                        if (data) artboardsToUpsert.push({
                            ...data,
                            id: data.id,
                            settings: data.settings || {}
                        })
                    }
                } else if (task.entityType === 'project') {
                    if (task.action === 'delete') {
                        projectsToDelete.push(id)
                    } else {
                        const data = await db.projects.get(id)
                        if (data) projectsToUpsert.push({
                            id: data.id,
                            name: data.name,
                            settings: data.settings
                        })
                    }
                }
            }

            // --- EXECUTE BULK ACTIONS ---

            // Artboards
            if (artboardsToUpsert.length > 0) await bulkUpsertArtboards(artboardsToUpsert)
            if (artboardsToDelete.length > 0) await bulkDeleteArtboards(artboardsToDelete)

            // Projects
            if (projectsToUpsert.length > 0) await bulkUpsertProjects(projectsToUpsert)
            if (projectsToDelete.length > 0) await bulkDeleteProjects(projectsToDelete)

            // --- CLEANUP ---
            // Remove processed IDs from pendingSync
            const processedIds = Array.from(latestOps.keys())
            if (processedIds.length > 0) {
                await db.pendingSync.where('entityId').anyOf(processedIds).delete()
            }

        } catch (error) {
            console.error('Sync execution failed:', error)
        } finally {
            this.isSyncing = false

            const remaining = await db.pendingSync.count()
            if (remaining > 0) this.schedulePush()
        }
    }

    async pullChanges(projectId: string) {
        const { success, data } = await getArtboards(projectId)

        if (success && data && data.length > 0) {
            const pending = await db.pendingSync
                .where('entityType').equals('artboard')
                .toArray()

            const dirtyIds = new Set(pending.map(p => p.entityId))
            const safeUpdates = (data as any[]).filter(serverItem => !dirtyIds.has(serverItem.id))

            if (safeUpdates.length > 0) {
                await db.artboards.bulkPut(safeUpdates)
            }
        }
    }
}

export const syncEngine = new SyncEngine()

export function useSync(projectId: string) {
    useEffect(() => {
        syncEngine.schedulePush()

        if (!projectId) return

        syncEngine.pullChanges(projectId)

        // Polling Strategy: 5 Minutes (Optimization)
        const interval = setInterval(() => {
            syncEngine.pullChanges(projectId)
        }, 300000) // 5 minutes

        return () => clearInterval(interval)
    }, [projectId])
}

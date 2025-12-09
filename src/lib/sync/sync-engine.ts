import { db } from '@/lib/db'
import { createArtboard, updateArtboard, deleteArtboard, getArtboards } from '@/app/actions/artboards'
import { createProject, updateProject, deleteProject } from '@/app/actions/projects'
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
    }, 2000)

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

            // Collapse updates by entityId
            const operations = new Map<string, any>()

            for (const task of pending) {
                if (task.action === 'delete') {
                    operations.set(task.entityId, task)
                } else if (!operations.has(task.entityId) || operations.get(task.entityId).action !== 'delete') {
                    operations.set(task.entityId, task)
                }
            }

            for (const [id, task] of operations) {
                if (task.entityType === 'artboard') {
                    if (task.action === 'delete') {
                        await deleteArtboard(id)
                    } else if (task.action === 'create') {
                        const data = await db.artboards.get(id)
                        if (data) {
                            await createArtboard(data.project_id, {
                                ...data,
                                id: data.id,
                                settings: data.settings || {}
                            } as any)
                        }
                    } else if (task.action === 'update') {
                        const data = await db.artboards.get(id)
                        if (data) {
                            await updateArtboard(id, data)
                        }
                    }
                } else if (task.entityType === 'project') {
                    if (task.action === 'delete') {
                        await deleteProject(id)
                    } else if (task.action === 'create') {
                        const data = await db.projects.get(id)
                        if (data) {
                            await createProject({
                                id: data.id,
                                name: data.name
                            })
                        }
                    } else if (task.action === 'update') {
                        const data = await db.projects.get(id)
                        if (data) {
                            await updateProject(id, {
                                name: data.name,
                                settings: data.settings
                            })
                        }
                    }
                }

                await db.pendingSync.where('entityId').equals(id).delete()
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

        const interval = setInterval(() => {
            syncEngine.pullChanges(projectId)
        }, 60000)

        return () => clearInterval(interval)
    }, [projectId])
}

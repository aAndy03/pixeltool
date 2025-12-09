import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import { db } from '@/lib/db'
import { syncEngine } from '@/lib/sync/sync-engine'
import { getProjects, createProject, updateProject, deleteProject } from '@/app/actions/projects'

export interface Project {
    id: string
    name: string
    settings: {
        camera?: { x: number, y: number, z: number } // Persistence
        [key: string]: any
    }
    updated_at: string
}

interface ProjectState {
    projects: Project[]
    currentProject: Project | null
    isLoading: boolean

    loadProjects: () => Promise<void>
    createNewProject: (name: string) => Promise<void>

    updateProject: (id: string, updates: Partial<Project>) => Promise<void>
    deleteProject: (id: string) => Promise<void>

    setCurrentProject: (project: Project | null) => void
    saveCameraState: (x: number, y: number, z: number) => void
}

export const useProjectStore = create<ProjectState>((set, get) => ({
    projects: [],
    currentProject: null,
    isLoading: false,

    loadProjects: async () => {
        set({ isLoading: true })
        const localProjects = await db.projects.orderBy('updated_at').reverse().toArray()
        set({ projects: localProjects, isLoading: false })

        const { success, data } = await getProjects()
        if (success && data) {
            // Need smart merge here too? 
            // For now simple bulkPut.
            await db.projects.bulkPut(data as Project[])
            const merged = await db.projects.orderBy('updated_at').reverse().toArray()
            set({ projects: merged })
        }
    },

    createNewProject: async (name: string) => {
        const newId = uuidv4()
        const newProject: Project = {
            id: newId,
            name,
            settings: {},
            updated_at: new Date().toISOString()
        }

        set(state => ({
            projects: [newProject, ...state.projects],
            currentProject: newProject
        }))

        await db.projects.put(newProject)

        await db.pendingSync.put({
            id: uuidv4(),
            entityType: 'project',
            entityId: newId,
            action: 'create',
            timestamp: Date.now()
        })
        syncEngine.schedulePush()
    },

    updateProject: async (id, updates) => {
        const { currentProject } = get()
        if (currentProject?.id === id) {
            const updatedCurrent = { ...currentProject, ...updates }
            set({ currentProject: updatedCurrent })
        }

        set(state => ({
            projects: state.projects.map(p => p.id === id ? { ...p, ...updates } : p)
        }))

        const existing = await db.projects.get(id)
        if (existing) {
            await db.projects.put({ ...existing, ...updates })

            await db.pendingSync.put({
                id: uuidv4(),
                entityType: 'project',
                entityId: id,
                action: 'update',
                timestamp: Date.now()
            })
            syncEngine.schedulePush()
        }
    },

    deleteProject: async (id) => {
        set(state => ({
            projects: state.projects.filter(p => p.id !== id),
            currentProject: state.currentProject?.id === id ? null : state.currentProject
        }))

        await db.projects.delete(id)

        await db.pendingSync.put({
            id: uuidv4(),
            entityType: 'project',
            entityId: id,
            action: 'delete',
            timestamp: Date.now()
        })
        syncEngine.schedulePush()
    },

    setCurrentProject: (project) => set({ currentProject: project }),

    saveCameraState: async (x, y, z) => {
        const { currentProject, updateProject } = get()
        if (!currentProject) return

        // Debounce handled by caller or assumed strictly frequent update
        // Use updateProject but avoid massive re-renders if possible?
        // updateProject updates Zustand state which triggers re-renders.
        // We might want valid "Last Saved" camera.

        const newSettings = {
            ...currentProject.settings,
            camera: { x, y, z }
        }

        // Call internal update
        await get().updateProject(currentProject.id, { settings: newSettings })
    }
}))

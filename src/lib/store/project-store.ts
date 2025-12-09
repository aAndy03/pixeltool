import { create } from 'zustand'
import { createProject, updateProject, getProjects } from '@/app/actions/projects'

export interface Project {
    id: string
    name: string
    settings: any
    updated_at: string
}

interface ProjectState {
    projects: Project[]
    currentProject: Project | null
    isLoading: boolean

    loadProjects: () => Promise<void>
    createNewProject: (name: string) => Promise<void>
    saveCurrentProject: () => Promise<void>
    setCurrentProject: (project: Project) => void
}

export const useProjectStore = create<ProjectState>((set, get) => ({
    projects: [],
    currentProject: null,
    isLoading: false,

    loadProjects: async () => {
        set({ isLoading: true })
        const { success, data } = await getProjects()
        if (success && data) {
            set({ projects: data as Project[], isLoading: false })
        } else {
            set({ isLoading: false })
        }
    },

    createNewProject: async (name: string) => {
        set({ isLoading: true })
        const { success, project } = await createProject(name)
        if (success && project) {
            const newProject = project as Project
            set(state => ({
                projects: [newProject, ...state.projects],
                currentProject: newProject,
                isLoading: false
            }))
        } else {
            set({ isLoading: false })
        }
    },

    saveCurrentProject: async () => {
        const { currentProject } = get()
        if (!currentProject) return

        // In a real app, we'd sync the canvas state here too
        // For now, we sync the settings/metadata
        await updateProject(currentProject.id, {
            settings: currentProject.settings,
            name: currentProject.name
        })
    },

    setCurrentProject: (project) => set({ currentProject: project })
}))

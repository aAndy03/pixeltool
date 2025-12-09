'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface ProjectData {
    id?: string
    name: string
}

export async function createProject(data: ProjectData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Unauthorized' }

    const { data: project, error } = await supabase
        .from('projects')
        .insert({
            id: data.id, // Explicit ID
            name: data.name,
            user_id: user.id,
            settings: {},
        })
        .select()
        .single()

    if (error) return { error: error.message }
    return { success: true, project }
}

export async function updateProject(id: string, updates: any) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Unauthorized' }

    const { error } = await supabase
        .from('projects')
        .update({
            ...updates,
            updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', user.id) // Ensure ownership

    if (error) return { error: error.message }
    return { success: true }
}

export async function deleteProject(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Unauthorized' }

    const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

    if (error) return { error: error.message }
    return { success: true }
}

export async function getProjects() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Unauthorized', data: [] }

    const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('updated_at', { ascending: false })

    if (error) return { error: error.message, data: [] }
    return { success: true, data }
}

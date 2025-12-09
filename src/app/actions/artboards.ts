'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface ArtboardData {
    name: string
    width: number
    height: number
    x: number
    y: number
    settings: any
}

export async function createArtboard(projectId: string, data: ArtboardData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Unauthorized' }

    const { data: artboard, error } = await supabase
        .from('artboards')
        .insert({
            project_id: projectId,
            name: data.name,
            width: data.width,
            height: data.height,
            x: data.x,
            y: data.y,
            settings: data.settings
        })
        .select()
        .single()

    if (error) return { error: error.message }
    return { success: true, artboard }
}

export async function getArtboards(projectId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Unauthorized', data: [] }

    const { data, error } = await supabase
        .from('artboards')
        .select('*')
        .eq('project_id', projectId)

    if (error) return { error: error.message, data: [] }
    return { success: true, data }
}

export async function updateArtboard(id: string, updates: any) {
    const supabase = await createClient()

    // RLS policy handles auth check implicitly via 'using' clause, 
    // but good to check user existence anyway (or let middleware handle it).

    const { error } = await supabase
        .from('artboards')
        .update({
            ...updates,
            updated_at: new Date().toISOString()
        })
        .eq('id', id)

    if (error) return { error: error.message }
    return { success: true }
}

export async function deleteArtboard(id: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('artboards')
        .delete()
        .eq('id', id)

    if (error) return { error: error.message }
    return { success: true }
}

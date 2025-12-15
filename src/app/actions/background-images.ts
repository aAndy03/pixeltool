'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getBackgroundImages(projectId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('background_images')
        .select('*')
        .eq('project_id', projectId)
        .order('sort_order', { ascending: false })

    if (error) {
        console.error('Error fetching background images:', error)
        return []
    }

    return data || []
}

export async function createBackgroundImage(data: {
    project_id: string
    artboard_id: string
    image_url: string
    natural_width: number
    natural_height: number
    width: number
    height: number
    x?: number
    y?: number
    settings?: any
    sort_order?: number
}) {
    const supabase = await createClient()

    const { data: image, error } = await supabase
        .from('background_images')
        .insert({
            ...data,
            x: data.x || 0,
            y: data.y || 0,
            settings: data.settings || {},
            sort_order: data.sort_order || 0
        })
        .select()
        .single()

    if (error) {
        console.error('Error creating background image:', error)
        return null
    }

    revalidatePath('/canvas')
    return image
}

export async function updateBackgroundImage(id: string, updates: {
    image_url?: string
    x?: number
    y?: number
    width?: number
    height?: number
    settings?: any
    sort_order?: number
}) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('background_images')
        .update({
            ...updates,
            updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

    if (error) {
        console.error('Error updating background image:', error)
        return null
    }

    revalidatePath('/canvas')
    return data
}

export async function deleteBackgroundImage(id: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('background_images')
        .delete()
        .eq('id', id)

    if (error) {
        console.error('Error deleting background image:', error)
        return false
    }

    revalidatePath('/canvas')
    return true
}

export async function bulkUpsertBackgroundImages(images: any[]) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('background_images')
        .upsert(images, { onConflict: 'id' })
        .select()

    if (error) {
        console.error('Error bulk upserting background images:', error)
        return []
    }

    return data || []
}

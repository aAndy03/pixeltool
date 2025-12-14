'use server'

import { createClient } from '@/lib/supabase/server'

export interface LayerOrderData {
    id?: string
    project_id: string
    layer_id: string
    layer_type: string
    sort_order: number
}

// Get all layer orders for a project
export async function getLayerOrder(projectId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Unauthorized', data: [] }

    const { data, error } = await supabase
        .from('layer_order')
        .select('*')
        .eq('project_id', projectId)
        .order('sort_order', { ascending: false })

    if (error) return { error: error.message, data: [] }
    return { success: true, data }
}

// BULK ACTIONS

export async function bulkUpsertLayerOrder(items: LayerOrderData[]) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    if (items.length === 0) return { success: true }

    const payload = items.map(item => ({
        id: item.id,
        project_id: item.project_id,
        layer_id: item.layer_id,
        layer_type: item.layer_type,
        sort_order: item.sort_order,
        updated_at: new Date().toISOString()
    }))

    const { error } = await supabase
        .from('layer_order')
        .upsert(payload)

    if (error) return { error: error.message }
    return { success: true }
}

export async function bulkDeleteLayerOrder(ids: string[]) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    if (ids.length === 0) return { success: true }

    const { error } = await supabase
        .from('layer_order')
        .delete()
        .in('id', ids)

    if (error) return { error: error.message }
    return { success: true }
}

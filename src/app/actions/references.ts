'use server'

import { createClient } from '@/lib/supabase/server'

export interface ReferenceData {
    id?: string
    project_id?: string
    referenceId: string      // ID from references.json (e.g., "Ikea Cup")
    viewType: string         // 'top', 'side', 'bottom'
    name: string
    width: number
    height: number
    x: number
    y: number
    settings: any
    sort_order?: number
}

// Get all references for a project
export async function getReferences(projectId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Unauthorized', data: [] }

    const { data, error } = await supabase
        .from('reference_layers')
        .select('*')
        .eq('project_id', projectId)
        .order('sort_order', { ascending: false })

    if (error) return { error: error.message, data: [] }

    // Map snake_case db columns to camelCase used in app
    const mapped = (data || []).map(r => ({
        id: r.id,
        project_id: r.project_id,
        referenceId: r.reference_id,
        viewType: r.view_type,
        name: r.name,
        width: r.width,
        height: r.height,
        x: r.x,
        y: r.y,
        settings: r.settings,
        sort_order: r.sort_order
    }))

    return { success: true, data: mapped }
}

// BULK ACTIONS (Optimization)

export async function bulkUpsertReferences(references: any[]) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    if (references.length === 0) return { success: true }

    // Map camelCase to snake_case for DB
    const payload = references.map(r => ({
        id: r.id,
        project_id: r.project_id,
        reference_id: r.referenceId,
        view_type: r.viewType,
        name: r.name,
        width: r.width,
        height: r.height,
        x: r.x,
        y: r.y,
        settings: r.settings,
        sort_order: r.sort_order,
        updated_at: new Date().toISOString()
    }))

    const { error } = await supabase
        .from('reference_layers')
        .upsert(payload)

    if (error) return { error: error.message }
    return { success: true }
}

export async function bulkDeleteReferences(ids: string[]) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    if (ids.length === 0) return { success: true }

    const { error } = await supabase
        .from('reference_layers')
        .delete()
        .in('id', ids)

    if (error) return { error: error.message }
    return { success: true }
}

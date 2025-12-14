'use client'

import { useState } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useReferenceStore } from '@/lib/store/reference-store'
import { useProjectStore } from '@/lib/store/project-store'
import { useUIStore } from '@/lib/store/ui-store'
import { Box } from 'lucide-react'

// Reference data from references.json
import referencesData from '@/data/references.json'

type ViewType = 'top' | 'side' | 'bottom'

export function ReferencePopover() {
    const { create } = useReferenceStore()
    const { currentProject } = useProjectStore()
    const { cameraZoomLevel } = useUIStore()

    // Inputs
    const [selectedReference, setSelectedReference] = useState<string>('')
    const [selectedView, setSelectedView] = useState<ViewType>('side')
    const [name, setName] = useState('')

    // UI State
    const [open, setOpen] = useState(false)
    const [isPending, setIsPending] = useState(false)

    // Get available views for selected reference
    const getAvailableViews = () => {
        const ref = referencesData.find((r: any) => r.id === selectedReference)
        if (!ref) return []

        const views: ViewType[] = []
        const refViews = ref.views as any

        if (refViews.top?.svg_path && refViews.top.svg_path !== 'none') views.push('top')
        if (refViews.side?.svg_path && refViews.side.svg_path !== 'none') views.push('side')
        if (refViews.bottom?.svg_path && refViews.bottom.svg_path !== 'none') views.push('bottom')

        return views
    }

    const handleReferenceChange = (refId: string) => {
        setSelectedReference(refId)
        const ref = referencesData.find((r: any) => r.id === refId)
        if (ref) {
            setName(ref.name)
            // Auto-select first available view
            const refViews = ref.views as any
            if (refViews.side?.svg_path && refViews.side.svg_path !== 'none') {
                setSelectedView('side')
            } else if (refViews.top?.svg_path && refViews.top.svg_path !== 'none') {
                setSelectedView('top')
            }
        }
    }

    const handleCreate = async () => {
        if (!currentProject) {
            alert('Please select or create a project first.')
            return
        }

        if (!selectedReference) {
            alert('Please select a reference object.')
            return
        }

        setIsPending(true)

        // Calculate viewport center (approximate based on camera position)
        // In a real implementation, we'd get this from the camera controls
        const viewportCenter = { x: 0, y: 0 }

        await create(currentProject.id, {
            referenceId: selectedReference,
            viewType: selectedView,
            name: name || 'Reference',
            viewportCenter
        })

        setIsPending(false)
        setOpen(false)

        // Reset form
        setSelectedReference('')
        setSelectedView('side')
        setName('')
    }

    const availableViews = getAvailableViews()

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button
                    className="p-2 rounded-full border border-white/10 backdrop-blur-md transition-colors bg-black/50 text-white/50 hover:bg-white/10 hover:text-white"
                    title="Add Reference"
                >
                    <Box className="w-5 h-5" />
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-72 bg-black/90 backdrop-blur border-white/10 text-white p-4" side="top" align="end">
                <div className="grid gap-4">
                    <div className="space-y-2">
                        <h4 className="font-medium leading-none">Add Reference</h4>
                        <p className="text-xs text-muted-foreground">Add a reference object to your canvas.</p>
                    </div>

                    {/* Reference Selection */}
                    <div className="grid gap-2">
                        <Label className="text-xs">Reference Object</Label>
                        <Select value={selectedReference} onValueChange={handleReferenceChange}>
                            <SelectTrigger className="h-8 bg-white/5 border-white/10 text-xs">
                                <SelectValue placeholder="Select reference..." />
                            </SelectTrigger>
                            <SelectContent>
                                {referencesData.map((ref: any) => (
                                    <SelectItem key={ref.id} value={ref.id}>
                                        {ref.name} ({ref.category})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* View Selection */}
                    {selectedReference && availableViews.length > 0 && (
                        <div className="grid gap-2">
                            <Label className="text-xs">View</Label>
                            <Select value={selectedView} onValueChange={(v) => setSelectedView(v as ViewType)}>
                                <SelectTrigger className="h-8 bg-white/5 border-white/10 text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableViews.map((view) => (
                                        <SelectItem key={view} value={view}>
                                            {view.charAt(0).toUpperCase() + view.slice(1)} View
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {/* Custom Name */}
                    <div className="grid gap-2">
                        <Label className="text-xs">Name</Label>
                        <Input
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="Reference name..."
                            className="h-8 bg-white/5 border-white/10"
                        />
                    </div>

                    {/* Preview info */}
                    {selectedReference && (
                        <div className="text-[10px] text-muted-foreground">
                            {(() => {
                                const ref = referencesData.find((r: any) => r.id === selectedReference)
                                if (!ref) return null
                                const view = (ref.views as any)[selectedView]
                                if (!view || view.width === 'none') return 'View not available'
                                return `Size: ${view.width} × ${view.height} ${view.unit}`
                            })()}
                        </div>
                    )}

                    <Button
                        onClick={handleCreate}
                        disabled={isPending || !selectedReference}
                        className="h-8 w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs"
                    >
                        {isPending ? 'Adding...' : 'Add Reference'}
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    )
}

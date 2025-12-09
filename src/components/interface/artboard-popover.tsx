'use client'

import { useState } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useArtboardStore } from '@/lib/store/artboard-store'
import { useProjectStore } from '@/lib/store/project-store'
import { toPx } from '@/lib/math/units'
import { Lock, Unlock, PlusSquare } from 'lucide-react'

export function ArtboardPopover() {
    const { create } = useArtboardStore()
    const { currentProject } = useProjectStore()

    // Inputs
    const [width, setWidth] = useState<number>(210)
    const [height, setHeight] = useState<number>(297)
    const [unit, setUnit] = useState('mm')
    const [dpi, setDpi] = useState<number>(300)
    const [name, setName] = useState('Artboard')
    const [lockedRatio, setLockedRatio] = useState(false)
    const [ratio, setRatio] = useState(210 / 297)

    // UI State
    const [open, setOpen] = useState(false)
    const [isPending, setIsPending] = useState(false)

    const handleWidthChange = (val: number) => {
        setWidth(val)
        if (lockedRatio) {
            setHeight(Number((val / ratio).toFixed(2)))
        } else {
            setRatio(val / height)
        }
    }

    const handleHeightChange = (val: number) => {
        setHeight(val)
        if (lockedRatio) {
            setWidth(Number((val * ratio).toFixed(2)))
        } else {
            setRatio(width / val)
        }
    }

    const toggleLock = () => {
        setLockedRatio(!lockedRatio)
        if (!lockedRatio) setRatio(width / height)
    }

    const handleCreate = async () => {
        if (!currentProject) {
            alert('Please select or create a project first.')
            return
        }

        setIsPending(true)
        const widthPx = toPx(width, unit as any, 96)
        const heightPx = toPx(height, unit as any, 96)

        await create(currentProject.id, {
            name,
            width: widthPx,
            height: heightPx,
            x: 0,
            y: 0,
            settings: { dpi, physicalUnit: unit, physicalWidth: width, physicalHeight: height }
        })

        setIsPending(false)
        setOpen(false)
        // Reset name increment?
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button
                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-white/5 hover:bg-white/10 text-white rounded-md transition-colors border border-white/10"
                >
                    <PlusSquare className="w-4 h-4" />
                    New Artboard
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-80 bg-black/90 backdrop-blur border-white/10 text-white p-4" align="start">
                <div className="grid gap-4">
                    <div className="space-y-2">
                        <h4 className="font-medium leading-none">New Artboard</h4>
                        <p className="text-xs text-muted-foreground">Add a new canvas to your project.</p>
                    </div>

                    <div className="grid gap-2">
                        <Label className="text-xs">Name</Label>
                        <Input value={name} onChange={e => setName(e.target.value)} className="h-8 bg-white/5 border-white/10" />
                    </div>

                    <div className="flex gap-2">
                        <div className="grid gap-2 flex-1">
                            <Label className="text-xs">W</Label>
                            <Input
                                type="number"
                                value={width}
                                onChange={e => handleWidthChange(Number(e.target.value))}
                                className="h-8 bg-white/5 border-white/10"
                            />
                        </div>
                        <div className="grid gap-2 flex-1">
                            <Label className="text-xs">H</Label>
                            <Input
                                type="number"
                                value={height}
                                onChange={e => handleHeightChange(Number(e.target.value))}
                                className="h-8 bg-white/5 border-white/10"
                            />
                        </div>
                        <div className="grid gap-2 w-[70px]">
                            <Label className="text-xs">Unit</Label>
                            <Select value={unit} onValueChange={setUnit}>
                                <SelectTrigger className="h-8 bg-white/5 border-white/10 text-xs"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="mm">mm</SelectItem>
                                    <SelectItem value="cm">cm</SelectItem>
                                    <SelectItem value="m">m</SelectItem>
                                    <SelectItem value="px">px</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                        <div className="flex items-center gap-1 cursor-pointer hover:text-white" onClick={toggleLock}>
                            {lockedRatio ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                            <span>Ratio: {ratio.toFixed(2)}</span>
                        </div>
                    </div>

                    <Button onClick={handleCreate} disabled={isPending} className="h-8 w-full bg-white text-black hover:bg-white/90 text-xs">
                        {isPending ? 'Creating...' : 'Create'}
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    )
}

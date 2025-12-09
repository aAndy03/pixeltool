'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useArtboardStore } from '@/lib/store/artboard-store'
import { toPx } from '@/lib/math/units'
import { v4 as uuidv4 } from 'uuid' // Need manual uuid or just random string
import { Lock, Unlock } from 'lucide-react'

// Simple ID generator if uuid not installed
const generateId = () => Math.random().toString(36).substr(2, 9)

interface ArtboardCreatorProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function ArtboardCreator({ open, onOpenChange }: ArtboardCreatorProps) {
    const { addArtboard } = useArtboardStore()

    // Inputs
    const [width, setWidth] = useState<number>(210) // default A4 width roughly
    const [height, setHeight] = useState<number>(297) // default A4 height
    const [unit, setUnit] = useState('mm')
    const [dpi, setDpi] = useState<number>(300) // Default Print DPI
    const [name, setName] = useState('Artboard 1')
    const [lockedRatio, setLockedRatio] = useState(false)
    const [ratio, setRatio] = useState(210 / 297)

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

    const handleCreate = () => {
        // Calculate dimensions in base pixels (internal unit)
        // Note: Users asked for "Real Life Scale". 
        // Our 'toPx' function converts Real World Unit -> Monitor Pixels (via Monitor PPI).
        // BUT, an Artboard also has "Project Resolution" (DPI).
        // If we want the artboard to BE 210mm wide on screen, we use the MONITOR PPI (handled by Scene/Camera).
        // The artboard stored `width` should be its physical width in our base unit (which is 1px = 1/96 inch default, or whatever).
        // Wait, for consistent 3D world: 1 unit = 1 px (at 96 PPI).
        // So we store width using toPx(width, unit, 96).
        // The `dpi` property is metadata for export/rasterization, it doesn't change the *physical size* of the plane in 3D.

        const widthPx = toPx(width, unit as any, 96)
        const heightPx = toPx(height, unit as any, 96)

        // Convert to mm for storage
        // actually `toPx` handles conversion from unit.
        // We store physical dimensions in mm in the store for reference? Yes.

        addArtboard({
            id: generateId(),
            name,
            width: widthPx,
            height: heightPx,
            x: 0,
            y: 0,
            dpi,
            physicalWidth: unit === 'mm' ? width : (unit === 'cm' ? width * 10 : width * 1000), // simplistic calc
            physicalHeight: unit === 'mm' ? height : (unit === 'cm' ? height * 10 : height * 1000)
        })
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[400px] bg-black/90 backdrop-blur border-white/10 text-white">
                <DialogHeader>
                    <DialogTitle>New Artboard</DialogTitle>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label>Name</Label>
                        <Input value={name} onChange={e => setName(e.target.value)} className="bg-white/5 border-white/10" />
                    </div>

                    <div className="flex gap-2">
                        <div className="grid gap-2 flex-1">
                            <Label>Width</Label>
                            <Input
                                type="number"
                                value={width}
                                onChange={e => handleWidthChange(Number(e.target.value))}
                                className="bg-white/5 border-white/10"
                            />
                        </div>
                        <div className="grid gap-2 flex-1">
                            <Label>Height</Label>
                            <Input
                                type="number"
                                value={height}
                                onChange={e => handleHeightChange(Number(e.target.value))}
                                className="bg-white/5 border-white/10"
                            />
                        </div>
                        <div className="grid gap-2 w-[80px]">
                            <Label>Unit</Label>
                            <Select value={unit} onValueChange={setUnit}>
                                <SelectTrigger className="bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="mm">mm</SelectItem>
                                    <SelectItem value="cm">cm</SelectItem>
                                    <SelectItem value="m">m</SelectItem>
                                    <SelectItem value="px">px</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-2 cursor-pointer hover:text-white" onClick={toggleLock}>
                            {lockedRatio ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                            <span>Aspect Ratio: {ratio.toFixed(2)}</span>
                        </div>
                        {/* Calculator placeholder if needed */}
                    </div>

                    <div className="grid gap-2">
                        <Label>Resolution (DPI)</Label>
                        <Input
                            type="number"
                            value={dpi}
                            onChange={e => setDpi(Number(e.target.value))}
                            className="bg-white/5 border-white/10"
                        />
                        <p className="text-[10px] text-muted-foreground">For print/export quality.</p>
                    </div>
                </div>

                <DialogFooter>
                    <Button onClick={handleCreate} className="w-full bg-white text-black hover:bg-white/90">Create Artboard</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

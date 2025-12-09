'use client'

import React from 'react'
import { useUIStore } from '@/lib/store/ui-store'
import { formatPx, fromPx } from '@/lib/math/units'
import { Grid3X3, Ruler, Check, Settings2 } from 'lucide-react'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

const UNITS = ['mm', 'cm', 'm', 'in', 'ft']

export function GridPanel() {
    const {
        isGridEnabled, toggleGrid,
        gridUnit, setGridUnit,
        cameraZoomLevel,
        isAxisEnabled, toggleAxis,
        showGridDimensions, toggleGridDimensions,
        isSnapEnabled, toggleSnap
    } = useUIStore()

    // Calculate value in selected unit
    const val = fromPx(cameraZoomLevel, gridUnit as any)
    const displayString = `${val.toFixed(2)} ${gridUnit}`

    return (
        <div className="flex items-center gap-2 pointer-events-auto">
            {/* Grid Settings Popover */}
            <Popover>
                <PopoverTrigger asChild>
                    <button
                        className={`p-2 rounded-full border border-white/10 backdrop-blur-md transition-colors ${isGridEnabled ? 'bg-white/20 text-white' : 'bg-black/50 text-white/50 hover:bg-white/10'
                            }`}
                        title="Grid Settings"
                    >
                        <Grid3X3 className="w-5 h-5" />
                    </button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-3 bg-black/90 border-white/10 backdrop-blur-xl space-y-3" side="top" align="end">

                    {/* Main Grid Toggle */}
                    <div className="flex items-center justify-between">
                        <Label className="text-white text-xs">Visual Grid</Label>
                        <Switch
                            checked={isGridEnabled}
                            onCheckedChange={toggleGrid}
                            className="scale-75"
                        />
                    </div>

                    {/* Snap Toggle */}
                    <div className="flex items-center justify-between">
                        <Label className="text-white text-xs">Snap to Grid</Label>
                        <Switch
                            checked={isSnapEnabled}
                            onCheckedChange={toggleSnap}
                            className="scale-75"
                        />
                    </div>

                    {/* Sub Options (Only if Grid is on? Or always?) */}
                    <div className={isGridEnabled ? "opacity-100 transition-opacity space-y-3" : "opacity-30 pointer-events-none transition-opacity space-y-3"}>
                        <div className="flex items-center justify-between">
                            <Label className="text-white/70 text-[10px]">Show Cell Dimensions</Label>
                            <Switch
                                checked={showGridDimensions}
                                onCheckedChange={toggleGridDimensions}
                                className="scale-75"
                            />
                        </div>
                    </div>

                    <div className="h-px bg-white/10" />

                    {/* Axis Toggle */}
                    <div className="flex items-center justify-between">
                        <Label className="text-white/70 text-xs">Show Axis</Label>
                        <Switch
                            checked={isAxisEnabled}
                            onCheckedChange={toggleAxis}
                            className="scale-75"
                        />
                    </div>

                </PopoverContent>
            </Popover>

            {/* Zoom Badge */}
            <Popover>
                <PopoverTrigger asChild>
                    <button className="flex items-center gap-2 px-3 py-2 h-10 rounded-full bg-black/80 backdrop-blur-md border border-white/10 hover:bg-white/10 transition-colors text-xs font-mono text-white/90">
                        <Ruler className="w-3 h-3 text-white/50" />
                        <span>{displayString}</span>
                    </button>
                </PopoverTrigger>
                <PopoverContent className="w-32 p-1 bg-black/90 border-white/10 backdrop-blur-xl" side="top" align="center">
                    <div className="grid grid-cols-1 gap-1">
                        {UNITS.map(unit => (
                            <Button
                                key={unit}
                                variant="ghost"
                                size="sm"
                                onClick={() => setGridUnit(unit)}
                                className={`text-xs h-7 justify-start ${gridUnit === unit ? 'bg-white/20 text-white' : 'text-white/70 hover:text-white hover:bg-white/10'
                                    }`}
                            >
                                {unit}
                            </Button>
                        ))}
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    )
}

'use client'

import { useState } from 'react'
import { useArtboardStore } from "@/lib/store/artboard-store"
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Smartphone, Monitor, Type } from "lucide-react"
import { fromPx, toPx, DisplayUnit, DEFAULT_PPI, formatAspectRatio } from '@/lib/math/units'

export function PropertiesPanel() {
    const { artboards, selectedArtboardIds, update } = useArtboardStore()

    // We only show panel if exactly one artboard is selected for now
    if (selectedArtboardIds.length !== 1) {
        return null
    }

    const selectedId = selectedArtboardIds[0]
    const artboard = artboards.find(a => a.id === selectedId)

    if (!artboard) return null

    const handleUpdate = (field: string, value: any) => {
        update(selectedId, { [field]: value })
    }

    const handleSettingUpdate = (field: string, value: any) => {
        const currentSettings = artboard.settings || {}
        update(selectedId, {
            settings: { ...currentSettings, [field]: value }
        })
    }

    // Get the artboard's stored unit and DPI for display
    const displayUnit: DisplayUnit = artboard.settings?.physicalUnit || 'mm'
    const artboardDpi = artboard.settings?.dpi || 300

    // Convert pixel dimensions to display unit
    const displayWidth = fromPx(artboard.width, displayUnit, DEFAULT_PPI)
    const displayHeight = fromPx(artboard.height, displayUnit, DEFAULT_PPI)

    const handleDimensionChange = (field: 'width' | 'height', valueInUnit: number) => {
        const valuePx = toPx(valueInUnit, displayUnit, DEFAULT_PPI)
        handleUpdate(field, valuePx)
    }

    const handleUnitChange = (newUnit: DisplayUnit) => {
        handleSettingUpdate('physicalUnit', newUnit)
    }

    const toggleOrientation = () => {
        const { width, height } = artboard
        // Swap if orientation mismatch
        // Simple swap logic
        update(selectedId, {
            width: height,
            height: width
        })
    }

    return (
        <div
            className="w-64 bg-black/80 backdrop-blur-md border border-white/10 rounded-lg flex flex-col pointer-events-auto shadow-2xl h-full overflow-hidden"
            onPointerDown={(e) => e.stopPropagation()} // Prevent scene interactions
        >
            <CardHeader className="p-3 border-b border-white/10 flex flex-row items-center space-y-0">
                <CardTitle className="text-xs font-semibold text-white/80 uppercase tracking-wider flex items-center gap-2">
                    <Type className="w-4 h-4 text-white/50" />
                    Properties
                </CardTitle>
            </CardHeader>

            <CardContent className="p-4 space-y-6">

                {/* Name */}
                <div className="space-y-2">
                    <Label className="text-xs text-white/50">Name</Label>
                    <Input
                        value={artboard.name}
                        onChange={(e) => handleUpdate('name', e.target.value)}
                        className="bg-black/50 border-white/10 h-8 text-xs text-white"
                    />
                </div>

                {/* Transform */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <Label className="text-xs text-white/50 font-bold">Dimensions</Label>
                        <Select value={displayUnit} onValueChange={(v) => handleUnitChange(v as DisplayUnit)}>
                            <SelectTrigger className="w-16 h-6 bg-white/5 border-white/10 text-[10px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="mm">mm</SelectItem>
                                <SelectItem value="cm">cm</SelectItem>
                                <SelectItem value="m">m</SelectItem>
                                <SelectItem value="in">in</SelectItem>
                                <SelectItem value="px">px</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                            <Label className="text-[10px] text-white/40">X</Label>
                            <Input
                                type="number"
                                value={Math.round(artboard.x)}
                                onChange={(e) => handleUpdate('x', Number(e.target.value))}
                                className="bg-black/50 border-white/10 h-7 text-xs text-white px-2"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-[10px] text-white/40">Y</Label>
                            <Input
                                type="number"
                                value={Math.round(artboard.y)}
                                onChange={(e) => handleUpdate('y', Number(e.target.value))}
                                className="bg-black/50 border-white/10 h-7 text-xs text-white px-2"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                            <Label className="text-[10px] text-white/40">W ({displayUnit})</Label>
                            <Input
                                type="number"
                                value={Number(displayWidth.toFixed(2))}
                                onChange={(e) => handleDimensionChange('width', Number(e.target.value))}
                                className="bg-black/50 border-white/10 h-7 text-xs text-white px-2"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-[10px] text-white/40">H ({displayUnit})</Label>
                            <Input
                                type="number"
                                value={Number(displayHeight.toFixed(2))}
                                onChange={(e) => handleDimensionChange('height', Number(e.target.value))}
                                className="bg-black/50 border-white/10 h-7 text-xs text-white px-2"
                            />
                        </div>
                    </div>

                    {/* Ratio & Orientation */}
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] text-white/40">
                            Ratio: {formatAspectRatio(artboard.width, artboard.height)}
                        </span>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-[10px] px-2 text-white/70 hover:text-white"
                            onClick={toggleOrientation}
                        >
                            {artboard.width > artboard.height ? <Monitor className="w-3 h-3 mr-1" /> : <Smartphone className="w-3 h-3 mr-1" />}
                            Rotate
                        </Button>
                    </div>
                </div>

                <div className="h-px bg-white/10" />

                {/* DPI Settings */}
                <div className="space-y-3">
                    <Label className="text-xs text-white/50 font-bold">Print Settings</Label>
                    <div className="flex items-center justify-between">
                        <Label className="text-xs text-white/70">DPI</Label>
                        <div className="flex items-center gap-2">
                            <Input
                                type="number"
                                value={artboardDpi}
                                onChange={(e) => handleSettingUpdate('dpi', Number(e.target.value))}
                                className="w-16 h-6 bg-black/50 border-white/10 text-[10px] text-white px-2"
                                min={1}
                                max={1200}
                            />
                            <span className="text-[10px] text-white/40">
                                {artboardDpi < 150 ? 'Low' : artboardDpi < 300 ? 'Med' : 'High'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Appearance */}
                <div className="space-y-4">
                    <Label className="text-xs text-white/50 font-bold">Appearance</Label>

                    {/* Background Color */}
                    <div className="flex items-center justify-between">
                        <Label className="text-xs text-white/70">Background</Label>
                        <div className="flex items-center gap-2">
                            <div
                                className="w-6 h-6 rounded border border-white/20"
                                style={{ backgroundColor: artboard.settings?.backgroundColor || '#ffffff' }}
                            />
                            <Input
                                type="color"
                                value={artboard.settings?.backgroundColor || '#ffffff'}
                                onChange={(e) => handleSettingUpdate('backgroundColor', e.target.value)}
                                className="w-8 h-8 p-0 border-0 bg-transparent cursor-pointer opacity-0 absolute"
                            />
                            <span className="text-xs text-white/50 font-mono">
                                {artboard.settings?.backgroundColor || '#ffffff'}
                            </span>
                        </div>
                    </div>

                    {/* Opacity */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label className="text-xs text-white/70">Opacity</Label>
                            <span className="text-xs text-white/50">
                                {Math.round((artboard.settings?.opacity ?? 1) * 100)}%
                            </span>
                        </div>
                        <Slider
                            value={[(artboard.settings?.opacity ?? 1) * 100]}
                            max={100}
                            step={1}
                            onValueChange={(val: number[]) => handleSettingUpdate('opacity', val[0] / 100)}
                            className="py-2"
                        />
                    </div>
                </div>

            </CardContent>
        </div>
    )
}

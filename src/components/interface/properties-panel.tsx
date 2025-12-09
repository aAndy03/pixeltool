'use client'

import { useArtboardStore } from "@/lib/store/artboard-store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { AlignVerticalSpaceAround, AlignHorizontalSpaceAround, Smartphone, Monitor, Type } from "lucide-react"

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
                    <Label className="text-xs text-white/50 font-bold">Transform</Label>

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
                            <Label className="text-[10px] text-white/40">W</Label>
                            <Input
                                type="number"
                                value={Math.round(artboard.width)}
                                onChange={(e) => handleUpdate('width', Number(e.target.value))}
                                className="bg-black/50 border-white/10 h-7 text-xs text-white px-2"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-[10px] text-white/40">H</Label>
                            <Input
                                type="number"
                                value={Math.round(artboard.height)}
                                onChange={(e) => handleUpdate('height', Number(e.target.value))}
                                className="bg-black/50 border-white/10 h-7 text-xs text-white px-2"
                            />
                        </div>
                    </div>

                    {/* Orientation */}
                    <Button
                        variant="secondary"
                        size="sm"
                        className="w-full text-xs h-7 bg-white/5 hover:bg-white/10 text-white/70"
                        onClick={toggleOrientation}
                    >
                        {artboard.width > artboard.height ? <Monitor className="w-3 h-3 mr-2" /> : <Smartphone className="w-3 h-3 mr-2" />}
                        Rotate
                    </Button>
                </div>

                <div className="h-px bg-white/10" />

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

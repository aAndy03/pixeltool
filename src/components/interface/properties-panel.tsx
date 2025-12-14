'use client'

import { useState } from 'react'
import { useArtboardStore } from "@/lib/store/artboard-store"
import { useReferenceStore } from "@/lib/store/reference-store"
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { MathInput } from "@/components/ui/math-input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Smartphone, Monitor, Type, Lock, Unlock, Link, Box, Ruler } from "lucide-react"
import { fromPx, toPx, DisplayUnit, DEFAULT_PPI, formatAspectRatio } from '@/lib/math/units'

export function PropertiesPanel() {
    const { artboards, selectedArtboardIds, update: updateArtboard } = useArtboardStore()
    const { references, selectedReferenceIds, update: updateReference } = useReferenceStore()
    const [isRatioLocked, setIsRatioLocked] = useState(false)
    const [scaleFactor, setScaleFactor] = useState(100)

    // Determine what is selected
    const hasArtboardSelected = selectedArtboardIds.length === 1
    const hasReferenceSelected = selectedReferenceIds.length === 1

    // Show nothing if nothing is selected or multiple items selected
    if (!hasArtboardSelected && !hasReferenceSelected) {
        return null
    }

    // === REFERENCE PROPERTIES ===
    if (hasReferenceSelected) {
        const selectedId = selectedReferenceIds[0]
        const reference = references.find(r => r.id === selectedId)

        if (!reference) return null

        const handleUpdate = (field: string, value: any) => {
            updateReference(selectedId, { [field]: value })
        }

        const handleSettingUpdate = (field: string, value: any) => {
            const currentSettings = reference.settings || {}
            updateReference(selectedId, {
                settings: { ...currentSettings, [field]: value }
            })
        }

        const displayUnit: DisplayUnit = reference.settings?.physicalUnit || 'cm'
        const displayWidth = fromPx(reference.width, displayUnit, DEFAULT_PPI)
        const displayHeight = fromPx(reference.height, displayUnit, DEFAULT_PPI)
        const opacity = reference.settings?.opacity ?? 0.4
        const showMeasurements = reference.settings?.showMeasurements ?? false

        return (
            <div
                className="w-64 bg-black/40 border border-emerald-500/20 rounded-lg flex flex-col pointer-events-auto shadow-2xl h-full overflow-hidden"
                style={{ backdropFilter: 'blur(20px) saturate(150%)', WebkitBackdropFilter: 'blur(20px) saturate(150%)' }}
                onPointerDown={(e) => e.stopPropagation()}
            >
                <CardHeader className="p-3 border-b border-emerald-500/20 flex flex-row items-center space-y-0">
                    <CardTitle className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                        <Box className="w-4 h-4 text-emerald-500" />
                        Reference
                    </CardTitle>
                </CardHeader>

                <CardContent className="p-4 space-y-6 overflow-y-auto">

                    {/* Name */}
                    <div className="space-y-2">
                        <Label className="text-xs text-white/50">Name</Label>
                        <Input
                            value={reference.name}
                            onChange={(e) => handleUpdate('name', e.target.value)}
                            className="bg-black/50 border-white/10 h-8 text-xs text-white"
                        />
                    </div>

                    {/* Reference Info */}
                    <div className="space-y-2">
                        <Label className="text-xs text-white/50">Reference Object</Label>
                        <div className="text-xs text-emerald-300 bg-emerald-500/10 px-2 py-1 rounded">
                            {reference.referenceId} - {reference.viewType.charAt(0).toUpperCase() + reference.viewType.slice(1)} View
                        </div>
                    </div>

                    {/* Dimensions (Read-only) */}
                    <div className="space-y-3">
                        <Label className="text-xs text-white/50 font-bold">Dimensions</Label>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                                <Label className="text-[10px] text-white/40">W ({displayUnit})</Label>
                                <div className="bg-black/30 border border-white/5 rounded h-7 flex items-center px-2 text-xs text-white/70">
                                    {displayWidth.toFixed(2)}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-[10px] text-white/40">H ({displayUnit})</Label>
                                <div className="bg-black/30 border border-white/5 rounded h-7 flex items-center px-2 text-xs text-white/70">
                                    {displayHeight.toFixed(2)}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Position */}
                    <div className="space-y-3">
                        <Label className="text-xs text-white/50 font-bold">Position</Label>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                                <Label className="text-[10px] text-white/40">X</Label>
                                <MathInput
                                    value={reference.x}
                                    decimals={0}
                                    onChange={(val) => handleUpdate('x', val)}
                                    className="bg-black/50 border-white/10 h-7 text-xs text-white px-2"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-[10px] text-white/40">Y</Label>
                                <MathInput
                                    value={reference.y}
                                    decimals={0}
                                    onChange={(val) => handleUpdate('y', val)}
                                    className="bg-black/50 border-white/10 h-7 text-xs text-white px-2"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="h-px bg-white/10" />

                    {/* Measurements Toggle */}
                    <div className="space-y-3">
                        <Label className="text-xs text-white/50 font-bold">Display</Label>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Ruler className="w-3 h-3 text-emerald-400" />
                                <Label className="text-xs text-white/70">Show Measurements</Label>
                            </div>
                            <Switch
                                checked={showMeasurements}
                                onCheckedChange={(checked) => handleSettingUpdate('showMeasurements', checked)}
                                className="scale-75"
                            />
                        </div>
                    </div>

                    {/* Opacity */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label className="text-xs text-white/70">Opacity</Label>
                            <span className="text-xs text-white/50">
                                {Math.round(opacity * 100)}%
                            </span>
                        </div>
                        <Slider
                            value={[opacity * 100]}
                            max={100}
                            min={10}
                            step={5}
                            onValueChange={(val: number[]) => handleSettingUpdate('opacity', val[0] / 100)}
                            className="py-2"
                        />
                    </div>

                </CardContent>
            </div>
        )
    }

    // === ARTBOARD PROPERTIES ===
    const selectedId = selectedArtboardIds[0]
    const artboard = artboards.find(a => a.id === selectedId)

    if (!artboard) return null

    const handleUpdate = (field: string, value: any) => {
        updateArtboard(selectedId, { [field]: value })
    }

    const handleSettingUpdate = (field: string, value: any) => {
        const currentSettings = artboard.settings || {}
        updateArtboard(selectedId, {
            settings: { ...currentSettings, [field]: value }
        })
    }

    const displayUnit: DisplayUnit = artboard.settings?.physicalUnit || 'mm'
    const artboardDpi = artboard.settings?.dpi || 300

    const displayWidth = fromPx(artboard.width, displayUnit, DEFAULT_PPI)
    const displayHeight = fromPx(artboard.height, displayUnit, DEFAULT_PPI)

    const handleDimensionChange = (field: 'width' | 'height', valueInUnit: number) => {
        const valuePx = toPx(valueInUnit, displayUnit, DEFAULT_PPI)

        if (isRatioLocked) {
            const ratio = artboard.width / artboard.height
            if (field === 'width') {
                const newHeight = valuePx / ratio
                updateArtboard(selectedId, { width: valuePx, height: newHeight })
            } else {
                const newWidth = valuePx * ratio
                updateArtboard(selectedId, { width: newWidth, height: valuePx })
            }
        } else {
            handleUpdate(field, valuePx)
        }
    }

    const handleScaleChange = (percentage: number) => {
        const factor = percentage / 100
        if (factor <= 0) return

        updateArtboard(selectedId, {
            width: artboard.width * factor,
            height: artboard.height * factor
        })
        setScaleFactor(100)
    }

    const handleUnitChange = (newUnit: DisplayUnit) => {
        handleSettingUpdate('physicalUnit', newUnit)
    }

    const toggleOrientation = () => {
        const { width, height } = artboard
        updateArtboard(selectedId, {
            width: height,
            height: width
        })
    }

    return (
        <div
            className="w-64 bg-black/40 border border-white/10 rounded-lg flex flex-col pointer-events-auto shadow-2xl h-full overflow-hidden"
            style={{ backdropFilter: 'blur(20px) saturate(150%)', WebkitBackdropFilter: 'blur(20px) saturate(150%)' }}
            onPointerDown={(e) => e.stopPropagation()}
        >
            <CardHeader className="p-3 border-b border-white/10 flex flex-row items-center space-y-0">
                <CardTitle className="text-xs font-semibold text-white/80 uppercase tracking-wider flex items-center gap-2">
                    <Type className="w-4 h-4 text-white/50" />
                    Properties
                </CardTitle>
            </CardHeader>

            <CardContent className="p-4 space-y-6 overflow-y-auto">

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
                            <MathInput
                                value={artboard.x}
                                decimals={0}
                                onChange={(val) => handleUpdate('x', val)}
                                className="bg-black/50 border-white/10 h-7 text-xs text-white px-2"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-[10px] text-white/40">Y</Label>
                            <MathInput
                                value={artboard.y}
                                decimals={0}
                                onChange={(val) => handleUpdate('y', val)}
                                className="bg-black/50 border-white/10 h-7 text-xs text-white px-2"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                            <Label className="text-[10px] text-white/40">W ({displayUnit})</Label>
                            <MathInput
                                value={displayWidth}
                                onChange={(val) => handleDimensionChange('width', val)}
                                className="bg-black/50 border-white/10 h-7 text-xs text-white px-2"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-[10px] text-white/40">H ({displayUnit})</Label>
                            <MathInput
                                value={displayHeight}
                                onChange={(val) => handleDimensionChange('height', val)}
                                className="bg-black/50 border-white/10 h-7 text-xs text-white px-2"
                            />
                        </div>
                    </div>

                    {/* Ratio & Orientation */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-white/40 hover:text-white"
                                onClick={() => setIsRatioLocked(!isRatioLocked)}
                                title={isRatioLocked ? "Unlock Aspect Ratio" : "Lock Aspect Ratio"}
                            >
                                {isRatioLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                            </Button>
                            <span className="text-[10px] text-white/40">
                                {formatAspectRatio(artboard.width, artboard.height)}
                            </span>
                        </div>
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

                    {/* Scale By Input (Only when locked) */}
                    {isRatioLocked && (
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
                            <div className="flex flex-col justify-center">
                                <Label className="text-[10px] text-white/40">Scale By (%)</Label>
                                <span className="text-[9px] text-white/20">Enter % to scale</span>
                            </div>
                            <MathInput
                                value={scaleFactor}
                                decimals={1}
                                onChange={handleScaleChange}
                                className="bg-black/50 border-white/10 h-7 text-xs text-white px-2"
                                placeholder="100%"
                            />
                        </div>
                    )}
                </div>

                <div className="h-px bg-white/10" />

                {/* DPI Settings */}
                <div className="space-y-3">
                    <Label className="text-xs text-white/50 font-bold">Print Settings</Label>
                    <div className="flex items-center justify-between">
                        <Label className="text-xs text-white/70">DPI</Label>
                        <div className="flex items-center gap-2">
                            <MathInput
                                value={artboardDpi}
                                decimals={0}
                                onChange={(val) => handleSettingUpdate('dpi', val)}
                                className="w-16 h-6 bg-black/50 border-white/10 text-[10px] text-white px-2"
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

'use client'

import { useState } from 'react'
import { useArtboardStore } from "@/lib/store/artboard-store"
import { useReferenceStore } from "@/lib/store/reference-store"
import { useBackgroundImageStore } from "@/lib/store/background-image-store"
import { useProjectStore } from "@/lib/store/project-store"
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { MathInput } from "@/components/ui/math-input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Smartphone, Monitor, Type, Lock, Unlock, Link, Box, Ruler, Image, Trash2, ArrowRightLeft, Maximize } from "lucide-react"
import { fromPx, toPx, DisplayUnit, DEFAULT_PPI, formatAspectRatio } from '@/lib/math/units'

export function PropertiesPanel() {
    const { artboards, selectedArtboardIds, update: updateArtboard } = useArtboardStore()
    const { references, selectedReferenceIds, update: updateReference } = useReferenceStore()
    const {
        backgroundImages,
        selectedBackgroundImageIds,
        create: createBackgroundImage,
        update: updateBackgroundImage,
        remove: removeBackgroundImage
    } = useBackgroundImageStore()
    const { currentProject } = useProjectStore()

    // ALL useState hooks MUST be at the top before any conditional returns
    const [isRatioLocked, setIsRatioLocked] = useState(false)
    const [scaleFactor, setScaleFactor] = useState(100)
    const [imageUrl, setImageUrl] = useState('')
    const [isAddingImage, setIsAddingImage] = useState(false)
    const [imageError, setImageError] = useState<string | null>(null)

    // Determine what is selected
    const hasArtboardSelected = selectedArtboardIds.length === 1
    const hasReferenceSelected = selectedReferenceIds.length === 1
    const hasBackgroundImageSelected = selectedBackgroundImageIds.length === 1

    // === BACKGROUND IMAGE PROPERTIES ===
    if (hasBackgroundImageSelected) {
        const selectedId = selectedBackgroundImageIds[0]
        const bgImage = backgroundImages.find(i => i.id === selectedId)

        if (!bgImage) return null

        const artboard = artboards.find(a => a.id === bgImage.artboard_id)
        const displayUnit: DisplayUnit = (bgImage.settings?.physicalUnit as DisplayUnit) || 'mm'
        const displayWidth = fromPx(bgImage.width, displayUnit, DEFAULT_PPI)
        const displayHeight = fromPx(bgImage.height, displayUnit, DEFAULT_PPI)
        const opacity = bgImage.settings?.opacity ?? 1
        const linkDimensions = bgImage.settings?.linkDimensions ?? true

        const handleUpdate = (field: string, value: any) => {
            updateBackgroundImage(selectedId, { [field]: value })
        }

        const handleSettingUpdate = (field: string, value: any) => {
            const currentSettings = bgImage.settings || {}
            updateBackgroundImage(selectedId, {
                settings: { ...currentSettings, [field]: value }
            })
        }

        const handleDimensionChange = (field: 'width' | 'height', valueInUnit: number) => {
            const valuePx = toPx(valueInUnit, displayUnit, DEFAULT_PPI)

            if (linkDimensions) {
                const ratio = bgImage.natural_width / bgImage.natural_height
                if (field === 'width') {
                    updateBackgroundImage(selectedId, { width: valuePx, height: valuePx / ratio })
                } else {
                    updateBackgroundImage(selectedId, { width: valuePx * ratio, height: valuePx })
                }
            } else {
                handleUpdate(field, valuePx)
            }
        }

        const fitImageToArtboard = () => {
            if (!artboard) return
            updateBackgroundImage(selectedId, {
                width: artboard.width,
                height: artboard.height,
                x: 0,
                y: 0
            })
        }

        const fitArtboardToImage = () => {
            if (!artboard) return
            updateArtboard(artboard.id, {
                width: bgImage.width,
                height: bgImage.height
            })
        }

        return (
            <div
                className="w-64 bg-black/40 border border-blue-500/20 rounded-lg flex flex-col pointer-events-auto shadow-2xl h-full overflow-hidden"
                style={{ backdropFilter: 'blur(20px) saturate(150%)', WebkitBackdropFilter: 'blur(20px) saturate(150%)' }}
                onPointerDown={(e) => e.stopPropagation()}
            >
                <CardHeader className="p-3 border-b border-blue-500/20 flex flex-row items-center space-y-0">
                    <CardTitle className="text-xs font-semibold text-blue-400 uppercase tracking-wider flex items-center gap-2">
                        <Image className="w-4 h-4 text-blue-500" />
                        Background Image
                    </CardTitle>
                </CardHeader>

                <CardContent className="p-4 space-y-6 overflow-y-auto">

                    {/* Image URL */}
                    <div className="space-y-2">
                        <Label className="text-xs text-white/50">Image URL</Label>
                        <div className="text-[10px] text-blue-300 bg-blue-500/10 px-2 py-1 rounded truncate" title={bgImage.image_url}>
                            {bgImage.image_url.substring(0, 40)}...
                        </div>
                    </div>

                    {/* Original Dimensions */}
                    <div className="space-y-2">
                        <Label className="text-xs text-white/50">Original Size</Label>
                        <div className="text-xs text-white/40">
                            {bgImage.natural_width} × {bgImage.natural_height} px
                        </div>
                    </div>

                    {/* Fit Mode */}
                    <div className="space-y-3">
                        <Label className="text-xs text-white/50 font-bold">Fit</Label>
                        <Select
                            value={bgImage.settings?.fit || 'custom'}
                            onValueChange={(val) => handleSettingUpdate('fit', val)}
                        >
                            <SelectTrigger className="w-full h-7 bg-black/50 border-white/10 text-xs text-white">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="custom">Custom</SelectItem>
                                <SelectItem value="cover">Cover (Fill)</SelectItem>
                                <SelectItem value="contain">Contain (Fit)</SelectItem>
                                <SelectItem value="stretch">Stretch (Fill Artboard)</SelectItem>
                                <SelectItem value="original">Original Size</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Options */}
                    <div className="space-y-3">
                        <Label className="text-xs text-white/50 font-bold">Options</Label>

                        <div className="flex items-center justify-between">
                            <Label className="text-xs text-white/70">Clip to Artboard</Label>
                            <Switch
                                checked={bgImage.settings?.clip ?? true}
                                onCheckedChange={(val) => handleSettingUpdate('clip', val)}
                                className="scale-75"
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <Label className="text-xs text-white/70">Tile Image</Label>
                            <Switch
                                checked={bgImage.settings?.repeat ?? false}
                                onCheckedChange={(val) => handleSettingUpdate('repeat', val)}
                                className="scale-75"
                            />
                        </div>
                    </div>

                    <div className="h-px bg-white/10" />

                    {/* Dimensions & Position - Only show if fit is Custom */}
                    {(bgImage.settings?.fit || 'custom') === 'custom' && (
                        <>
                            {/* Dimensions */}
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <Label className="text-xs text-white/50 font-bold">Dimensions</Label>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-5 w-5 text-white/40 hover:text-white"
                                        onClick={() => handleSettingUpdate('linkDimensions', !linkDimensions)}
                                        title={linkDimensions ? "Unlink Dimensions" : "Link Dimensions"}
                                    >
                                        {linkDimensions ? <Link className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                                    </Button>
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
                            </div>

                            {/* Position */}
                            <div className="space-y-3">
                                <Label className="text-xs text-white/50 font-bold">Position (offset)</Label>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                        <Label className="text-[10px] text-white/40">X</Label>
                                        <MathInput
                                            value={bgImage.x}
                                            decimals={0}
                                            onChange={(val) => handleUpdate('x', val)}
                                            className="bg-black/50 border-white/10 h-7 text-xs text-white px-2"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[10px] text-white/40">Y</Label>
                                        <MathInput
                                            value={bgImage.y}
                                            decimals={0}
                                            onChange={(val) => handleUpdate('y', val)}
                                            className="bg-black/50 border-white/10 h-7 text-xs text-white px-2"
                                        />
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    <div className="h-px bg-white/10" />

                    {/* Quick Resize Actions */}
                    <div className="space-y-3">
                        <Label className="text-xs text-white/50 font-bold">Quick Actions</Label>
                        <div className="grid grid-cols-2 gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-[10px] bg-blue-500/10 border-blue-500/20 text-blue-300 hover:bg-blue-500/20"
                                onClick={fitImageToArtboard}
                            >
                                <Maximize className="w-3 h-3 mr-1" />
                                Fit to Artboard
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-[10px] bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                                onClick={fitArtboardToImage}
                            >
                                <ArrowRightLeft className="w-3 h-3 mr-1" />
                                Fit Artboard
                            </Button>
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

                    {/* Delete */}
                    <Button
                        variant="outline"
                        size="sm"
                        className="w-full h-7 text-xs bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20"
                        onClick={() => removeBackgroundImage(selectedId)}
                    >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Remove Background Image
                    </Button>

                </CardContent>
            </div>
        )
    }

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

    // Get background images for this artboard
    const artboardBackgroundImages = backgroundImages.filter(i => i.artboard_id === selectedId)

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

    const handleAddBackgroundImage = async () => {
        if (!imageUrl || !currentProject) return

        setIsAddingImage(true)
        setImageError(null)

        try {
            // Load image to get natural dimensions
            // Note: We don't set crossOrigin because many image servers block CORS
            // The texture loader in Three.js will handle this separately
            const img = new window.Image()

            // Try loading - some URLs will fail but we can still store the URL
            // The actual texture loading in Three.js may succeed where this fails
            await new Promise<void>((resolve, reject) => {
                img.onload = () => resolve()
                img.onerror = () => reject(new Error('Could not load image preview'))
                img.src = imageUrl
                // Timeout after 5 seconds
                setTimeout(() => reject(new Error('Image load timeout')), 5000)
            })

            // Create background image matching artboard size
            await createBackgroundImage(currentProject.id, selectedId, {
                imageUrl: imageUrl,
                naturalWidth: img.naturalWidth || artboard.width,
                naturalHeight: img.naturalHeight || artboard.height,
                width: artboard.width,
                height: artboard.height
            })

            setImageUrl('')
        } catch (error) {
            // If preview load fails, still try to add - Three.js texture loader might succeed
            console.warn('Preview load failed, attempting to add anyway:', error)
            try {
                // Use artboard dimensions as fallback
                await createBackgroundImage(currentProject.id, selectedId, {
                    imageUrl: imageUrl,
                    naturalWidth: artboard.width,
                    naturalHeight: artboard.height,
                    width: artboard.width,
                    height: artboard.height
                })
                setImageUrl('')
            } catch (innerError) {
                setImageError('Failed to add image. Check the URL.')
                console.error('Failed to add image:', innerError)
            }
        } finally {
            setIsAddingImage(false)
        }
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

                <div className="h-px bg-white/10" />

                {/* Background Image Section */}
                <div className="space-y-3">
                    <Label className="text-xs text-white/50 font-bold flex items-center gap-2">
                        <Image className="w-3 h-3" />
                        Background Image
                    </Label>

                    {artboardBackgroundImages.length > 0 ? (
                        <div className="space-y-2">
                            {artboardBackgroundImages.map(bgImg => (
                                <div key={bgImg.id} className="flex items-center gap-2 bg-blue-500/10 p-2 rounded text-xs">
                                    <Image className="w-4 h-4 text-blue-400" />
                                    <span className="flex-1 truncate text-blue-300">Image</span>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-5 w-5 text-red-400 hover:text-red-300"
                                        onClick={() => removeBackgroundImage(bgImg.id)}
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <Input
                                placeholder="Paste image URL..."
                                value={imageUrl}
                                onChange={(e) => { setImageUrl(e.target.value); setImageError(null); }}
                                className="bg-black/50 border-white/10 h-7 text-xs text-white"
                            />
                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full h-7 text-xs bg-blue-500/10 border-blue-500/20 text-blue-300 hover:bg-blue-500/20"
                                onClick={handleAddBackgroundImage}
                                disabled={!imageUrl || isAddingImage}
                            >
                                <Image className="w-3 h-3 mr-1" />
                                {isAddingImage ? 'Adding...' : 'Add Background Image'}
                            </Button>
                            {imageError && (
                                <p className="text-[10px] text-red-400">{imageError}</p>
                            )}
                        </div>
                    )}
                </div>

            </CardContent>
        </div>
    )
}

'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useArtboardStore, Artboard } from '@/lib/store/artboard-store'
import { useReferenceStore, ReferenceLayer } from '@/lib/store/reference-store'
import { useBackgroundImageStore } from '@/lib/store/background-image-store'
import { useLayerOrderStore } from '@/lib/store/layer-order-store'
import { BackgroundImage } from '@/lib/db'
import { Layers, GripVertical, Eye, Trash2, Locate, Square, Box, Image, ChevronRight, ChevronDown } from 'lucide-react'
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core'
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { cn } from '@/lib/utils'

// Unified layer item type
type LayerItem = {
    id: string
    name: string
    type: 'artboard' | 'reference'
    sort_order: number
    data: Artboard | ReferenceLayer
}

interface SortableLayerProps {
    layer: LayerItem
    isSelected: boolean
    onSelect: (id: string, type: 'artboard' | 'reference') => void
    onDelete: (id: string, type: 'artboard' | 'reference') => void
    onZoomTo: (id: string, type: 'artboard' | 'reference') => void
    onUpdateName: (id: string, name: string, type: 'artboard' | 'reference') => void
    backgroundImages?: BackgroundImage[]
    selectedBackgroundImageIds?: string[]
    onSelectBackgroundImage?: (id: string) => void
    onDeleteBackgroundImage?: (id: string) => void
}

// Nested background image item component
function BackgroundImageItem({
    image,
    isSelected,
    onSelect,
    onDelete
}: {
    image: BackgroundImage
    isSelected: boolean
    onSelect: (id: string) => void
    onDelete: (id: string) => void
}) {
    return (
        <div
            className={cn(
                "group flex items-center gap-2 px-2 py-1.5 text-[11px] rounded mb-0.5 cursor-pointer transition-colors ml-6 border border-transparent",
                isSelected
                    ? "bg-blue-500/20 border-blue-500/30 text-white"
                    : "text-white/50 hover:bg-white/5"
            )}
            onClick={(e) => {
                e.stopPropagation()
                onSelect(image.id)
            }}
        >
            <Image className="w-3 h-3 text-blue-400 flex-shrink-0" />
            <span className="flex-1 truncate text-blue-300">
                Background Image
            </span>
            <div className={cn("flex items-center gap-1 opacity-0 group-hover:opacity-100", isSelected && "opacity-100")}>
                <button
                    onClick={(e) => { e.stopPropagation(); onDelete(image.id); }}
                    className="p-0.5 hover:bg-red-500/20 hover:text-red-400 rounded"
                >
                    <Trash2 className="w-2.5 h-2.5" />
                </button>
            </div>
        </div>
    )
}

function SortableLayer({
    layer,
    isSelected,
    onSelect,
    onDelete,
    onZoomTo,
    onUpdateName,
    backgroundImages = [],
    selectedBackgroundImageIds = [],
    onSelectBackgroundImage,
    onDeleteBackgroundImage
}: SortableLayerProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: layer.id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 1
    }

    // Renaming State
    const [isEditing, setIsEditing] = useState(false)
    const [editName, setEditName] = useState(layer.name)
    const [isExpanded, setIsExpanded] = useState(true)
    const inputRef = useRef<HTMLInputElement>(null)

    const hasBackgroundImages = layer.type === 'artboard' && backgroundImages.length > 0

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus()
            inputRef.current.select()
        }
    }, [isEditing])

    // Sync editName when layer.name changes
    useEffect(() => {
        setEditName(layer.name)
    }, [layer.name])

    const handleNameSubmit = () => {
        setIsEditing(false)
        if (editName.trim() && editName !== layer.name) {
            onUpdateName(layer.id, editName, layer.type)
        } else {
            setEditName(layer.name)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleNameSubmit()
        if (e.key === 'Escape') {
            setIsEditing(false)
            setEditName(layer.name)
        }
    }

    const isReference = layer.type === 'reference'

    return (
        <div ref={setNodeRef} style={style}>
            <div
                className={cn(
                    "group flex items-center gap-2 px-2 py-2 text-xs rounded-md mb-1 cursor-pointer transition-colors border border-transparent",
                    isSelected
                        ? isReference
                            ? "bg-emerald-500/20 border-emerald-500/30 text-white"
                            : "bg-white/10 border-white/10 text-white"
                        : "text-white/60 hover:bg-white/5",
                    isDragging ? "opacity-50" : ""
                )}
                onClick={(e) => {
                    e.stopPropagation()
                    onSelect(layer.id, layer.type)
                }}
                onDoubleClick={(e) => {
                    e.stopPropagation()
                    setIsEditing(true)
                }}
            >
                {/* Drag Handle - Always visible */}
                <div {...attributes} {...listeners} className="cursor-grab hover:text-white/80 p-0.5">
                    <GripVertical className="w-3 h-3 text-white/20" />
                </div>

                {/* Expand/Collapse for artboards with background images */}
                {hasBackgroundImages && (
                    <button
                        onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
                        className="p-0.5 hover:bg-white/10 rounded mr-1"
                    >
                        {isExpanded ? (
                            <ChevronDown className="w-3 h-3 text-white/40" />
                        ) : (
                            <ChevronRight className="w-3 h-3 text-white/40" />
                        )}
                    </button>
                )}

                {/* Type Icon */}
                {isReference ? (
                    <Box className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                ) : (
                    <Square className="w-3 h-3 text-white/40 flex-shrink-0" />
                )}

                {/* Name or Input */}
                {isEditing ? (
                    <input
                        ref={inputRef}
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onBlur={handleNameSubmit}
                        onKeyDown={handleKeyDown}
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 bg-black/50 border border-white/20 rounded px-1 outline-none text-white h-5 min-w-0"
                    />
                ) : (
                    <span className={cn("flex-1 truncate select-none", isReference && "text-emerald-300")}>
                        {layer.name}
                    </span>
                )}

                {/* Background image count badge */}
                {hasBackgroundImages && (
                    <span className="text-[9px] bg-blue-500/30 text-blue-300 px-1.5 rounded">
                        {backgroundImages.length}
                    </span>
                )}

                {/* Actions */}
                <div className={cn("flex items-center gap-1 opacity-0 group-hover:opacity-100", isSelected && !isEditing && "opacity-100")}>
                    <button
                        onClick={(e) => { e.stopPropagation(); onZoomTo(layer.id, layer.type); }}
                        className="p-1 hover:bg-white/20 rounded text-white/50 hover:text-white"
                        title="Fit to View"
                    >
                        <Locate className="w-3 h-3" />
                    </button>

                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete(layer.id, layer.type); }}
                        className="p-1 hover:bg-red-500/20 hover:text-red-400 rounded"
                    >
                        <Trash2 className="w-3 h-3" />
                    </button>
                </div>
            </div>

            {/* Nested Background Images */}
            {hasBackgroundImages && isExpanded && (
                <div className="ml-2 border-l border-white/10 pl-1">
                    {backgroundImages.map(bgImage => (
                        <BackgroundImageItem
                            key={bgImage.id}
                            image={bgImage}
                            isSelected={selectedBackgroundImageIds.includes(bgImage.id)}
                            onSelect={onSelectBackgroundImage || (() => { })}
                            onDelete={onDeleteBackgroundImage || (() => { })}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

export function LayerPanel() {
    const {
        artboards,
        selectedArtboardIds,
        selectArtboard,
        setFocus: setArtboardFocus,
        setZoomTo: setArtboardZoomTo,
        update: updateArtboard,
        remove: removeArtboard,
        reorderArtboards
    } = useArtboardStore()

    const {
        references,
        selectedReferenceIds,
        selectReference,
        setFocus: setReferenceFocus,
        setZoomTo: setReferenceZoomTo,
        update: updateReference,
        remove: removeReference,
        reorderReferences
    } = useReferenceStore()

    const {
        backgroundImages,
        selectedBackgroundImageIds,
        selectBackgroundImage,
        remove: removeBackgroundImage
    } = useBackgroundImageStore()

    const { layerOrder, reorderLayers } = useLayerOrderStore()

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    // Get background images for a specific artboard
    const getBackgroundImagesForArtboard = (artboardId: string) => {
        return backgroundImages.filter(img => img.artboard_id === artboardId)
    }

    // Combine artboards and references into a unified sorted list using layer_order
    const allLayers = useMemo<LayerItem[]>(() => {
        // Create lookup maps for artboards and references
        const artboardMap = new Map(artboards.map(a => [a.id, a]))
        const referenceMap = new Map(references.map(r => [r.id, r]))

        // Build layers from layer_order (unified ordering)
        const orderedLayers: LayerItem[] = []

        // Sort layer_order by sort_order descending
        const sortedOrder = [...layerOrder].sort((a, b) => (b.sort_order || 0) - (a.sort_order || 0))

        for (const orderEntry of sortedOrder) {
            if (orderEntry.layer_type === 'artboard') {
                const artboard = artboardMap.get(orderEntry.layer_id)
                if (artboard) {
                    orderedLayers.push({
                        id: artboard.id,
                        name: artboard.name,
                        type: 'artboard',
                        sort_order: orderEntry.sort_order,
                        data: artboard
                    })
                    artboardMap.delete(orderEntry.layer_id) // Mark as processed
                }
            } else if (orderEntry.layer_type === 'reference') {
                const reference = referenceMap.get(orderEntry.layer_id)
                if (reference) {
                    orderedLayers.push({
                        id: reference.id,
                        name: reference.name,
                        type: 'reference',
                        sort_order: orderEntry.sort_order,
                        data: reference
                    })
                    referenceMap.delete(orderEntry.layer_id) // Mark as processed
                }
            }
        }

        // Add any layers not in layer_order (legacy data) at the end
        for (const artboard of artboardMap.values()) {
            orderedLayers.push({
                id: artboard.id,
                name: artboard.name,
                type: 'artboard',
                sort_order: artboard.sort_order || 0,
                data: artboard
            })
        }
        for (const reference of referenceMap.values()) {
            orderedLayers.push({
                id: reference.id,
                name: reference.name,
                type: 'reference',
                sort_order: reference.sort_order || 0,
                data: reference
            })
        }

        return orderedLayers
    }, [artboards, references, layerOrder])

    const totalCount = artboards.length + references.length

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event

        if (over && active.id !== over.id) {
            // Use unified layer_order for cross-type reordering
            const activeLayer = allLayers.find(l => l.id === active.id)
            const overLayer = allLayers.find(l => l.id === over.id)

            if (activeLayer && overLayer) {
                // Get project_id from the layer data
                const projectId = (activeLayer.data as any).project_id
                if (projectId) {
                    reorderLayers(projectId, active.id as string, over.id as string)
                }
            }
        }
    }

    const handleSelect = (id: string, type: 'artboard' | 'reference') => {
        // Deselect background images when selecting a layer
        selectBackgroundImage(null)

        if (type === 'artboard') {
            selectReference(null) // Deselect references
            selectArtboard(id, false)
            setArtboardFocus(id)
        } else {
            selectArtboard(null) // Deselect artboards
            selectReference(id, false)
            setReferenceFocus(id)
        }
    }

    const handleSelectBackgroundImage = (id: string) => {
        // Deselect artboards and references when selecting background image
        selectArtboard(null)
        selectReference(null)
        selectBackgroundImage(id)
    }

    const handleZoomTo = (id: string, type: 'artboard' | 'reference') => {
        if (type === 'artboard') {
            selectReference(null)
            selectArtboard(id, false)
            setArtboardZoomTo(id)
        } else {
            selectArtboard(null)
            selectReference(id, false)
            setReferenceZoomTo(id)
        }
    }

    const handleUpdateName = (id: string, name: string, type: 'artboard' | 'reference') => {
        if (type === 'artboard') {
            updateArtboard(id, { name })
        } else {
            updateReference(id, { name })
        }
    }

    const handleDelete = (id: string, type: 'artboard' | 'reference') => {
        if (type === 'artboard') {
            removeArtboard(id)
        } else {
            removeReference(id)
        }
    }

    const handleBackgroundClick = () => {
        selectArtboard(null)
        selectReference(null)
        selectBackgroundImage(null)
    }

    return (
        <div
            className="absolute left-4 top-20 bottom-20 w-64 bg-black/40 border border-white/10 rounded-lg flex flex-col pointer-events-auto shadow-2xl"
            style={{ backdropFilter: 'blur(20px) saturate(150%)', WebkitBackdropFilter: 'blur(20px) saturate(150%)' }}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={handleBackgroundClick}
        >
            <div className="p-3 border-b border-white/10 flex items-center gap-2 text-xs font-semibold text-white/80">
                <Layers className="w-4 h-4" />
                <span>Layers</span>
                <span className="ml-auto text-[10px] text-white/30">{totalCount}</span>
            </div>

            <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={allLayers.map(l => l.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        {allLayers.map((layer) => (
                            <SortableLayer
                                key={layer.id}
                                layer={layer}
                                isSelected={
                                    layer.type === 'artboard'
                                        ? selectedArtboardIds.includes(layer.id)
                                        : selectedReferenceIds.includes(layer.id)
                                }
                                onSelect={handleSelect}
                                onZoomTo={handleZoomTo}
                                onDelete={handleDelete}
                                onUpdateName={handleUpdateName}
                                backgroundImages={layer.type === 'artboard' ? getBackgroundImagesForArtboard(layer.id) : []}
                                selectedBackgroundImageIds={selectedBackgroundImageIds}
                                onSelectBackgroundImage={handleSelectBackgroundImage}
                                onDeleteBackgroundImage={removeBackgroundImage}
                            />
                        ))}
                    </SortableContext>
                </DndContext>

                {totalCount === 0 && (
                    <div className="text-center py-10 text-white/20 text-xs italic">
                        No layers
                    </div>
                )}
            </div>
        </div>
    )
}

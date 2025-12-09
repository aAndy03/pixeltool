'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useArtboardStore } from '@/lib/store/artboard-store'
import { Layers, GripVertical, Eye, Trash2, Locate } from 'lucide-react'
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

function SortableLayer({ artboard, isSelected, onSelect, onDelete, onZoomTo, onUpdateName }: any) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: artboard.id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 1
    }

    // Renaming State
    const [isEditing, setIsEditing] = useState(false)
    const [editName, setEditName] = useState(artboard.name)
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus()
            inputRef.current.select()
        }
    }, [isEditing])

    const handleNameSubmit = () => {
        setIsEditing(false)
        if (editName.trim() && editName !== artboard.name) {
            onUpdateName(artboard.id, editName)
        } else {
            setEditName(artboard.name) // Revert if empty
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleNameSubmit()
        if (e.key === 'Escape') {
            setIsEditing(false)
            setEditName(artboard.name)
        }
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "group flex items-center gap-2 px-2 py-2 text-xs rounded-md mb-1 cursor-pointer transition-colors border border-transparent",
                isSelected ? "bg-white/10 border-white/10 text-white" : "text-white/60 hover:bg-white/5",
                isDragging ? "opacity-50" : ""
            )}
            onClick={(e) => {
                e.stopPropagation(); // Stop propagation to panel background
                onSelect(artboard.id);
            }}
            onDoubleClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
            }}
        >
            {/* Drag Handle */}
            <div {...attributes} {...listeners} className="cursor-grab hover:text-white/80 p-0.5">
                <GripVertical className="w-3 h-3 text-white/20" />
            </div>

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
                <span className="flex-1 truncate select-none">{artboard.name}</span>
            )}

            {/* Actions */}
            <div className={cn("flex items-center gap-1 opacity-0 group-hover:opacity-100", isSelected && !isEditing && "opacity-100")}>
                <button
                    onClick={(e) => { e.stopPropagation(); onZoomTo(artboard.id); }}
                    className="p-1 hover:bg-white/20 rounded text-white/50 hover:text-white"
                    title="Fit to View"
                >
                    <Locate className="w-3 h-3" />
                </button>

                <button
                    onClick={(e) => { e.stopPropagation(); onDelete(artboard.id); }}
                    className="p-1 hover:bg-red-500/20 hover:text-red-400 rounded"
                >
                    <Trash2 className="w-3 h-3" />
                </button>
            </div>
        </div>
    )
}

export function LayerPanel() {
    const {
        artboards,
        selectedArtboardIds,
        selectArtboard,
        setFocus,
        setZoomTo,
        update,
        remove,
        reorderArtboards
    } = useArtboardStore()

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event

        if (over && active.id !== over.id) {
            reorderArtboards(active.id as string, over.id as string)
        }
    }

    // Select and Soft Focus
    const handleSelect = (id: string) => {
        selectArtboard(id, false)
        setFocus(id) // Triggers smart focus which checks visibility
    }

    // Zoom To
    const handleZoomTo = (id: string) => {
        // Also select it
        selectArtboard(id, false)
        setZoomTo(id)
    }

    // Update Name
    const handleUpdateName = (id: string, name: string) => {
        update(id, { name })
    }

    return (
        <div
            className="absolute left-4 top-20 bottom-20 w-64 bg-black/80 backdrop-blur-md border border-white/10 rounded-lg flex flex-col pointer-events-auto shadow-2xl"
            onPointerDown={(e) => e.stopPropagation()} // Prevent scene interactions through panel
            // Click on background -> Deselect
            onClick={() => selectArtboard(null)}
        >
            <div className="p-3 border-b border-white/10 flex items-center gap-2 text-xs font-semibold text-white/80">
                <Layers className="w-4 h-4" />
                <span>Layers</span>
                <span className="ml-auto text-[10px] text-white/30">{artboards.length}</span>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={artboards.map(a => a.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        {artboards.map((artboard) => (
                            <SortableLayer
                                key={artboard.id}
                                artboard={artboard}
                                isSelected={selectedArtboardIds.includes(artboard.id)}
                                onSelect={handleSelect}
                                onZoomTo={handleZoomTo}
                                onDelete={remove}
                                onUpdateName={handleUpdateName}
                            />
                        ))}
                    </SortableContext>
                </DndContext>

                {artboards.length === 0 && (
                    <div className="text-center py-10 text-white/20 text-xs italic">
                        No artboards
                    </div>
                )}
            </div>
        </div>
    )
}

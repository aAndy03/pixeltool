'use client'

import React, { useRef, useMemo } from 'react'
import * as THREE from 'three'
import { Text, Line } from '@react-three/drei'
import { Artboard, useArtboardStore } from '@/lib/store/artboard-store'
import { useUIStore } from '@/lib/store/ui-store'
import { fromPx, DisplayUnit, DEFAULT_PPI } from '@/lib/math/units'
import { useThree } from '@react-three/fiber'
import { useGesture } from '@use-gesture/react'

interface ArtboardProps {
    data: Artboard
}

export function ArtboardComponent({ data }: ArtboardProps) {
    const { width, height, x, y, name, id, sort_order, settings } = data
    // Default values if not set
    const bgColor = settings?.backgroundColor || '#ffffff'
    const opacity = settings?.opacity ?? 1.0
    const displayUnit: DisplayUnit = settings?.physicalUnit || 'mm'

    // Format dimension for display using artboard's stored unit
    const formatDimension = (valuePx: number) => {
        const val = fromPx(valuePx, displayUnit, DEFAULT_PPI)
        // Show fewer decimals for larger units
        const decimals = displayUnit === 'm' ? 2 : displayUnit === 'cm' ? 1 : displayUnit === 'px' ? 0 : 2
        return `${val.toFixed(decimals)} ${displayUnit}`
    }

    const { selectedArtboardIds, selectArtboard, update } = useArtboardStore()
    const isSelected = selectedArtboardIds.includes(id)

    const { camera, size, viewport } = useThree()

    // Z-index logic: Tiny offset to prevent z-fighting but maintain order
    // sort_order 0 is bottom.
    const zOffset = (sort_order || 0) * 0.1

    const bind = useGesture({
        onDrag: ({ delta: [dx, dy], event, memo = [x, y] }) => {
            event.stopPropagation()

            // Calculate scale based on camera zoom/position
            // Simple approximation for Planar view (Perspective Camera locked to XY)
            // Visible Height at current target distance?
            // Actually, we can use the delta projected?
            // Or simpler: PerspectiveCamera factor.

            // For now, let's look at the delta returned by useGesture on a canvas object.
            // It relies on raycasting if we bind to the object? 
            // "If you attach the gesture to a component..."
            // "drag state contains ... delta property"
            // With r3f, the delta is in 3D units if we use the right configuration?
            // Default useGesture on DOM returns screen pixels.

            // Let's manually project screen delta to world delta.
            const distance = camera.position.z // Assuming looking at Z=0
            const vFov = (camera as THREE.PerspectiveCamera).fov * Math.PI / 180
            const planeHeightAtDist = 2 * Math.tan(vFov / 2) * distance
            const scaleFactor = planeHeightAtDist / size.height

            // Invert Y because screen Y is down, World Y is up
            const changeX = dx * scaleFactor
            const changeY = -dy * scaleFactor

            // Update Store (Optimistic)
            // We throttle or just update? Zustand is fast.
            // For smoother frame rate, better to use temp state and update store on DragEnd,
            // but for "Tool" we want to see property panel update maybe?
            // User requirement: "move the artboards ... and keep their position"

            // To avoid store spam, we might want to use a ref for the visual object and update store on 'onDragEnd'.
            // BUT, if we have a properties panel, it won't sync.
            // Let's try direct update first. If slow, optimize.

            // Snapping Logic
            const { isSnapEnabled, activeGridSpacing } = useUIStore.getState()

            // Check modifier (Alt key disables snap temporarily)
            // Note: event is the original event. React-use-gesture passes it.
            const isAltPressed = event.altKey

            let finalX = x + changeX
            let finalY = y + changeY

            if (isSnapEnabled && !isAltPressed) {
                // PPI=96 default implies Artboards are in px but concept is 96px = 1in = 0.0254m
                // We need to convert Grid Spacing (m) to Px
                const snapPx = (activeGridSpacing / 0.0254) * 96

                finalX = Math.round(finalX / snapPx) * snapPx
                finalY = Math.round(finalY / snapPx) * snapPx
            }

            update(id, {
                x: finalX,
                y: finalY
            })

            return memo
        },
        onClick: ({ event }) => {
            event.stopPropagation()
            // Toggle selection if Ctrl/Shift? User request said "Select tool... simple click".
            // Typically Click = Select Only This (Deselect others). Shift+Click = Add.
            const isMulti = event.shiftKey || event.ctrlKey
            selectArtboard(id, isMulti)
        }
    })

    const borderGeometry = useMemo(() => new THREE.PlaneGeometry(width, height), [width, height])

    return (
        <group
            position={[x, y, zOffset]}
            {...bind()}
            // Hover cursor
            onPointerOver={() => document.body.style.cursor = 'move'}
            onPointerOut={() => document.body.style.cursor = 'auto'}
        >
            {/* Main Artboard Plane */}
            <mesh>
                <planeGeometry args={[width, height]} />
                <meshStandardMaterial
                    color={bgColor}
                    roughness={0.5}
                    transparent={true}
                    opacity={opacity}
                    polygonOffset
                    polygonOffsetFactor={-1 * (sort_order || 0)} // Help visual sorting if needed
                />
            </mesh>

            {/* Selection Outline - Blue if selected */}
            {isSelected && (
                <lineSegments position={[0, 0, 0.5]}>
                    <edgesGeometry args={[borderGeometry]} />
                    <lineBasicMaterial color="#0066ff" linewidth={4} />
                    {/* Note: linewidth only works in some renderers/browsers, often 1. 
                        For thick lines, use Meshline or just a slightly larger plane behind? 
                        Or just a distinct color. Blue is standard. 
                    */}
                </lineSegments>
            )}

            {/* Standard Border / Outline (Gray) */}
            {!isSelected && (
                <lineSegments position={[0, 0, 0.1]}>
                    <edgesGeometry args={[borderGeometry]} />
                    <lineBasicMaterial color="#cccccc" />
                </lineSegments>
            )}

            {/* Label (Name) - slightly above top-left */}
            <Text
                position={[-width / 2, height / 2 + 10, 0]}
                anchorX="left"
                fontSize={12}
                color={isSelected ? "#0066ff" : "white"}
            >
                {name}
            </Text>

            {/* Dimensions Labels - Show only if selected or hovered? Or always? Always for now. */}
            <Text
                position={[0, height / 2 + 5, 0]}
                fontSize={10}
                color={isSelected ? "#0066ff" : "#888888"}
            >
                {formatDimension(width)}
            </Text>
            <Text
                position={[-width / 2 - 5, 0, 0]}
                rotation={[0, 0, Math.PI / 2]}
                fontSize={10}
                color={isSelected ? "#0066ff" : "#888888"}
            >
                {formatDimension(height)}
            </Text>
        </group>
    )
}

'use client'

import React, { useRef, useMemo, useState } from 'react'
import * as THREE from 'three'
import { Text } from '@react-three/drei'
import { Artboard, useArtboardStore } from '@/lib/store/artboard-store'
import { useBackgroundImageStore } from '@/lib/store/background-image-store'
import { useUIStore } from '@/lib/store/ui-store'
import { fromPx, DisplayUnit, DEFAULT_PPI } from '@/lib/math/units'
import { useThree, useFrame } from '@react-three/fiber'
import { useGesture } from '@use-gesture/react'
import { SnapEngine } from '@/lib/math/snap-engine'

interface ArtboardProps {
    data: Artboard
}

const ArtboardComponentBase = ({ data }: ArtboardProps) => {
    const { width, height, x, y, name, id, sort_order, settings } = data
    // Default values if not set
    const bgColor = settings?.backgroundColor || '#ffffff'
    const opacity = settings?.opacity ?? 1.0
    const displayUnit: DisplayUnit = settings?.physicalUnit || 'mm'

    // Track camera Z for font scaling
    const [cameraZ, setCameraZ] = useState(1000)
    const { isCameraAnimating } = useUIStore()

    // Check if this artboard has a background image
    const { backgroundImages } = useBackgroundImageStore()
    const hasBackgroundImage = backgroundImages.some(img => img.artboard_id === id)

    const { camera, size } = useThree()

    // Update camera Z periodically (skip during animation for performance)
    useFrame(() => {
        if (isCameraAnimating) return // Skip during animation
        const z = camera.position.z
        if (Math.abs(z - cameraZ) > 10) {
            setCameraZ(z)
        }
    })

    // Format dimension for display using artboard's stored unit
    const formatDimension = (valuePx: number) => {
        const val = fromPx(valuePx, displayUnit, DEFAULT_PPI)
        // Show fewer decimals for larger units
        const decimals = displayUnit === 'm' ? 2 : displayUnit === 'cm' ? 1 : displayUnit === 'px' ? 0 : 2
        return `${val.toFixed(decimals)} ${displayUnit}`
    }

    // Calculate font sizes and positions based on camera Z and artboard constraints
    const textLayout = useMemo(() => {
        const perspCam = camera as THREE.PerspectiveCamera
        const vFov = perspCam.fov * Math.PI / 180
        const visibleHeight = 2 * Math.tan(vFov / 2) * cameraZ
        const screenHeight = typeof window !== 'undefined' ? window.innerHeight : 800
        const worldUnitsPerPixel = visibleHeight / screenHeight

        // Target screen sizes in pixels
        const targetFontScreenSize = 12

        // Padding between elements
        const paddingFactor = 0.3 // 30% of font size as padding

        // Calculate ideal font size based on camera distance
        let fontSize = targetFontScreenSize * worldUnitsPerPixel

        // Estimate text widths (approximate: 0.6 * fontSize per character)
        const charWidth = 0.6
        const nameLength = name.length
        const dimText = formatDimension(width)
        const dimLength = dimText.length

        // Total width needed: name + padding + dimension label
        const padding = fontSize * paddingFactor
        const estimatedNameWidth = nameLength * fontSize * charWidth
        const estimatedDimWidth = dimLength * fontSize * charWidth
        const totalNeeded = estimatedNameWidth + padding + estimatedDimWidth

        // Available width on top edge
        const availableWidth = width

        // Scale down if exceeds available width
        if (totalNeeded > availableWidth) {
            const scale = availableWidth / totalNeeded
            fontSize = fontSize * scale * 0.9 // 10% margin
        }

        // Minimum readable size
        const minFontSize = 3 * worldUnitsPerPixel
        fontSize = Math.max(fontSize, minFontSize)

        // Maximum size constraint
        const maxFontSize = Math.min(width, height) * 0.15
        fontSize = Math.min(fontSize, maxFontSize)

        // Recalculate positions with final font size
        const finalPadding = fontSize * paddingFactor
        const offset = fontSize * 0.8 // Vertical offset above artboard

        return {
            fontSize,
            padding: finalPadding,
            offset,
            // Position width label at right edge of artboard
            widthLabelX: width / 2,
            // Name position stays at left
            nameX: -width / 2
        }
    }, [cameraZ, camera, width, height, name])

    const { selectedArtboardIds, selectArtboard, update } = useArtboardStore()
    const isSelected = selectedArtboardIds.includes(id)

    // Z-index logic: Tiny offset to prevent z-fighting but maintain order
    // sort_order 0 is bottom.
    const zOffset = (sort_order || 0) * 0.1

    const { isSnapEnabled, activeGridSpacing, setSnapGuides } = useUIStore()

    const bind = useGesture({
        onDrag: ({ movement: [mx, my], first, last, event, memo }) => {
            event.stopPropagation()

            if (first) {
                memo = [x, y]
            }

            // Calculate scale based on camera zoom/position
            const distance = camera.position.z
            const vFov = (camera as THREE.PerspectiveCamera).fov * Math.PI / 180
            const planeHeightAtDist = 2 * Math.tan(vFov / 2) * distance
            const scaleFactor = planeHeightAtDist / size.height

            // Invert Y because screen Y is down, World Y is up
            // Note: movement is cumulative pixels from start
            const changeX = mx * scaleFactor
            const changeY = -my * scaleFactor

            const [initialX, initialY] = memo

            // Check modifier (Alt key disables snap temporarily)
            const isAltPressed = event.altKey
            const toSnap = isSnapEnabled && !isAltPressed

            // Pixel to Snap Unit conversion
            // activeGridSpacing is in METERS.
            // But our X/Y coordinates are in PIXELS (at 96 DPI usually, or whatever the world scale is).
            // We need to know what "1 unit" of grid is in World Pixels.
            // toPx(meters, 'm', 96)
            const gridSpacingPx = (activeGridSpacing / 0.0254) * DEFAULT_PPI

            const snapResult = SnapEngine.calculateSnap(
                { x: initialX, y: initialY },
                { x: changeX, y: changeY },
                gridSpacingPx,
                toSnap
            )

            // Update guides
            if (last) {
                setSnapGuides({ x: null, y: null })
            } else {
                setSnapGuides({
                    x: snapResult.guides.x ?? null,
                    y: snapResult.guides.y ?? null
                })
            }

            update(id, {
                x: snapResult.x,
                y: snapResult.y
            })

            return memo
        },
        onClick: ({ event }) => {
            event.stopPropagation()
            const isMulti = event.shiftKey || event.ctrlKey
            selectArtboard(id, isMulti)
        }
    })

    const borderGeometry = useMemo(() => new THREE.PlaneGeometry(width, height), [width, height])

    return (
        <group
            position={[x, y, zOffset]}
            {...bind()}
            onPointerOver={() => document.body.style.cursor = 'move'}
            onPointerOut={() => document.body.style.cursor = 'auto'}
        >
            {/* Main Artboard Plane - Writes to stencil buffer for background image clipping */}
            <mesh renderOrder={sort_order || 0}>
                <planeGeometry args={[width, height]} />
                <meshStandardMaterial
                    color={bgColor}
                    roughness={0.5}
                    transparent={true}
                    opacity={opacity}
                    colorWrite={!hasBackgroundImage}
                    polygonOffset
                    polygonOffsetFactor={-1 * (sort_order || 0)}
                    stencilWrite={true}
                    stencilRef={(sort_order || 0) + 1}
                    stencilFunc={THREE.AlwaysStencilFunc}
                    stencilFail={THREE.ReplaceStencilOp}
                    stencilZFail={THREE.ReplaceStencilOp}
                    stencilZPass={THREE.ReplaceStencilOp}
                />
            </mesh>


            {/* Selection Outline - Blue if selected */}
            {isSelected && (
                <lineSegments position={[0, 0, 0.5]}>
                    <edgesGeometry args={[borderGeometry]} />
                    <lineBasicMaterial color="#0066ff" linewidth={4} />
                </lineSegments>
            )}

            {/* Standard Border / Outline (Gray) */}
            {!isSelected && (
                <lineSegments position={[0, 0, 0.1]}>
                    <edgesGeometry args={[borderGeometry]} />
                    <lineBasicMaterial color="#cccccc" />
                </lineSegments>
            )}

            {/* Layer Name - top left */}
            <Text
                position={[textLayout.nameX, height / 2 + textLayout.offset, 0]}
                anchorX="left"
                anchorY="bottom"
                fontSize={textLayout.fontSize}
                color={isSelected ? "#0066ff" : "white"}
            >
                {name}
            </Text>

            {/* Width Label - top right */}
            <Text
                position={[textLayout.widthLabelX, height / 2 + textLayout.offset, 0]}
                anchorX="right"
                anchorY="bottom"
                fontSize={textLayout.fontSize}
                color={isSelected ? "#0066ff" : "#888888"}
            >
                {formatDimension(width)}
            </Text>

            {/* Height Label - left side, same font size as width */}
            <Text
                position={[-width / 2 - textLayout.offset, 0, 0]}
                rotation={[0, 0, Math.PI / 2]}
                fontSize={textLayout.fontSize}
                color={isSelected ? "#0066ff" : "#888888"}
                anchorX="center"
                anchorY="bottom"
            >
                {formatDimension(height)}
            </Text>
        </group>
    )
}

export const ArtboardComponent = React.memo(ArtboardComponentBase)

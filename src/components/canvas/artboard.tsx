'use client'

import React, { useRef, useMemo, useState } from 'react'
import * as THREE from 'three'
import { Text } from '@react-three/drei'
import { Artboard, useArtboardStore } from '@/lib/store/artboard-store'
import { useUIStore } from '@/lib/store/ui-store'
import { fromPx, DisplayUnit, DEFAULT_PPI } from '@/lib/math/units'
import { useThree, useFrame } from '@react-three/fiber'
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

    // Track camera Z for font scaling
    const [cameraZ, setCameraZ] = useState(1000)
    const { isCameraAnimating } = useUIStore()

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

    const bind = useGesture({
        onDrag: ({ delta: [dx, dy], event, memo = [x, y] }) => {
            event.stopPropagation()

            // Calculate scale based on camera zoom/position
            const distance = camera.position.z // Assuming looking at Z=0
            const vFov = (camera as THREE.PerspectiveCamera).fov * Math.PI / 180
            const planeHeightAtDist = 2 * Math.tan(vFov / 2) * distance
            const scaleFactor = planeHeightAtDist / size.height

            // Invert Y because screen Y is down, World Y is up
            const changeX = dx * scaleFactor
            const changeY = -dy * scaleFactor

            // Snapping Logic
            const { isSnapEnabled, activeGridSpacing } = useUIStore.getState()

            // Check modifier (Alt key disables snap temporarily)
            const isAltPressed = event.altKey

            let finalX = x + changeX
            let finalY = y + changeY

            if (isSnapEnabled && !isAltPressed) {
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
            {/* Main Artboard Plane */}
            <mesh>
                <planeGeometry args={[width, height]} />
                <meshStandardMaterial
                    color={bgColor}
                    roughness={0.5}
                    transparent={true}
                    opacity={opacity}
                    polygonOffset
                    polygonOffsetFactor={-1 * (sort_order || 0)}
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

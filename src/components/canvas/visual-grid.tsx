'use client'

import React, { useRef, useMemo, useState } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import { useUIStore } from '@/lib/store/ui-store'
import { toPx, fromPx, DEFAULT_PPI } from '@/lib/math/units'
import * as THREE from 'three'

// Thresholds for swapping grid scales
// 'height' is the camera Z distance converted to meters
// 'spacing' is the grid cell size in meters
const ZOOM_LEVELS = [
    { height: 0.5, spacing: 0.01 },   // < 0.5m camera height -> 1cm grid (10mm)
    { height: 1, spacing: 0.05 },     // < 1m -> 5cm grid (50mm)  
    { height: 2, spacing: 0.1 },      // < 2m -> 10cm grid (100mm)
    { height: 10, spacing: 0.5 },     // < 10m -> 50cm grid
    { height: 50, spacing: 1 },       // < 50m -> 1m grid
    { height: 500, spacing: 10 },     // < 500m -> 10m grid
    { height: 5000, spacing: 100 }    // < 5000m -> 100m grid
]

// Maximum number of labels to render at once for performance
const MAX_LABELS = 100

interface VisibleCell {
    key: string
    x: number
    y: number
}

export function VisualGrid() {
    const { isGridEnabled, isAxisEnabled, showGridDimensions, setCameraZoomLevel, gridUnit, isCameraAnimating } = useUIStore()
    const { camera, size } = useThree()
    const gridRef = useRef<THREE.GridHelper>(null)
    const [gridSpacing, setGridSpacing] = useState(1) // in meters
    const [visibleCells, setVisibleCells] = useState<VisibleCell[]>([])
    const [cameraZ, setCameraZ] = useState(1000) // Track camera Z for font scaling

    // Update Throttler
    const lastUpdate = useRef(0)

    useFrame((state) => {
        const now = state.clock.getElapsedTime()
        // Update every 200ms (or skip visible cells during animation for performance)
        if (now - lastUpdate.current > 0.2) {
            const zPx = camera.position.z
            setCameraZoomLevel(zPx)

            // Skip expensive font/cell calculations during animation
            if (!isCameraAnimating) {
                setCameraZ(zPx)
            }

            // Convert to meters for logic checks
            const heightM = (zPx / DEFAULT_PPI) * 0.0254

            // Adaptive Grid Logic
            let newSpacing = 100
            for (const level of ZOOM_LEVELS) {
                if (heightM < level.height) {
                    newSpacing = level.spacing
                    break
                }
            }
            if (newSpacing !== gridSpacing) {
                setGridSpacing(newSpacing)
                useUIStore.getState().setGridSpacing(newSpacing)
            }

            // Calculate visible cells for dimension labels
            if (showGridDimensions && isGridEnabled) {
                const spacingPx = toPx(newSpacing, 'm', DEFAULT_PPI)

                // Calculate visible area in world coords
                const perspCam = camera as THREE.PerspectiveCamera
                const vFov = perspCam.fov * Math.PI / 180
                const visibleHeight = 2 * Math.tan(vFov / 2) * zPx
                const visibleWidth = visibleHeight * (size.width / size.height)

                const camX = camera.position.x
                const camY = camera.position.y

                // Calculate the grid cell range that's visible
                const minX = camX - visibleWidth / 2
                const maxX = camX + visibleWidth / 2
                const minY = camY - visibleHeight / 2
                const maxY = camY + visibleHeight / 2

                // Snap to grid cell boundaries
                const startCellX = Math.floor(minX / spacingPx)
                const endCellX = Math.ceil(maxX / spacingPx)
                const startCellY = Math.floor(minY / spacingPx)
                const endCellY = Math.ceil(maxY / spacingPx)

                const cells: VisibleCell[] = []

                // Calculate total cells that would be visible
                const totalCellsX = endCellX - startCellX + 1
                const totalCellsY = endCellY - startCellY + 1
                const totalCells = totalCellsX * totalCellsY

                // If too many cells, sample evenly across the viewport
                const skipX = totalCells > MAX_LABELS ? Math.ceil(totalCellsX / Math.sqrt(MAX_LABELS)) : 1
                const skipY = totalCells > MAX_LABELS ? Math.ceil(totalCellsY / Math.sqrt(MAX_LABELS)) : 1

                // Generate cells across entire visible range with sampling if needed
                for (let cellX = startCellX; cellX <= endCellX; cellX += skipX) {
                    for (let cellY = startCellY; cellY <= endCellY; cellY += skipY) {
                        // Cell center position
                        const centerX = (cellX + 0.5) * spacingPx
                        const centerY = (cellY + 0.5) * spacingPx

                        cells.push({
                            key: `${cellX},${cellY}`,
                            x: centerX,
                            y: centerY
                        })
                    }
                }

                setVisibleCells(cells)
            } else {
                setVisibleCells([])
            }

            lastUpdate.current = now
        }
    })

    const gridSizePx = useMemo(() => toPx(10000, 'm', DEFAULT_PPI), []) // Huge grid area
    const spacingPx = useMemo(() => toPx(gridSpacing, 'm', DEFAULT_PPI), [gridSpacing])

    const divisionSize = useMemo(() => {
        return Math.round(gridSizePx / spacingPx)
    }, [gridSizePx, spacingPx])

    // Format the cell dimension label
    const cellLabel = useMemo(() => {
        const valInTargetUnit = fromPx(spacingPx, gridUnit as any, DEFAULT_PPI)
        const decimals = gridUnit === 'm' || gridUnit === 'ft' ? 2 : gridUnit === 'cm' ? 1 : 0
        return `${valInTargetUnit.toFixed(decimals)} ${gridUnit}`
    }, [spacingPx, gridUnit])

    // Calculate font size based on camera Z for consistent screen-space size
    // As camera moves further (higher Z), text needs to be larger in world space
    const fontSize = useMemo(() => {
        // Target ~12px apparent size on screen
        // Font size in world coords = desired screen size * (camera Z / some reference)
        const targetScreenSize = 14 // desired apparent size in pixels
        const perspCam = camera as THREE.PerspectiveCamera
        const vFov = perspCam.fov * Math.PI / 180
        // Visible height at camera Z
        const visibleHeight = 2 * Math.tan(vFov / 2) * cameraZ
        // Scale factor: how many world units per screen pixel
        const worldUnitsPerPixel = visibleHeight / (typeof window !== 'undefined' ? window.innerHeight : 800)
        return targetScreenSize * worldUnitsPerPixel
    }, [cameraZ, camera])

    if (!isGridEnabled && !isAxisEnabled) return null

    return (
        <group position={[0, 0, -10]}>
            {/* Pushed back -10px to avoid z-fighting with artboards at z=0 */}

            {isGridEnabled && (
                <group rotation={[Math.PI / 2, 0, 0]}>
                    <gridHelper
                        ref={gridRef}
                        args={[gridSizePx, divisionSize, 0x888888, 0x222222]}
                    />
                </group>
            )}

            {isAxisEnabled && (
                <axesHelper args={[toPx(1, 'm', DEFAULT_PPI)]} position={[0, 0, 1]} />
            )}

            {/* Virtualized Cell Center Labels */}
            {isGridEnabled && showGridDimensions && visibleCells.map(cell => (
                <Text
                    key={cell.key}
                    position={[cell.x, cell.y, 1]}
                    fontSize={fontSize}
                    color="#666666"
                    anchorX="center"
                    anchorY="middle"
                    fillOpacity={0.7}
                >
                    {cellLabel}
                </Text>
            ))}
        </group>
    )
}


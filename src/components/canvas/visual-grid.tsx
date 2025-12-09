'use client'

import React, { useRef, useMemo, useState } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import { useUIStore } from '@/lib/store/ui-store'
import { toPx, fromPx, formatPx, DEFAULT_PPI } from '@/lib/math/units'
import * as THREE from 'three'

// Thresholds for swapping grid scales
const ZOOM_LEVELS = [
    { height: 5, spacing: 0.1 },  // < 5m -> 10cm grid
    { height: 50, spacing: 1 },   // < 50m -> 1m grid
    { height: 500, spacing: 10 }, // < 500m -> 10m grid
    { height: 5000, spacing: 100 } // < 5000m -> 100m grid
]

export function VisualGrid() {
    const { isGridEnabled, isAxisEnabled, showGridDimensions, setCameraZoomLevel, gridUnit } = useUIStore()
    const { camera } = useThree()
    const gridRef = useRef<THREE.GridHelper>(null)
    const [gridSpacing, setGridSpacing] = useState(1) // in meters

    // Update Throttler
    const lastUpdate = useRef(0)

    useFrame((state) => {
        const now = state.clock.getElapsedTime()
        // Update Zoom Level every 200ms
        if (now - lastUpdate.current > 0.2) {
            const zPx = camera.position.z
            setCameraZoomLevel(zPx)

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
            }

            lastUpdate.current = now
        }
    })

    const gridSizePx = useMemo(() => toPx(10000, 'm', DEFAULT_PPI), []) // Huge grid area
    const spacingPx = useMemo(() => toPx(gridSpacing, 'm', DEFAULT_PPI), [gridSpacing])

    const divisionSize = useMemo(() => {
        return Math.round(gridSizePx / spacingPx)
    }, [gridSizePx, spacingPx])

    // Generate Labels
    // We only create labels near the center area?
    // Doing huge number of Text instances is heavy.
    // For now, let's create a few labels along the axis +X and +Y relative to 0.
    const numberOfLabels = 20
    const labels = useMemo(() => {
        if (!showGridDimensions) return []
        const arr = []
        for (let i = 1; i <= numberOfLabels; i++) {
            arr.push(i * gridSpacing)
        }
        return arr
    }, [gridSpacing, showGridDimensions])


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
                // Moved slightly up relative to grid to show
            )}

            {isGridEnabled && showGridDimensions && labels.map(valM => {
                const px = toPx(valM, 'm', DEFAULT_PPI)
                // We format the label based on the specific grid spacing unit for cleanliness
                // If spacing is 0.1m, label as "10 cm" "20 cm"
                // Or just use our formatPx but force the spacing unit.

                // We want to use the USER selected unit for display if possible, 
                // OR adapt to the Scale.
                // Request said "based on the unit selected in the zoom".

                const valInTargetUnit = fromPx(toPx(valM, 'm', DEFAULT_PPI), gridUnit as any)
                const labelText = `${valInTargetUnit.toFixed(gridUnit === 'm' || gridUnit === 'ft' ? 1 : 0)} ${gridUnit}`

                return (
                    <group key={valM}>
                        {/* X Axis Labels */}
                        <Text
                            position={[px, 0, 1]}
                            fontSize={12}
                            color="#888888"
                            anchorX="center"
                            anchorY="top"
                        >
                            {labelText}
                        </Text>

                        {/* Y Axis Labels (Mapped to -Y in 3D usually because screen Y is down? 
                            In Scene setup, +Y is UP. +X is Right.
                            We render 2D UI style.
                        */}
                        <Text
                            position={[0, px, 1]}
                            fontSize={12}
                            color="#888888"
                            anchorX="right"
                            anchorY="middle"
                        >
                            {labelText}
                        </Text>
                    </group>
                )
            })}
        </group>
    )
}

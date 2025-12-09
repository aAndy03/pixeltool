'use client'

import { Canvas } from '@react-three/fiber'
import { PerspectiveCamera } from '@react-three/drei'
import { useMemo } from 'react'
import { toPx } from '@/lib/math/units'
import { ArtboardComponent } from './artboard'
import { CameraControls } from './camera-controls'
import { useArtboardStore } from '@/lib/store/artboard-store'

// Constants
const MAX_DISTANCE_M = 1000 // 1000 meters max zoom
const GRID_SIZE_M = 1000 // 1000 meters grid size
const PPI = 96 // Default standard

export function Scene() {
    const { artboards, selectArtboard } = useArtboardStore()

    // Calculate grid size in pixels
    const gridSizePx = useMemo(() => toPx(GRID_SIZE_M, 'm', PPI), [])
    const divisionSize = useMemo(() => 100, []) // Divisions for visual clarity

    return (
        <div className="absolute inset-0 z-0 bg-neutral-900">
            <Canvas
                onPointerMissed={(e) => {
                    // Only deselect if it was a distinct click (not drag end)
                    // R3F handles this distinguishing for us usually.
                    if (e.type === 'click' || e.type === 'contextmenu') {
                        selectArtboard(null)
                    }
                }}
            >
                <PerspectiveCamera makeDefault position={[0, 0, toPx(1.5, 'm', PPI)]} near={1} far={toPx(MAX_DISTANCE_M * 2, 'm', PPI)} />
                <CameraControls />

                <ambientLight intensity={0.5} />
                <pointLight position={[toPx(10, 'm', PPI), toPx(10, 'm', PPI), toPx(10, 'm', PPI)]} />

                {/* ... Grid ... */}
                <group rotation={[Math.PI / 2, 0, 0]}>
                    <gridHelper args={[gridSizePx, divisionSize, 0x333333, 0x111111]} />
                </group>

                <axesHelper args={[toPx(0.5, 'm', PPI)]} />

                {/* Render Artboards */}
                {artboards.map(artboard => (
                    <ArtboardComponent key={artboard.id} data={artboard} />
                ))}

            </Canvas>
        </div>
    )
}

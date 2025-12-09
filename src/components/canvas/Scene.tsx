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
    const { artboards } = useArtboardStore()

    // Calculate grid size in pixels
    const gridSizePx = useMemo(() => toPx(GRID_SIZE_M, 'm', PPI), [])
    const divisionSize = useMemo(() => 100, []) // Divisions for visual clarity

    return (
        <div className="absolute inset-0 z-0 bg-neutral-900">
            <Canvas>
                <PerspectiveCamera makeDefault position={[0, 0, toPx(1.5, 'm', PPI)]} near={1} far={toPx(MAX_DISTANCE_M * 2, 'm', PPI)} />
                <CameraControls />

                <ambientLight intensity={0.5} />
                <pointLight position={[toPx(10, 'm', PPI), toPx(10, 'm', PPI), toPx(10, 'm', PPI)]} />

                {/* Grid on XY Plane (Z=0) */}
                {/* Standard gridHelper is XZ. Rotate -90deg around X to make it XY. */}
                {/* Actually, if we look from Z axis, X is right, Y is up. */}
                {/* gridHelper(size, divisions) draws on XZ plane. */}
                {/* Rotating by Math.PI/2 puts it on XY. */}
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

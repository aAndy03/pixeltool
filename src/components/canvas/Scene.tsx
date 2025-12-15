'use client'

import { Canvas } from '@react-three/fiber'
import { PerspectiveCamera } from '@react-three/drei'
import { useMemo, useEffect } from 'react'
import { toPx } from '@/lib/math/units'
import { ArtboardComponent } from './artboard'
import { ReferenceLayerComponent } from './reference-layer'
import { BackgroundImageLayer } from './background-image-layer'
import { CameraControls } from './camera-controls'
import { VisualGrid } from './visual-grid'
import { SnapGuidelines } from './snap-guidelines'
import { useArtboardStore } from '@/lib/store/artboard-store'
import { useReferenceStore } from '@/lib/store/reference-store'
import { useBackgroundImageStore } from '@/lib/store/background-image-store'
import { useProjectStore } from '@/lib/store/project-store'

// Constants
const MAX_DISTANCE_M = 1000 // 1000 meters max zoom
const GRID_SIZE_M = 1000 // 1000 meters grid size
const PPI = 96 // Default standard

export function Scene() {
    const { artboards, selectArtboard } = useArtboardStore()
    const { references, selectReference } = useReferenceStore()
    const { backgroundImages, selectBackgroundImage } = useBackgroundImageStore()
    const { currentProject } = useProjectStore()

    // Deselect all when clicking on empty space
    const handlePointerMissed = (e: any) => {
        if (e.type === 'click' || e.type === 'contextmenu') {
            selectArtboard(null)
            selectReference(null)
            selectBackgroundImage(null)
        }
    }

    // Get background images for a specific artboard
    const getBackgroundImagesForArtboard = (artboardId: string) => {
        return backgroundImages.filter(img => img.artboard_id === artboardId)
    }

    return (
        <div className="absolute inset-0 z-0 bg-neutral-900">
            <Canvas
                onPointerMissed={handlePointerMissed}
                gl={{ stencil: true }} // Enable stencil buffer
            >
                {/* Initial Camera Position from Project Settings or Default */}
                <PerspectiveCamera
                    makeDefault
                    position={[
                        currentProject?.settings?.camera?.x || 0,
                        currentProject?.settings?.camera?.y || 0,
                        currentProject?.settings?.camera?.z || toPx(1.5, 'm', PPI)
                    ]}
                    near={1}
                    far={toPx(MAX_DISTANCE_M * 2, 'm', PPI)}
                />

                {/* CameraControls handles interaction and persistence */}
                <CameraControls />

                <ambientLight intensity={0.5} />
                <pointLight position={[toPx(10, 'm', PPI), toPx(10, 'm', PPI), toPx(10, 'm', PPI)]} />

                {/* Grid */}
                <VisualGrid />
                <SnapGuidelines />

                {/* Artboards with their background images */}
                {artboards.map(artboard => {
                    const bgImages = getBackgroundImagesForArtboard(artboard.id)
                    const stencilRef = (artboard.sort_order || 0) + 1

                    return (
                        <group key={artboard.id}>
                            {/* Artboard (writes to stencil buffer) */}
                            <ArtboardComponent data={artboard} />

                            {/* Background images for this artboard (read from stencil buffer) */}
                            {bgImages.map(bgImage => (
                                <BackgroundImageLayer
                                    key={bgImage.id}
                                    data={bgImage}
                                    artboard={artboard}
                                    stencilRef={stencilRef}
                                />
                            ))}
                        </group>
                    )
                })}

                {/* Reference Layers */}
                {references.map(reference => (
                    <ReferenceLayerComponent key={reference.id} data={reference} />
                ))}

            </Canvas>
        </div>
    )
}


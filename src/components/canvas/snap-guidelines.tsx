'use client'

import { useUIStore } from '@/lib/store/ui-store'
import { toPx, DEFAULT_PPI } from '@/lib/math/units'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'
import { useMemo } from 'react'

const GUIDE_COLOR = '#ff00ff' // Magenta for high visibility
const GUIDE_OPACITY = 0.5

export function SnapGuidelines() {
    const { snapGuides, isSnapEnabled } = useUIStore()
    const { size, camera } = useThree()

    // Calculate visible bounds to make lines "infinite" nicely
    // Or just use a very large number.
    const guideLength = 100000 // 100km, effectively infinite

    // Convert guide positions (meters) to pixels
    // SnapEngine returns world units (meters generally, but stored as px in `x`/`y` state? 
    // Wait, the store has `x/y` in... PIXELS usually for artboards.
    // Let's verify `artboard.tsx` uses PIXELS for x/y.
    // Yes, `artboard.tsx` uses `toPx` or raw pixels.
    // `SnapEngine` was designed to accept `value` and `step`.
    // If we pass PIXELS to SnapEngine, it returns PIXELS.
    // Let's assume standard usage is PIXELS for X/Y in this app.

    if (!isSnapEnabled) return null

    return (
        <group>
            {/* Vertical Guide (X-axis position) */}
            {snapGuides.x !== null && snapGuides.x !== undefined && (
                <mesh position={[snapGuides.x, 0, 10]}>
                    <planeGeometry args={[2, guideLength]} />
                    <meshBasicMaterial color={GUIDE_COLOR} transparent opacity={GUIDE_OPACITY} />
                </mesh>
            )}

            {/* Horizontal Guide (Y-axis position) */}
            {snapGuides.y !== null && snapGuides.y !== undefined && (
                <mesh position={[0, snapGuides.y, 10]}>
                    <planeGeometry args={[guideLength, 2]} />
                    <meshBasicMaterial color={GUIDE_COLOR} transparent opacity={GUIDE_OPACITY} />
                </mesh>
            )}
        </group>
    )
}

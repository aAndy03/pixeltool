'use client'

import { useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import { OrbitControls } from '@react-three/drei'
import { toPx } from '@/lib/math/units'

const MAX_DISTANCE_M = 200 // 200 meters max zoom
const PPI = 96 // Default standard

export function CameraControls() {
    const { gl, camera } = useThree()
    const controlsRef = useRef<any>(null)

    useEffect(() => {
        const canvas = gl.domElement

        const handleWheel = (e: WheelEvent) => {
            const isPinch = e.ctrlKey || e.metaKey

            // If Ctrl/Meta key is pressed (Pinch gesture or Ctrl+Wheel), 
            // allow OrbitControls to handle Zoom naturally.
            if (isPinch) {
                return
            }

            // Otherwise, we intercept the wheel event for Panning
            e.preventDefault()
            e.stopImmediatePropagation()

            const controls = controlsRef.current
            if (!controls) return

            // Calculate Speed based on distance (Zoom level)
            const distance = controls.object.position.distanceTo(controls.target)
            const speed = distance * 0.001

            // Panning Logic
            // DeltaX -> Pan X (Horizontal)
            // DeltaY -> Pan Y (Vertical) - In 3D (Z-up is depth), Y is vertical screen axis.

            const deltaX = e.deltaX
            const deltaY = e.deltaY

            // Move Camera and Target together
            // X-axis: Standard Right positive
            controls.object.position.x += deltaX * speed
            controls.target.x += deltaX * speed

            // Y-axis: Standard Up positive
            // Scroll Down (Positive DeltaY) should move view Down (which means Camera moves DOWN, i.e., subtract Y)
            controls.object.position.y -= deltaY * speed
            controls.target.y -= deltaY * speed

            controls.update()
        }

        // Add listener with non-passive to allow preventDefault
        canvas.addEventListener('wheel', handleWheel, { passive: false })

        return () => {
            canvas.removeEventListener('wheel', handleWheel)
        }
    }, [gl])

    return (
        <OrbitControls
            ref={controlsRef}
            makeDefault
            enableDamping
            dampingFactor={0.1}
            // Zoom Limits
            maxDistance={toPx(MAX_DISTANCE_M, 'm', PPI)}
            minDistance={10}
            // View / Rotation Lock (2D Mode)
            screenSpacePanning={true}
            enableRotate={false} // Strictly disable rotation
            maxPolarAngle={Math.PI / 2} // Lock to XY plane
            minPolarAngle={Math.PI / 2}
            minAzimuthAngle={0}
            maxAzimuthAngle={0}
            // Disable default zoom on wheel (we handle it manually mostly, 
            // EXCEPT when Ctrl is pressed, but OrbitControls 'enableZoom' acts on all wheel events)
            // If we set enableZoom={true}, OrbitControls captures wheel.
            // But we intercepted it with stopImmediatePropagation() for non-pinch events!
            // So we can keep enableZoom={true} for the pinch cases.
            enableZoom={true}
            zoomSpeed={1.0}
        />
    )
}

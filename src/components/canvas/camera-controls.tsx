'use client'

import { useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import { OrbitControls } from '@react-three/drei'
import { toPx } from '@/lib/math/units'
import { useArtboardStore } from '@/lib/store/artboard-store'
import * as THREE from 'three'

const MAX_DISTANCE_M = 1000 // 1000 meters max zoom
const PPI = 96 // Default standard

export function CameraControls() {
    const { gl, camera, size } = useThree()
    const controlsRef = useRef<any>(null)

    // Use zoomToArtboardId as well
    const { artboards, focusArtboardId, setFocus, zoomToArtboardId, setZoomTo } = useArtboardStore()

    // Helper: Check if point is in view
    const isPointInView = (x: number, y: number) => {
        const vec = new THREE.Vector3(x, y, 0)
        vec.project(camera)
        return vec.x >= -0.9 && vec.x <= 0.9 && vec.y >= -0.9 && vec.y <= 0.9
    }

    // Handle Smart Focus (Pan only if needed)
    useEffect(() => {
        if (!focusArtboardId || !controlsRef.current) return

        const targetBoard = artboards.find(a => a.id === focusArtboardId)
        if (targetBoard) {
            // Check visibility
            if (!isPointInView(targetBoard.x, targetBoard.y)) {
                const controls = controlsRef.current
                const currentDist = controls.object.position.z

                controls.target.set(targetBoard.x, targetBoard.y, 0)
                controls.object.position.set(targetBoard.x, targetBoard.y, currentDist)
                controls.update()
            }
        }
        setFocus(null)
    }, [focusArtboardId, artboards, setFocus, camera])

    // Handle Zoom-To-Fit (Pan + Zoom)
    useEffect(() => {
        if (!zoomToArtboardId || !controlsRef.current) return

        const targetBoard = artboards.find(a => a.id === zoomToArtboardId)
        if (targetBoard) {
            const controls = controlsRef.current

            // Calculate fit distance
            const vFov = (camera as THREE.PerspectiveCamera).fov * Math.PI / 180
            const margin = 1.2 // 20% margin

            // Height needed?
            const heightDist = (targetBoard.height * margin) / (2 * Math.tan(vFov / 2))

            // Width needed? (Consider aspect ratio)
            const aspect = size.width / size.height
            const widthDist = (targetBoard.width * margin) / (2 * Math.tan(vFov / 2) * aspect)

            const targetDist = Math.max(heightDist, widthDist)

            controls.target.set(targetBoard.x, targetBoard.y, 0)
            controls.object.position.set(targetBoard.x, targetBoard.y, targetDist)
            controls.update()
        }
        setZoomTo(null)
    }, [zoomToArtboardId, artboards, setZoomTo, camera, size])


    useEffect(() => {
        const canvas = gl.domElement

        const handleWheel = (e: WheelEvent) => {
            const isPinch = e.ctrlKey || e.metaKey
            if (isPinch) return

            e.preventDefault()
            e.stopImmediatePropagation()

            const controls = controlsRef.current
            if (!controls) return

            const distance = controls.object.position.distanceTo(controls.target)
            const speed = distance * 0.001

            const deltaX = e.deltaX
            const deltaY = e.deltaY

            controls.object.position.x += deltaX * speed
            controls.target.x += deltaX * speed

            controls.object.position.y -= deltaY * speed
            controls.target.y -= deltaY * speed

            controls.update()
        }

        canvas.addEventListener('wheel', handleWheel, { passive: false })
        return () => canvas.removeEventListener('wheel', handleWheel)
    }, [gl])

    return (
        <OrbitControls
            ref={controlsRef}
            makeDefault
            enableDamping
            dampingFactor={0.1}
            maxDistance={toPx(MAX_DISTANCE_M, 'm', PPI)}
            minDistance={10}
            screenSpacePanning={true}
            enableRotate={false}
            maxPolarAngle={Math.PI / 2}
            minPolarAngle={Math.PI / 2}
            minAzimuthAngle={0}
            maxAzimuthAngle={0}
            enableZoom={true}
            zoomSpeed={1.0}
        />
    )
}

'use client'

import { useThree, useFrame } from '@react-three/fiber'
import { useEffect, useRef, useCallback, useState } from 'react'
import { OrbitControls } from '@react-three/drei'
import { toPx } from '@/lib/math/units'
import { useArtboardStore } from '@/lib/store/artboard-store'
import { useReferenceStore } from '@/lib/store/reference-store'
import { useProjectStore } from '@/lib/store/project-store'
import { useUIStore } from '@/lib/store/ui-store'
import * as THREE from 'three'

const MAX_DISTANCE_M = 1000 // 1000 meters max zoom
const PPI = 96 // Default standard
const ANIMATION_DURATION = 1000 // ms

// Debounce helper
function debounce(func: Function, wait: number) {
    let timeout: NodeJS.Timeout
    return (...args: any[]) => {
        clearTimeout(timeout)
        timeout = setTimeout(() => func(...args), wait)
    }
}

// Ease-out cubic for smooth deceleration
function easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3)
}

interface AnimationState {
    isAnimating: boolean
    startTime: number
    startX: number
    startY: number
    startZ: number
    targetX: number
    targetY: number
    targetZ: number
}

export function CameraControls() {
    const { gl, camera, size } = useThree()
    const controlsRef = useRef<any>(null)

    // Animation state
    const animationRef = useRef<AnimationState>({
        isAnimating: false,
        startTime: 0,
        startX: 0,
        startY: 0,
        startZ: 0,
        targetX: 0,
        targetY: 0,
        targetZ: 0
    })

    const { artboards, focusArtboardId, setFocus, zoomToArtboardId, setZoomTo } = useArtboardStore()
    const {
        references,
        focusReferenceId,
        setFocus: setReferenceFocus,
        zoomToReferenceId,
        setZoomTo: setReferenceZoomTo
    } = useReferenceStore()
    const { saveCameraState } = useProjectStore()
    const { setCameraAnimating } = useUIStore()

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const debouncedSave = useCallback(
        debounce((x: number, y: number, z: number) => {
            saveCameraState(x, y, z)
        }, 3000), // 3s debounce
        []
    )

    // Monitor changes to controls
    useEffect(() => {
        const controls = controlsRef.current
        if (!controls) return

        const handleChange = () => {
            const x = controls.target.x
            const y = controls.target.y
            const z = controls.object.position.z
            debouncedSave(x, y, z)
        }

        controls.addEventListener('change', handleChange)
        return () => controls.removeEventListener('change', handleChange)
    }, [debouncedSave])

    // Animation frame handler
    useFrame((state, delta) => {
        const anim = animationRef.current
        if (!anim.isAnimating || !controlsRef.current) return

        const elapsed = performance.now() - anim.startTime
        const progress = Math.min(elapsed / ANIMATION_DURATION, 1)
        const easedProgress = easeOutCubic(progress)

        const controls = controlsRef.current

        // Interpolate position
        const currentX = anim.startX + (anim.targetX - anim.startX) * easedProgress
        const currentY = anim.startY + (anim.targetY - anim.startY) * easedProgress
        const currentZ = anim.startZ + (anim.targetZ - anim.startZ) * easedProgress

        controls.target.set(currentX, currentY, 0)
        controls.object.position.set(currentX, currentY, currentZ)
        controls.update()

        // End animation
        if (progress >= 1) {
            anim.isAnimating = false
            setCameraAnimating(false)
        }
    })

    // Helper: Check if point is in view
    const isPointInView = (x: number, y: number) => {
        const vec = new THREE.Vector3(x, y, 0)
        vec.project(camera)
        return vec.x >= -0.9 && vec.x <= 0.9 && vec.y >= -0.9 && vec.y <= 0.9
    }

    // Handle Smart Focus for Artboards (Pan only if needed)
    useEffect(() => {
        if (!focusArtboardId || !controlsRef.current) return

        const targetBoard = artboards.find(a => a.id === focusArtboardId)
        if (targetBoard) {
            if (!isPointInView(targetBoard.x, targetBoard.y)) {
                const controls = controlsRef.current
                const currentDist = controls.object.position.z

                // Start animated transition
                setCameraAnimating(true)
                animationRef.current = {
                    isAnimating: true,
                    startTime: performance.now(),
                    startX: controls.target.x,
                    startY: controls.target.y,
                    startZ: currentDist,
                    targetX: targetBoard.x,
                    targetY: targetBoard.y,
                    targetZ: currentDist
                }
            }
        }
        setFocus(null)
    }, [focusArtboardId, artboards, setFocus, camera])

    // Handle Smart Focus for References (Pan only if needed)
    useEffect(() => {
        if (!focusReferenceId || !controlsRef.current) return

        const targetRef = references.find(r => r.id === focusReferenceId)
        if (targetRef) {
            if (!isPointInView(targetRef.x, targetRef.y)) {
                const controls = controlsRef.current
                const currentDist = controls.object.position.z

                // Start animated transition
                setCameraAnimating(true)
                animationRef.current = {
                    isAnimating: true,
                    startTime: performance.now(),
                    startX: controls.target.x,
                    startY: controls.target.y,
                    startZ: currentDist,
                    targetX: targetRef.x,
                    targetY: targetRef.y,
                    targetZ: currentDist
                }
            }
        }
        setReferenceFocus(null)
    }, [focusReferenceId, references, setReferenceFocus, camera])

    // Handle Zoom-To-Fit for Artboards (Pan + Zoom) with Animation
    useEffect(() => {
        if (!zoomToArtboardId || !controlsRef.current) return

        const targetBoard = artboards.find(a => a.id === zoomToArtboardId)
        if (targetBoard) {
            const controls = controlsRef.current

            const vFov = (camera as THREE.PerspectiveCamera).fov * Math.PI / 180
            const margin = 1.2

            const heightDist = (targetBoard.height * margin) / (2 * Math.tan(vFov / 2))
            const aspect = size.width / size.height
            const widthDist = (targetBoard.width * margin) / (2 * Math.tan(vFov / 2) * aspect)

            const targetDist = Math.max(heightDist, widthDist)

            // Start animated transition
            setCameraAnimating(true)
            animationRef.current = {
                isAnimating: true,
                startTime: performance.now(),
                startX: controls.target.x,
                startY: controls.target.y,
                startZ: controls.object.position.z,
                targetX: targetBoard.x,
                targetY: targetBoard.y,
                targetZ: targetDist
            }
        }
        setZoomTo(null)
    }, [zoomToArtboardId, artboards, setZoomTo, camera, size])

    // Handle Zoom-To-Fit for References (Pan + Zoom) with Animation
    useEffect(() => {
        if (!zoomToReferenceId || !controlsRef.current) return

        const targetRef = references.find(r => r.id === zoomToReferenceId)
        if (targetRef) {
            const controls = controlsRef.current

            const vFov = (camera as THREE.PerspectiveCamera).fov * Math.PI / 180
            const margin = 1.2

            const heightDist = (targetRef.height * margin) / (2 * Math.tan(vFov / 2))
            const aspect = size.width / size.height
            const widthDist = (targetRef.width * margin) / (2 * Math.tan(vFov / 2) * aspect)

            const targetDist = Math.max(heightDist, widthDist)

            // Start animated transition
            setCameraAnimating(true)
            animationRef.current = {
                isAnimating: true,
                startTime: performance.now(),
                startX: controls.target.x,
                startY: controls.target.y,
                startZ: controls.object.position.z,
                targetX: targetRef.x,
                targetY: targetRef.y,
                targetZ: targetDist
            }
        }
        setReferenceZoomTo(null)
    }, [zoomToReferenceId, references, setReferenceZoomTo, camera, size])


    useEffect(() => {
        const canvas = gl.domElement

        const handleWheel = (e: WheelEvent) => {
            const isPinch = e.ctrlKey || e.metaKey
            if (isPinch) return

            e.preventDefault()
            e.stopImmediatePropagation()

            // Cancel any ongoing animation on manual control
            animationRef.current.isAnimating = false

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



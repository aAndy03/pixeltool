'use client'

import React, { useRef, useMemo, useState, useEffect } from 'react'
import * as THREE from 'three'
import { Text } from '@react-three/drei'
import { ReferenceLayer, useReferenceStore } from '@/lib/store/reference-store'
import { useUIStore } from '@/lib/store/ui-store'
import { useArtboardStore } from '@/lib/store/artboard-store'
import { fromPx, DisplayUnit, DEFAULT_PPI } from '@/lib/math/units'
import { useThree, useFrame, useLoader } from '@react-three/fiber'
import { useGesture } from '@use-gesture/react'
import { SnapEngine } from '@/lib/math/snap-engine'
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js'

interface ReferenceLayerProps {
    data: ReferenceLayer
}

// Green color for references
const REFERENCE_COLOR = '#22c55e'
const REFERENCE_COLOR_HEX = 0x22c55e

export function ReferenceLayerComponent({ data }: ReferenceLayerProps) {
    const { width, height, x, y, name, id, sort_order, settings } = data
    const opacity = settings?.opacity ?? 0.4
    const showMeasurements = settings?.showMeasurements ?? false
    const displayUnit: DisplayUnit = settings?.physicalUnit || 'cm'
    const svgPath = settings?.svgPath

    // Track camera Z for font scaling
    const [cameraZ, setCameraZ] = useState(1000)
    const { isCameraAnimating } = useUIStore()

    const { camera, size } = useThree()

    // SVG Loading and processing
    const [svgGeometry, setSvgGeometry] = useState<THREE.ShapeGeometry | null>(null)
    const [svgGroup, setSvgGroup] = useState<THREE.Group | null>(null)

    useEffect(() => {
        if (!svgPath) return

        const loader = new SVGLoader()
        loader.load(
            svgPath,
            (data) => {
                const paths = data.paths
                const group = new THREE.Group()

                // Get SVG bounds
                let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity

                paths.forEach((path) => {
                    const shapes = SVGLoader.createShapes(path)
                    shapes.forEach((shape) => {
                        const geometry = new THREE.ShapeGeometry(shape)
                        geometry.computeBoundingBox()
                        if (geometry.boundingBox) {
                            minX = Math.min(minX, geometry.boundingBox.min.x)
                            minY = Math.min(minY, geometry.boundingBox.min.y)
                            maxX = Math.max(maxX, geometry.boundingBox.max.x)
                            maxY = Math.max(maxY, geometry.boundingBox.max.y)
                        }

                        // Apply green color override
                        const material = new THREE.MeshBasicMaterial({
                            color: REFERENCE_COLOR_HEX,
                            transparent: true,
                            opacity: opacity,
                            side: THREE.DoubleSide
                        })

                        const mesh = new THREE.Mesh(geometry, material)
                        group.add(mesh)
                    })
                })

                // Scale and center the SVG
                const svgWidth = maxX - minX
                const svgHeight = maxY - minY
                const scaleX = width / svgWidth
                const scaleY = height / svgHeight

                group.scale.set(scaleX, -scaleY, 1) // Flip Y for correct orientation
                group.position.set(-width / 2, height / 2, 0) // Center the group

                setSvgGroup(group)
            },
            undefined,
            (error) => {
                console.error('SVG load error:', error)
            }
        )
    }, [svgPath, width, height, opacity])

    // Update camera Z periodically
    useFrame(() => {
        if (isCameraAnimating) return
        const z = camera.position.z
        if (Math.abs(z - cameraZ) > 10) {
            setCameraZ(z)
        }
    })

    // Format dimension for display
    const formatDimension = (valuePx: number) => {
        const val = fromPx(valuePx, displayUnit, DEFAULT_PPI)
        const decimals = displayUnit === 'm' ? 2 : displayUnit === 'cm' ? 1 : displayUnit === 'px' ? 0 : 2
        return `${val.toFixed(decimals)} ${displayUnit}`
    }

    // Calculate font sizes and positions based on camera Z
    const textLayout = useMemo(() => {
        const perspCam = camera as THREE.PerspectiveCamera
        const vFov = perspCam.fov * Math.PI / 180
        const visibleHeight = 2 * Math.tan(vFov / 2) * cameraZ
        const screenHeight = typeof window !== 'undefined' ? window.innerHeight : 800
        const worldUnitsPerPixel = visibleHeight / screenHeight

        const targetFontScreenSize = 12
        const paddingFactor = 0.3

        let fontSize = targetFontScreenSize * worldUnitsPerPixel

        const charWidth = 0.6
        const nameLength = name.length
        const dimText = formatDimension(width)
        const dimLength = dimText.length

        const padding = fontSize * paddingFactor
        const estimatedNameWidth = nameLength * fontSize * charWidth
        const estimatedDimWidth = dimLength * fontSize * charWidth
        const totalNeeded = estimatedNameWidth + padding + estimatedDimWidth

        const availableWidth = width

        if (totalNeeded > availableWidth) {
            const scale = availableWidth / totalNeeded
            fontSize = fontSize * scale * 0.9
        }

        const minFontSize = 3 * worldUnitsPerPixel
        fontSize = Math.max(fontSize, minFontSize)

        const maxFontSize = Math.min(width, height) * 0.15
        fontSize = Math.min(fontSize, maxFontSize)

        const offset = fontSize * 0.8

        return {
            fontSize,
            offset,
            widthLabelX: width / 2,
            nameX: -width / 2
        }
    }, [cameraZ, camera, width, height, name])

    const { selectedReferenceIds, selectReference, update } = useReferenceStore()
    const { selectArtboard } = useArtboardStore()
    const isSelected = selectedReferenceIds.includes(id)

    // Z-index logic
    const zOffset = (sort_order || 0) * 0.1

    const { isSnapEnabled, activeGridSpacing, setSnapGuides } = useUIStore()

    const bind = useGesture({
        onDrag: ({ movement: [mx, my], first, last, event, memo }) => {
            event.stopPropagation()

            if (first) {
                memo = [x, y]
            }

            const distance = camera.position.z
            const vFov = (camera as THREE.PerspectiveCamera).fov * Math.PI / 180
            const planeHeightAtDist = 2 * Math.tan(vFov / 2) * distance
            const scaleFactor = planeHeightAtDist / size.height

            const changeX = mx * scaleFactor
            const changeY = -my * scaleFactor

            const [initialX, initialY] = memo

            const isAltPressed = event.altKey
            const toSnap = isSnapEnabled && !isAltPressed

            const gridSpacingPx = (activeGridSpacing / 0.0254) * DEFAULT_PPI

            const snapResult = SnapEngine.calculateSnap(
                { x: initialX, y: initialY },
                { x: changeX, y: changeY },
                gridSpacingPx,
                toSnap
            )

            if (last) {
                setSnapGuides({ x: null, y: null })
            } else {
                setSnapGuides({
                    x: snapResult.guides.x ?? null,
                    y: snapResult.guides.y ?? null
                })
            }

            update(id, {
                x: snapResult.x,
                y: snapResult.y
            })

            return memo
        },
        onClick: ({ event }) => {
            event.stopPropagation()
            // Deselect artboards when selecting reference
            selectArtboard(null)
            const isMulti = event.shiftKey || event.ctrlKey
            selectReference(id, isMulti)
        }
    })

    const borderGeometry = useMemo(() => new THREE.PlaneGeometry(width, height), [width, height])

    // Arrow geometry for measurements
    const arrowSize = textLayout.fontSize * 0.5

    return (
        <group
            position={[x, y, zOffset]}
            {...bind()}
            onPointerOver={() => document.body.style.cursor = 'move'}
            onPointerOut={() => document.body.style.cursor = 'auto'}
        >
            {/* SVG Content or Fallback Rectangle */}
            {svgGroup ? (
                <primitive object={svgGroup.clone()} />
            ) : (
                <mesh>
                    <planeGeometry args={[width, height]} />
                    <meshBasicMaterial
                        color={REFERENCE_COLOR_HEX}
                        transparent={true}
                        opacity={opacity}
                    />
                </mesh>
            )}

            {/* Selection Outline - Blue if selected */}
            {isSelected && (
                <lineSegments position={[0, 0, 0.5]}>
                    <edgesGeometry args={[borderGeometry]} />
                    <lineBasicMaterial color="#0066ff" linewidth={4} />
                </lineSegments>
            )}

            {/* Standard Border / Outline (Green) */}
            {!isSelected && (
                <lineSegments position={[0, 0, 0.1]}>
                    <edgesGeometry args={[borderGeometry]} />
                    <lineBasicMaterial color={REFERENCE_COLOR_HEX} />
                </lineSegments>
            )}

            {/* Layer Name - top left */}
            <Text
                position={[textLayout.nameX, height / 2 + textLayout.offset, 0]}
                anchorX="left"
                anchorY="bottom"
                fontSize={textLayout.fontSize}
                color={isSelected ? "#0066ff" : REFERENCE_COLOR}
            >
                {name}
            </Text>

            {/* Measurement Arrows (optional) */}
            {showMeasurements && (
                <>
                    {/* Width measurement - top */}
                    <group position={[0, height / 2 + textLayout.offset * 2.5, 0]}>
                        {/* Left arrow */}
                        <mesh position={[-width / 2 + arrowSize, 0, 0]} rotation={[0, 0, Math.PI]}>
                            <coneGeometry args={[arrowSize * 0.3, arrowSize, 8]} />
                            <meshBasicMaterial color={REFERENCE_COLOR_HEX} />
                        </mesh>
                        {/* Right arrow */}
                        <mesh position={[width / 2 - arrowSize, 0, 0]}>
                            <coneGeometry args={[arrowSize * 0.3, arrowSize, 8]} />
                            <meshBasicMaterial color={REFERENCE_COLOR_HEX} />
                        </mesh>
                        {/* Line */}
                        <mesh>
                            <boxGeometry args={[width - arrowSize * 2, arrowSize * 0.1, 0.1]} />
                            <meshBasicMaterial color={REFERENCE_COLOR_HEX} />
                        </mesh>
                        {/* Label */}
                        <Text
                            position={[0, arrowSize * 0.8, 0]}
                            fontSize={textLayout.fontSize * 0.8}
                            color={REFERENCE_COLOR}
                            anchorX="center"
                            anchorY="bottom"
                        >
                            {formatDimension(width)}
                        </Text>
                    </group>

                    {/* Height measurement - right side */}
                    <group position={[width / 2 + textLayout.offset * 2.5, 0, 0]}>
                        {/* Top arrow */}
                        <mesh position={[0, height / 2 - arrowSize, 0]} rotation={[0, 0, Math.PI / 2]}>
                            <coneGeometry args={[arrowSize * 0.3, arrowSize, 8]} />
                            <meshBasicMaterial color={REFERENCE_COLOR_HEX} />
                        </mesh>
                        {/* Bottom arrow */}
                        <mesh position={[0, -height / 2 + arrowSize, 0]} rotation={[0, 0, -Math.PI / 2]}>
                            <coneGeometry args={[arrowSize * 0.3, arrowSize, 8]} />
                            <meshBasicMaterial color={REFERENCE_COLOR_HEX} />
                        </mesh>
                        {/* Line */}
                        <mesh>
                            <boxGeometry args={[arrowSize * 0.1, height - arrowSize * 2, 0.1]} />
                            <meshBasicMaterial color={REFERENCE_COLOR_HEX} />
                        </mesh>
                        {/* Label */}
                        <Text
                            position={[arrowSize * 0.8, 0, 0]}
                            rotation={[0, 0, -Math.PI / 2]}
                            fontSize={textLayout.fontSize * 0.8}
                            color={REFERENCE_COLOR}
                            anchorX="center"
                            anchorY="bottom"
                        >
                            {formatDimension(height)}
                        </Text>
                    </group>
                </>
            )}
        </group>
    )
}

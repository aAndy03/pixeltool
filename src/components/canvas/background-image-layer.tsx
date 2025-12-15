'use client'

import React, { useMemo, useState, useEffect } from 'react'
import * as THREE from 'three'
import { useBackgroundImageStore } from '@/lib/store/background-image-store'
import { useArtboardStore, Artboard } from '@/lib/store/artboard-store'
import { useUIStore } from '@/lib/store/ui-store'
import { useThree, useFrame } from '@react-three/fiber'
import { useGesture } from '@use-gesture/react'
import { BackgroundImage } from '@/lib/db'

interface BackgroundImageLayerProps {
    data: BackgroundImage
    artboard: Artboard
    stencilRef: number
}

export function BackgroundImageLayer({ data, artboard, stencilRef }: BackgroundImageLayerProps) {
    const { width, height, x, y, id, settings, image_url } = data
    const opacity = settings?.opacity ?? 1

    const [texture, setTexture] = useState<THREE.Texture | null>(null)
    const [loadError, setLoadError] = useState(false)
    const [cameraZ, setCameraZ] = useState(1000)

    const { isCameraAnimating } = useUIStore()
    const { camera, size } = useThree()
    const { selectedBackgroundImageIds, selectBackgroundImage, update } = useBackgroundImageStore()
    const { selectArtboard } = useArtboardStore()

    const isSelected = selectedBackgroundImageIds.includes(id)
    const zOffset = 0.05

    // Load texture using proxy to bypass CORS
    useEffect(() => {
        // Check if it's an external URL (not from our domain)
        const isExternal = image_url.startsWith('http') && !image_url.includes(window.location.host)

        // Use proxy for external URLs
        const textureUrl = isExternal
            ? `/api/image-proxy?url=${encodeURIComponent(image_url)}`
            : image_url

        console.log('Loading texture from:', textureUrl)

        // Use HTML Image element for more control
        const img = new window.Image()
        img.crossOrigin = 'anonymous'

        img.onload = () => {
            console.log('Image loaded successfully:', img.width, 'x', img.height)
            const tex = new THREE.Texture(img)
            tex.colorSpace = THREE.SRGBColorSpace
            tex.needsUpdate = true
            setTexture(tex)
            setLoadError(false)
        }

        img.onerror = (e) => {
            console.error('Failed to load image:', e)
            setLoadError(true)
        }

        img.src = textureUrl

        return () => {
            if (texture) {
                texture.dispose()
            }
        }
    }, [image_url])

    // Update camera Z periodically
    useFrame(() => {
        if (isCameraAnimating) return
        const z = camera.position.z
        if (Math.abs(z - cameraZ) > 10) {
            setCameraZ(z)
        }
    })

    const { setSnapGuides } = useUIStore()

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

            update(id, {
                x: initialX + changeX,
                y: initialY + changeY
            })

            if (last) {
                setSnapGuides({ x: null, y: null })
            }

            return memo
        },
        onClick: ({ event }) => {
            event.stopPropagation()
            selectArtboard(null)
            selectBackgroundImage(id)
        }
    })

    const borderGeometry = useMemo(() => new THREE.PlaneGeometry(width, height), [width, height])

    // Position relative to artboard
    const absoluteX = artboard.x + x
    const absoluteY = artboard.y + y
    const artboardZOffset = (artboard.sort_order || 0) * 0.1

    // Render placeholder if texture failed to load
    if (loadError || !texture) {
        return (
            <group
                position={[absoluteX, absoluteY, artboardZOffset + zOffset]}
                {...bind()}
                onPointerOver={() => document.body.style.cursor = 'move'}
                onPointerOut={() => document.body.style.cursor = 'auto'}
            >
                {/* Error/Loading placeholder */}
                <mesh>
                    <planeGeometry args={[width, height]} />
                    <meshBasicMaterial
                        color={loadError ? "#ef4444" : "#3b82f6"}
                        opacity={0.3}
                        transparent
                        stencilWrite={false}
                        stencilRef={stencilRef}
                        stencilFunc={THREE.EqualStencilFunc}
                    />
                </mesh>

                {/* Selection outline */}
                {isSelected && (
                    <lineSegments position={[0, 0, 0.5]}>
                        <edgesGeometry args={[borderGeometry]} />
                        <lineBasicMaterial color="#0066ff" linewidth={4} />
                    </lineSegments>
                )}
            </group>
        )
    }

    return (
        <group
            position={[absoluteX, absoluteY, artboardZOffset + zOffset]}
            {...bind()}
            onPointerOver={() => document.body.style.cursor = 'move'}
            onPointerOut={() => document.body.style.cursor = 'auto'}
        >
            {/* Background Image - Using key to force re-render when texture loads */}
            <mesh key={texture ? 'textured' : 'loading'}>
                <planeGeometry args={[width, height]} />
                {texture ? (
                    <meshBasicMaterial
                        map={texture}
                        transparent
                        opacity={opacity}
                        side={THREE.DoubleSide}
                        toneMapped={false}
                    />
                ) : (
                    <meshBasicMaterial
                        color="#3b82f6"
                        transparent
                        opacity={0.3}
                        side={THREE.DoubleSide}
                    />
                )}
            </mesh>

            {/* Selection Outline */}
            {isSelected && (
                <lineSegments position={[0, 0, 0.5]}>
                    <edgesGeometry args={[borderGeometry]} />
                    <lineBasicMaterial color="#0066ff" linewidth={4} />
                </lineSegments>
            )}

            {/* Dashed outline showing full image bounds */}
            <lineSegments position={[0, 0, 0.3]}>
                <edgesGeometry args={[borderGeometry]} />
                <lineDashedMaterial
                    color={isSelected ? "#0066ff" : "#ffffff"}
                    dashSize={width * 0.02}
                    gapSize={width * 0.01}
                    opacity={0.5}
                    transparent
                />
            </lineSegments>
        </group>
    )
}

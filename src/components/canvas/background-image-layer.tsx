'use client'

import React, { useMemo, useState, useEffect } from 'react'
import * as THREE from 'three'
import { useBackgroundImageStore } from '@/lib/store/background-image-store'
import { useArtboardStore, Artboard } from '@/lib/store/artboard-store'
import { useUIStore } from '@/lib/store/ui-store'
import { useThree, useFrame } from '@react-three/fiber'
import { useGesture } from '@use-gesture/react'
import { BackgroundImage } from '@/lib/db'
import { normalizeImageUrl } from '@/lib/utils'

interface BackgroundImageLayerProps {
    data: BackgroundImage
    artboard: Artboard
    stencilRef: number
}

const BackgroundImageLayerBase = ({ data, artboard, stencilRef }: BackgroundImageLayerProps) => {
    const { width, height, x, y, id, settings, image_url, natural_width, natural_height } = data
    const opacity = settings?.opacity ?? 1
    const fit = settings?.fit || 'custom'
    const clip = settings?.clip ?? true
    const repeat = settings?.repeat ?? false

    // Calculate Render Dimensions based on Fit Mode
    let renderWidth = width
    let renderHeight = height
    let renderX = x
    let renderY = y

    if (fit !== 'custom') {
        renderX = 0
        renderY = 0

        const artRatio = artboard.width / artboard.height
        const imgRatio = natural_width / natural_height

        if (fit === 'original') {
            renderWidth = natural_width
            renderHeight = natural_height
        } else if (fit === 'cover') {
            if (imgRatio > artRatio) {
                // Image is wider than artboard (relative to height)
                renderHeight = artboard.height
                renderWidth = renderHeight * imgRatio
            } else {
                // Image is taller than artboard
                renderWidth = artboard.width
                renderHeight = renderWidth / imgRatio
            }
        } else if (fit === 'contain') {
            if (imgRatio > artRatio) {
                // Image is wider -> fit to width
                renderWidth = artboard.width
                renderHeight = renderWidth / imgRatio
            } else {
                // Image is taller -> fit to height
                renderHeight = artboard.height
                renderWidth = renderHeight * imgRatio
            }
        } else if (fit === 'stretch') {
            renderWidth = artboard.width
            renderHeight = artboard.height
        }
    }

    const [texture, setTexture] = useState<THREE.Texture | null>(null)
    const [loadError, setLoadError] = useState(false)
    const { camera, size } = useThree()
    const { selectedBackgroundImageIds, selectBackgroundImage, update } = useBackgroundImageStore()
    const { selectArtboard } = useArtboardStore()

    const isSelected = selectedBackgroundImageIds.includes(id)
    const zOffset = 0.05



    // ... (keep imports)

    // Load texture using proxy to bypass CORS
    useEffect(() => {
        // Normalize URL (e.g. handle Google Drive links)
        const directUrl = normalizeImageUrl(image_url)

        // Check if it's an external URL (not from our domain)
        const isExternal = directUrl.startsWith('http') && !directUrl.includes(window.location.host)

        // Use proxy for external URLs
        const textureUrl = isExternal
            ? `/api/image-proxy?url=${encodeURIComponent(directUrl)}`
            : directUrl

        console.log('Loading texture from:', textureUrl)

        // Use HTML Image element for more control
        const img = new window.Image()
        img.crossOrigin = 'anonymous'

        img.onload = () => {
            console.log('Image loaded successfully:', img.width, 'x', img.height)

            // Update store if natural dimensions are missing or different
            if (natural_width !== img.width || natural_height !== img.height) {
                console.log('Updating natural dimensions in store')
                update(id, {
                    natural_width: img.width,
                    natural_height: img.height
                })
            }

            const tex = new THREE.Texture(img)
            tex.colorSpace = THREE.SRGBColorSpace

            // Handle Repeat / Tiling
            tex.wrapS = repeat ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping
            tex.wrapT = repeat ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping

            if (repeat && img.width > 0 && img.height > 0) {
                const repeatX = renderWidth / img.width
                const repeatY = renderHeight / img.height
                tex.repeat.set(repeatX, repeatY)
            } else {
                tex.repeat.set(1, 1)
            }

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

    // Update texture repeat if dimension changes without reloading image
    useEffect(() => {
        if (texture) {
            texture.wrapS = repeat ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping
            texture.wrapT = repeat ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping

            if (repeat && natural_width > 0 && natural_height > 0) {
                const repeatX = renderWidth / natural_width
                const repeatY = renderHeight / natural_height
                texture.repeat.set(repeatX, repeatY)
            } else {
                texture.repeat.set(1, 1)
            }
            texture.needsUpdate = true
        }
    }, [texture, repeat, renderWidth, renderHeight, natural_width, natural_height])



    const { setSnapGuides } = useUIStore()

    const bind = useGesture({
        onDrag: ({ movement: [mx, my], first, last, event, memo }) => {
            const isActive = isSelected || event.altKey || event.metaKey || event.ctrlKey

            if (!isActive) return // Allow event to bubble to artboard

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
            const isActive = isSelected || event.altKey || event.metaKey || event.ctrlKey

            if (!isActive) return // Allow event to bubble to artboard

            event.stopPropagation()
            selectArtboard(null)
            selectBackgroundImage(id)
        }
    })

    const borderGeometry = useMemo(() => new THREE.PlaneGeometry(renderWidth, renderHeight), [renderWidth, renderHeight])

    // Position relative to artboard
    const absoluteX = artboard.x + renderX
    const absoluteY = artboard.y + renderY
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
                    <planeGeometry args={[renderWidth, renderHeight]} />
                    <meshBasicMaterial
                        color={loadError ? "#ef4444" : "#3b82f6"}
                        opacity={0.3}
                        transparent
                        stencilWrite={clip}
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
            <mesh key={texture ? 'textured' : 'loading'} renderOrder={(artboard.sort_order || 0)}>
                <planeGeometry args={[renderWidth, renderHeight]} />
                {texture ? (
                    <meshBasicMaterial
                        map={texture}
                        transparent
                        opacity={opacity}
                        side={THREE.DoubleSide}
                        toneMapped={false}
                        stencilWrite={clip}
                        stencilRef={stencilRef}
                        stencilFunc={THREE.EqualStencilFunc}
                    />
                ) : (
                    <meshBasicMaterial
                        color="#3b82f6"
                        transparent
                        opacity={0.3}
                        side={THREE.DoubleSide}
                        stencilWrite={clip}
                        stencilRef={stencilRef}
                        stencilFunc={THREE.EqualStencilFunc}
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

            {/* Dashed outline showing full image bounds - Only if clipped is on, to show what's hidden? Or always? */}
            <lineSegments position={[0, 0, 0.3]}>
                <edgesGeometry args={[borderGeometry]} />
                <lineDashedMaterial
                    color={isSelected ? "#0066ff" : "#ffffff"}
                    dashSize={renderWidth * 0.02}
                    gapSize={renderWidth * 0.01}
                    opacity={0.5}
                    transparent
                />
            </lineSegments>
        </group>
    )
}

export const BackgroundImageLayer = React.memo(BackgroundImageLayerBase)

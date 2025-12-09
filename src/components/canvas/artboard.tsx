'use client'

import { Text } from '@react-three/drei'
import { Artboard } from '@/lib/store/artboard-store'
import { formatPx } from '@/lib/math/units'

interface ArtboardProps {
    data: Artboard
}

export function ArtboardComponent({ data }: ArtboardProps) {
    const { width, height, x, y, name } = data

    return (
        <group position={[x, y, 0]}>
            {/* Main Artboard Plane */}
            <mesh>
                <planeGeometry args={[width, height]} />
                <meshStandardMaterial color="white" roughness={0.5} />
            </mesh>

            {/* Border / Outline */}
            <lineSegments position={[0, 0, 0.1]}>
                <edgesGeometry args={[new THREE.PlaneGeometry(width, height)]} />
                <lineBasicMaterial color="#cccccc" />
            </lineSegments>

            {/* Label (Name) - slightly above top-left */}
            <Text
                position={[-width / 2, height / 2 + 10, 0]}
                anchorX="left"
                fontSize={12}
                color="white"
            >
                {name}
            </Text>

            {/* Dimensions Labels */}
            {/* Top Width Label */}
            <Text
                position={[0, height / 2 + 5, 0]}
                fontSize={10}
                color="#888888"
            >
                {formatPx(width)}
            </Text>
            {/* Left Height Label */}
            <Text
                position={[-width / 2 - 5, 0, 0]}
                rotation={[0, 0, Math.PI / 2]}
                fontSize={10}
                color="#888888"
            >
                {formatPx(height)}
            </Text>
        </group>
    )
}

import * as THREE from 'three'

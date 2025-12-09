'use client'

import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'

export function Scene() {
    return (
        <div className="absolute inset-0 z-0 bg-transparent">
            <Canvas>
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} />
                <mesh rotation={[0.5, 0.5, 0]}>
                    <boxGeometry />
                    <meshStandardMaterial color="white" wireframe />
                </mesh>
                <gridHelper args={[100, 100]} />
            </Canvas>
        </div>
    )
}

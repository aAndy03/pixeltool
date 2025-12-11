'use client'

import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { useState } from 'react'

export function Intro() {
    const [entered, setEntered] = useState(false)

    return (
        <motion.div
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm"
            initial={{ opacity: 1 }}
            animate={{ opacity: entered ? 0 : 1, pointerEvents: entered ? 'none' : 'auto' }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                transition={{ duration: 1.2, ease: "circOut" }}
                className="text-center space-y-6"
            >
                <h1 className="text-7xl md:text-9xl font-black tracking-tighter text-foreground drop-shadow-2xl">
                    PixelTool
                </h1>
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="text-xl md:text-2xl text-muted-foreground font-light tracking-[0.5em] uppercase"
                >
                    2025.A.10alpha
                </motion.p>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.5, duration: 0.8 }}
                className="mt-16"
            >
                <button
                    onClick={() => setEntered(true)}
                    className="group flex items-center gap-3 px-8 py-4 text-base font-medium transition-all duration-300 hover:text-foreground text-muted-foreground border border-white/5 hover:border-white/20 hover:bg-white/5 rounded-full"
                >
                    Enter Workspace <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </button>
            </motion.div>
        </motion.div>
    )
}

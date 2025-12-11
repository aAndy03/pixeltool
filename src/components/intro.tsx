'use client'

import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { useState } from 'react'

export function Intro() {
    const [entered, setEntered] = useState(false)

    return (
        <motion.div
            className="fixed inset-0 z-50 overflow-y-auto bg-background/95 backdrop-blur-sm"
            initial={{ opacity: 1 }}
            animate={{ opacity: entered ? 0 : 1, pointerEvents: entered ? 'none' : 'auto' }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
        >
            <div className="min-h-screen flex flex-col items-center justify-center p-4">
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
                    <div className="mt-8 text-center text-xs text-white/20 animate-pulse">
                        Scroll for more info
                    </div>
                </motion.div>
            </div>

            {/* Scrollable Content Section */}
            <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="max-w-4xl mx-auto pb-32 space-y-32 px-6"
            >
                {/* Why Section */}
                <section className="space-y-8">
                    <h2 className="text-4xl font-bold tracking-tight text-white/90">Why PixelTool?</h2>
                    <div className="grid md:grid-cols-2 gap-12 text-lg text-white/60 leading-relaxed">
                        <p>
                            I built this app because I need spatial context while I design in Affinity.
                        </p>
                    </div>
                </section>

                {/* Controls Section */}
                <section className="space-y-12">
                    <h2 className="text-4xl font-bold tracking-tight text-white/90">Controls</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Mouse */}
                        <div className="bg-white/5 rounded-xl p-8 border border-white/10 space-y-6">
                            <h3 className="text-xl font-semibold text-white/80">Mouse & Keyboard</h3>
                            <ul className="space-y-4 text-sm text-white/60">
                                <li className="flex justify-between items-center pb-2 border-b border-white/5">
                                    <span>Pan Canvas</span>
                                    <span className="font-mono text-white/90 bg-white/10 px-2 py-0.5 rounded">RMB / Space + Drag</span>
                                </li>
                                <li className="flex justify-between items-center pb-2 border-b border-white/5">
                                    <span>Zoom</span>
                                    <span className="font-mono text-white/90 bg-white/10 px-2 py-0.5 rounded">Scroll Wheel</span>
                                </li>
                                <li className="flex justify-between items-center pb-2 border-b border-white/5">
                                    <span>Select Artboard</span>
                                    <span className="font-mono text-white/90 bg-white/10 px-2 py-0.5 rounded">Click</span>
                                </li>
                                <li className="flex justify-between items-center pb-2 border-b border-white/5">
                                    <span>Multi-Select</span>
                                    <span className="font-mono text-white/90 bg-white/10 px-2 py-0.5 rounded">Shift + Click</span>
                                </li>
                                <li className="flex justify-between items-center">
                                    <span>Snap-Free Drag</span>
                                    <span className="font-mono text-white/90 bg-white/10 px-2 py-0.5 rounded">Alt + Drag</span>
                                </li>
                            </ul>
                        </div>

                        {/* Touch */}
                        <div className="bg-white/5 rounded-xl p-8 border border-white/10 space-y-6">
                            <h3 className="text-xl font-semibold text-white/80">Touchpad / Touch</h3>
                            <ul className="space-y-4 text-sm text-white/60">
                                <li className="flex justify-between items-center pb-2 border-b border-white/5">
                                    <span>Pan Canvas</span>
                                    <span className="font-mono text-white/90 bg-white/10 px-2 py-0.5 rounded">2 Finger Drag</span>
                                </li>
                                <li className="flex justify-between items-center pb-2 border-b border-white/5">
                                    <span>Zoom</span>
                                    <span className="font-mono text-white/90 bg-white/10 px-2 py-0.5 rounded">Pinch</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </section>

                <div className="text-center pt-20">
                    <button
                        onClick={() => setEntered(true)}
                        className="px-12 py-4 text-lg font-bold bg-white text-black rounded-full hover:scale-105 transition-transform"
                    >
                        Start Creating
                    </button>
                </div>
            </motion.div>
        </motion.div>
    )
}

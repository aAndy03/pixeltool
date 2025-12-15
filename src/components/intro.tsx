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
                        2025.A.14alpha
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
                        <p>
                            The tool that gives you context for your digital projects.
                        </p>
                        <p>
                            Could be used as convertor between the supported metrics.
                            <span className="flex gap-2 flex-wrap mt-2">
                                {['mm', 'cm', 'm', 'px', 'inch'].map(unit => (
                                    <span key={unit} className="text-xs bg-white/10 px-2 py-0.5 rounded-full font-mono text-white/50 border border-white/5">
                                        {unit}
                                    </span>
                                ))}
                            </span>
                        </p>
                        <p>
                            Built using Antigravity - Gemini 3 Pro (High) and Claude Opus 4.5 (Thinking)
                        </p>
                    </div>
                </section>

                {/* Visual Demo Section */}
                <section className="relative overflow-hidden rounded-3xl bg-neutral-900/50 border border-white/10 p-12">
                    <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:32px_32px]" />
                    <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
                        <div className="space-y-6">
                            <h2 className="text-3xl font-bold tracking-tight text-white/90">
                                Visualize & Reference
                            </h2>
                            <p className="text-lg text-white/60 leading-relaxed">
                                Bring your reference images directly into the workspace.
                                Organize artboards and references side-by-side with
                                infinite canvas freedom.
                            </p>
                            <p className="text-xs text-white/30">
                                Photo by <a href="https://unsplash.com/@mcgilllibrary?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">McGill Library</a> on <a href="https://unsplash.com/photos/man-in-black-suit-holding-rifle-illustration-V1IjTXINee0?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Unsplash</a>
                            </p>
                        </div>

                        {/* CSS Graphic: Interactive Canvas Mockup */}
                        <div className="relative h-[300px] w-full perspective-[1000px] group">
                            {/* Floating "Reference Layer" */}
                            <div className="absolute top-4 right-12 z-20 w-48 h-64 border-2 border-emerald-500/50 bg-emerald-500/10 rounded-lg backdrop-blur-sm transform rotate-6 transition-transform duration-700 ease-out group-hover:rotate-12 group-hover:translate-x-4">
                                <div className="absolute top-0 left-0 bg-emerald-500/80 text-black text-[10px] font-bold px-2 py-0.5 rounded-br-lg">
                                    Reference
                                </div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-16 h-16 rounded-full border border-emerald-500/30 flex items-center justify-center">
                                        <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                                    </div>
                                </div>
                                {/* Measurement Arrow (Vertical) */}
                                <div className="absolute -right-4 top-0 bottom-0 w-px bg-emerald-500/30 flex flex-col justify-between items-center py-2">
                                    <div className="w-1 h-px bg-emerald-500" />
                                    <span className="text-[8px] text-emerald-500 font-mono rotate-90 whitespace-nowrap">210 mm</span>
                                    <div className="w-1 h-px bg-emerald-500" />
                                </div>
                            </div>

                            {/* "Artboard" with Image */}
                            <div className="absolute top-12 left-8 z-10 w-64 h-48 bg-white rounded-lg shadow-2xl transform -rotate-3 transition-transform duration-700 ease-out group-hover:-rotate-6 group-hover:-translate-x-4 overflow-hidden border border-white/10">
                                <div className="absolute top-0 left-0 right-0 h-6 bg-neutral-100 border-b border-neutral-200 flex items-center px-2 gap-1">
                                    <div className="w-2 h-2 rounded-full bg-red-400" />
                                    <div className="w-2 h-2 rounded-full bg-yellow-400" />
                                    <div className="w-2 h-2 rounded-full bg-green-400" />
                                </div>
                                <img
                                    src="https://images.unsplash.com/photo-1584448141569-69f342da535c?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8cG9zdGVyfGVufDB8fDB8fHww"
                                    alt="Artboard Content"
                                    className="w-full h-full object-cover mt-6"
                                />
                                <div className="absolute bottom-2 right-2 bg-black/50 text-white text-[10px] px-2 py-0.5 rounded backdrop-blur-md">
                                    Artboard 1
                                </div>

                                {/* Measurement Arrow (Horizontal) */}
                                <div className="absolute bottom-8 left-4 right-4 h-px bg-blue-500/50 flex justify-between items-center px-0.5">
                                    <div className="h-1 w-px bg-blue-500" />
                                    <div className="bg-blue-500/10 text-blue-600 text-[8px] px-1 rounded font-mono font-bold">1920 px</div>
                                    <div className="h-1 w-px bg-blue-500" />
                                </div>
                            </div>
                        </div>
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

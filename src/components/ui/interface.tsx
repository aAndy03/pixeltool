'use client'
import { useUIStore } from '@/lib/store/ui-store'
import { useProjectStore } from '@/lib/store/project-store'
import { Menu, LogOut, User as UserIcon, ChevronLeft } from 'lucide-react'
import { useState } from 'react'
import { type User } from '@supabase/supabase-js'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { signout } from '@/app/auth/actions'
import { ArtboardPopover } from '../interface/artboard-popover'
import { LayerPanel } from '../interface/layer-panel'
import { PropertiesPanel } from '../interface/properties-panel'
import { GridPanel } from '../interface/grid-panel'
import { useSync } from '@/lib/sync/sync-engine'
import { useRouter } from 'next/navigation'

interface InterfaceProps {
    user: User | null
}

export function Interface({ user }: InterfaceProps) {
    const { openLogin, openSignup } = useUIStore()
    const { currentProject, setCurrentProject } = useProjectStore()
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const router = useRouter()

    // Start background sync if project is active
    useSync(currentProject?.id || '')

    const handleBackToProjects = () => {
        setCurrentProject(null as any)
        router.replace('/')
    }

    return (
        <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between p-6">

            {/* Vignette for Top Bar Visibility */}
            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/80 to-transparent -z-10" />

            {/* Top Bar */}
            <header className="flex items-center justify-between w-full pointer-events-auto">
                <div className="flex items-center gap-4">
                    {/* Back to Projects */}
                    {currentProject && (
                        <button
                            onClick={handleBackToProjects}
                            className="p-1 hover:bg-white/10 rounded-md transition-colors text-white/50 hover:text-white mr-1"
                            title="Back to Projects"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                    )}

                    <div className="text-2xl font-black tracking-tighter mix-blend-difference text-white">PixelTool</div>

                    {currentProject ? (
                        <span className="px-2 py-0.5 text-xs border border-white/20 rounded-full text-white/50">{currentProject.name}</span>
                    ) : (
                        <span className="px-2 py-0.5 text-xs border border-white/20 rounded-full text-white/50">2025.A.11alpha</span>
                    )}

                    <div className="h-6 w-px bg-white/10 mx-2" />

                    <ArtboardPopover />
                </div>

                <div className="flex items-center gap-3">
                    {user ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="outline-none rounded-full ring-offset-2 focus:ring-2 ring-white/20 transition-all hover:scale-105 active:scale-95">
                                    <Avatar className="h-9 w-9 border border-white/10">
                                        <AvatarImage src={user.user_metadata?.avatar_url} alt={user.user_metadata?.full_name || 'User'} />
                                        <AvatarFallback className="bg-white/10 text-white/80">
                                            {user.user_metadata?.full_name?.slice(0, 2).toUpperCase() || 'U'}
                                        </AvatarFallback>
                                    </Avatar>
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56 bg-black/90 backdrop-blur border-white/10 text-white">
                                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                                <DropdownMenuSeparator className="bg-white/10" />
                                <DropdownMenuItem className="focus:bg-white/10 focus:text-white cursor-pointer group">
                                    <UserIcon className="mr-2 h-4 w-4 opacity-70 group-hover:opacity-100" />
                                    <span>Profile</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    className="focus:bg-red-500/20 focus:text-red-400 text-red-400 cursor-pointer group"
                                    onClick={() => signout()}
                                >
                                    <LogOut className="mr-2 h-4 w-4 opacity-70 group-hover:opacity-100" />
                                    <span>Log out</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <>
                            <button
                                onClick={openLogin}
                                className="px-5 py-2 text-sm font-medium text-white/70 hover:text-white transition-colors"
                            >
                                Log In
                            </button>
                            <button
                                onClick={openSignup}
                                className="px-5 py-2 text-sm font-medium bg-white text-black hover:bg-white/90 rounded-full transition-transform hover:scale-105 active:scale-95"
                            >
                                Sign Up
                            </button>
                        </>
                    )}

                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="p-2 ml-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                </div>
            </header>

            {/* Layer Panel */}
            {currentProject && (
                <>
                    <LayerPanel />
                    <div className="absolute right-6 top-24 bottom-20 pointer-events-auto">
                        <PropertiesPanel />
                    </div>
                </>
            )}

            {/* Bottom Bar / Tools Placeholder */}
            <footer className="flex items-center justify-center w-full pointer-events-auto text-white/30 text-sm">
                {/* Tools will go here */}
            </footer>

            {/* Grid & Zoom Controls */}
            {currentProject && (
                <div className="absolute right-6 bottom-6 pointer-events-auto">
                    <GridPanel />
                </div>
            )}
        </div>
    )
}

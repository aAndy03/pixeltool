'use client'

import { useEffect, useState } from 'react'
import { Folder, Clock, MoreVertical } from 'lucide-react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useProjectStore } from '@/lib/store/project-store'
import { CreateProjectPopover } from './create-project-popover'
import { formatDistanceToNow } from 'date-fns'
import { useArtboardStore } from '@/lib/store/artboard-store'

export function ProjectDashboard() {
    const { projects, loadProjects, setCurrentProject, deleteProject, isLoading, currentProject } = useProjectStore()
    const { loadArtboards } = useArtboardStore()

    useEffect(() => {
        loadProjects()
    }, [loadProjects])

    const handleOpenProject = async (project: any) => {
        setCurrentProject(project)
        await loadArtboards(project.id)
    }

    // Hide dashboard if inside a project
    if (currentProject) return null

    return (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/80 backdrop-blur-xl p-4 md:p-8">
            <Card className="w-full max-w-5xl h-[80vh] bg-black/40 border-white/10 flex flex-col shadow-2xl">
                <CardHeader className="flex flex-row items-center justify-between border-b border-white/10 pb-4">
                    <div>
                        <CardTitle className="text-2xl font-bold text-white">My Projects</CardTitle>
                        <CardDescription className="text-muted-foreground">
                            Manage your cinematic scale workspaces.
                        </CardDescription>
                    </div>
                    <CreateProjectPopover />
                </CardHeader>

                <CardContent className="flex-1 p-0 overflow-hidden">
                    <ScrollArea className="h-full p-6">
                        {isLoading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="h-48 rounded-xl bg-white/5 animate-pulse" />
                                ))}
                            </div>
                        ) : projects.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-20 opacity-50">
                                <Folder className="w-16 h-16 stroke-1" />
                                <p className="text-lg font-medium">No projects found</p>
                                <div className="text-sm"><CreateProjectPopover /></div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {projects.map((project) => (
                                    <Card
                                        key={project.id}
                                        className="bg-white/5 border-white/5 hover:bg-white/10 transition-colors cursor-pointer group"
                                        onClick={() => handleOpenProject(project)}
                                    >
                                        <CardHeader className="flex flex-row items-start justify-between pb-2">
                                            <Folder className="w-8 h-8 text-white/50 group-hover:text-white transition-colors stroke-1" />
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-white/50 hover:text-white">
                                                        <MoreVertical className="w-4 h-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="bg-black/90 border-white/10 text-white">
                                                    <DropdownMenuItem onClick={(e) => e.stopPropagation()}>Settings</DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            deleteProject(project.id)
                                                        }}
                                                        className="text-red-400 focus:text-red-300 focus:bg-red-500/20"
                                                    >
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </CardHeader>
                                        <CardContent>
                                            <CardTitle className="text-lg text-white mb-1 group-hover:underline decoration-white/30 underline-offset-4">{project.name}</CardTitle>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <Clock className="w-3 h-3" />
                                                Updated {formatDistanceToNow(new Date(project.updated_at), { addSuffix: true })}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    )
}

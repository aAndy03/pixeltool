'use client'

import { useState, useTransition } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useProjectStore } from '@/lib/store/project-store'

interface CreateProjectModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function CreateProjectModal({ open, onOpenChange }: CreateProjectModalProps) {
    const { createNewProject } = useProjectStore()
    const [name, setName] = useState('')
    const [unit, setUnit] = useState('mm')
    const [isPending, startTransition] = useTransition()

    const handleCreate = () => {
        if (!name) return

        startTransition(async () => {
            // We can extend createNewProject to accept settings like unit
            await createNewProject(name)
            onOpenChange(false)
            setName('')
        })
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md bg-background/95 backdrop-blur border-white/10 text-foreground">
                <DialogHeader>
                    <DialogTitle>Create New Project</DialogTitle>
                    <DialogDescription>
                        Set up your workspace for real-life scale Design.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Project Name</Label>
                        <Input
                            id="name"
                            placeholder="e.g., Living Room Retouch"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="bg-white/5 border-white/10"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="unit">Base Unit</Label>
                        <Select value={unit} onValueChange={setUnit}>
                            <SelectTrigger className="bg-white/5 border-white/10">
                                <SelectValue placeholder="Select unit" />
                            </SelectTrigger>
                            <SelectContent className="bg-background border-white/10">
                                <SelectItem value="mm">Millimeters (mm)</SelectItem>
                                <SelectItem value="cm">Centimeters (cm)</SelectItem>
                                <SelectItem value="m">Meters (m)</SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-[0.8rem] text-muted-foreground">
                            You can cycle through units anytime in the workspace.
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} className="border-white/10 hover:bg-white/5 hover:text-white">
                        Cancel
                    </Button>
                    <Button onClick={handleCreate} disabled={!name || isPending} className="bg-white text-black hover:bg-white/90">
                        {isPending ? 'Creating...' : 'Create Project'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

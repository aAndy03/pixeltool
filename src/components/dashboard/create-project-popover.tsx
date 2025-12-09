'use client'

import { useState, useTransition } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useProjectStore } from '@/lib/store/project-store'
import { Plus } from 'lucide-react'

export function CreateProjectPopover() {
    const { createNewProject } = useProjectStore()
    const [name, setName] = useState('')
    const [unit, setUnit] = useState('mm')
    const [isPending, startTransition] = useTransition()
    const [open, setOpen] = useState(false)

    const handleCreate = () => {
        if (!name) return

        startTransition(async () => {
            // We can extend createNewProject to accept settings like unit
            await createNewProject(name)
            setOpen(false)
            setName('')
        })
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button className="bg-white text-black hover:bg-white/90 gap-2">
                    <Plus className="w-4 h-4" /> New Project
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 bg-background/95 backdrop-blur border-white/10 text-foreground p-4" align="end">
                <div className="grid gap-4">
                    <div className="space-y-2">
                        <h4 className="font-medium leading-none">New Project</h4>
                        <p className="text-sm text-muted-foreground">Start a new workspace.</p>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="name" className="text-xs">Project Name</Label>
                        <Input
                            id="name"
                            placeholder="My Project"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="h-8 bg-white/5 border-white/10"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="unit" className="text-xs">Base Unit</Label>
                        <Select value={unit} onValueChange={setUnit}>
                            <SelectTrigger className="h-8 bg-white/5 border-white/10 text-xs">
                                <SelectValue placeholder="Select unit" />
                            </SelectTrigger>
                            <SelectContent className="bg-background border-white/10">
                                <SelectItem value="mm">Millimeters (mm)</SelectItem>
                                <SelectItem value="cm">Centimeters (cm)</SelectItem>
                                <SelectItem value="m">Meters (m)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <Button onClick={handleCreate} disabled={!name || isPending} className="h-8 w-full bg-white text-black hover:bg-white/90">
                        {isPending ? 'Creating...' : 'Create Project'}
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    )
}

'use client'

import { useUIStore } from '@/lib/store/ui-store'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useState, useTransition } from 'react'
import { login, signup } from '@/app/auth/actions'
import { toast } from 'sonner' // Assuming sonner is standard or I use alert for now. Shadcn usually installs sonner/toaster but I didn't add it. I'll use simple alert/state for error.

export function AuthModals() {
    const { isLoginOpen, isSignupOpen, closeLogin, closeSignup, openLogin, openSignup } = useUIStore()
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)
    const [message, setMessage] = useState<string | null>(null)

    // Login Handler
    const handleLogin = async (formData: FormData) => {
        setError(null)
        startTransition(async () => {
            const res = await login(formData)
            if (res.error) {
                setError(res.error)
            } else {
                closeLogin()
                // Optionally refresh or show success
            }
        })
    }

    // Signup Handler
    const handleSignup = async (formData: FormData) => {
        setError(null)
        setMessage(null)
        startTransition(async () => {
            const res = await signup(formData)
            if (res.error) {
                setError(res.error)
            } else {
                setMessage(res.message || 'Success')
                // Optionally switch to login or keep open
            }
        })
    }

    return (
        <>
            {/* Login Modal */}
            <Dialog open={isLoginOpen} onOpenChange={(open) => !open && closeLogin()}>
                <DialogContent className="sm:max-w-md bg-background/95 backdrop-blur border-white/10 text-foreground">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold">Welcome Back</DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            Enter your credentials to access your workspace.
                        </DialogDescription>
                    </DialogHeader>

                    <form action={handleLogin} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" name="email" type="email" placeholder="m@example.com" required className="bg-white/5 border-white/10" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input id="password" name="password" type="password" required className="bg-white/5 border-white/10" />
                        </div>

                        {error && <p className="text-sm text-red-500">{error}</p>}

                        <div className="flex flex-col gap-2 pt-2">
                            <Button type="submit" disabled={isPending} className="w-full">
                                {isPending ? 'Logging in...' : 'Log In'}
                            </Button>
                            <div className="text-center text-sm text-muted-foreground">
                                Don't have an account? <button type="button" onClick={openSignup} className="text-white hover:underline">Sign up</button>
                            </div>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Signup Modal */}
            <Dialog open={isSignupOpen} onOpenChange={(open) => !open && closeSignup()}>
                <DialogContent className="sm:max-w-md bg-background/95 backdrop-blur border-white/10 text-foreground">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold">Create Account</DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            Join PixelTool to start creating cinematic scale projects.
                        </DialogDescription>
                    </DialogHeader>

                    <form action={handleSignup} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="fullName">Full Name</Label>
                            <Input id="fullName" name="fullName" type="text" placeholder="John Doe" required className="bg-white/5 border-white/10" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" name="email" type="email" placeholder="m@example.com" required className="bg-white/5 border-white/10" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input id="password" name="password" type="password" required className="bg-white/5 border-white/10" />
                        </div>

                        {error && <p className="text-sm text-red-500">{error}</p>}
                        {message && <p className="text-sm text-green-500">{message}</p>}

                        <div className="flex flex-col gap-2 pt-2">
                            <Button type="submit" disabled={isPending} className="w-full">
                                {isPending ? 'Creating Account...' : 'Sign Up'}
                            </Button>
                            <div className="text-center text-sm text-muted-foreground">
                                Already have an account? <button type="button" onClick={openLogin} className="text-white hover:underline">Log in</button>
                            </div>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    )
}

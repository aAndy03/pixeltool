import { Scene } from "@/components/canvas/Scene"
import { Intro } from "@/components/intro"
import { Interface } from "@/components/ui/interface"
import { AuthModals } from "@/components/auth/auth-modals"
import { createClient } from "@/lib/supabase/server"

import { ProjectDashboard } from "@/components/dashboard/project-dashboard"

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <main className="relative w-full h-screen overflow-hidden bg-background text-foreground">
      <Scene />
      <ProjectDashboard />
      <Interface user={user} />
      <Intro />
      <AuthModals />
    </main>
  );
}

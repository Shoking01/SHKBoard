"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { WorkspaceList } from "@/components/workspace/workspace-list"

// Tipos para los workspaces
interface Workspace {
  id: string
  name: string
  createdAt: string
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push("/login")
      } else {
        setUser(user)
        // En una app real, cargarías los workspaces del usuario aquí
        setWorkspaces([
          {
            id: "1",
            name: "Personal Projects",
            createdAt: new Date().toISOString(),
          },
          {
            id: "2",
            name: "Work Team",
            createdAt: new Date().toISOString(),
          },
        ])
      }
      setLoading(false)
    }
    getUser()
  }, [router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <div className="flex items-center gap-4">
            <p className="text-sm text-gray-600">{user?.email}</p>
            <Button variant="outline" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </header>
      <main className="p-6">
        <div className="max-w-7xl mx-auto">
          <WorkspaceList initialWorkspaces={workspaces} />
        </div>
      </main>
    </div>
  )
}

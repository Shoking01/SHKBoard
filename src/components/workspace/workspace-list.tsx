"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { WorkspaceForm } from "./workspace-form"
import { deleteWorkspace } from "@/actions/workspace"

interface Workspace {
  id: string
  name: string
  createdAt: string
}

interface WorkspaceListProps {
  initialWorkspaces: Workspace[]
}

export function WorkspaceList({ initialWorkspaces }: WorkspaceListProps) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>(initialWorkspaces)
  const [showForm, setShowForm] = useState(false)
  const [editingWorkspace, setEditingWorkspace] = useState<Workspace | null>(null)

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this workspace?")) return
    
    const result = await deleteWorkspace(id)
    if (result.success) {
      setWorkspaces(workspaces.filter(w => w.id !== id))
    } else {
      alert(result.message || "Failed to delete workspace")
    }
  }

  const handleEdit = (workspace: Workspace) => {
    setEditingWorkspace(workspace)
    setShowForm(true)
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingWorkspace(null)
  }

  const handleSuccess = () => {
    // Refresh workspaces - in a real app, you'd fetch from server
    setShowForm(false)
    setEditingWorkspace(null)
    // For demo purposes, we'll just reload the page
    window.location.reload()
  }

  if (showForm) {
    return (
      <div className="space-y-6">
        <WorkspaceForm 
          workspace={editingWorkspace || undefined} 
          onCancel={handleCancel} 
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Your Workspaces</h2>
          <p className="text-gray-600">Manage your workspaces and boards</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          Create Workspace
        </Button>
      </div>

      {workspaces.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No workspaces yet</CardTitle>
            <CardDescription>
              Create your first workspace to get started
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setShowForm(true)}>
              Create Workspace
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workspaces.map((workspace) => (
            <Card key={workspace.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg">{workspace.name}</CardTitle>
                <CardDescription>
                  Created {new Date(workspace.createdAt).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-between">
                <Button variant="outline" onClick={() => handleEdit(workspace)}>
                  Edit
                </Button>
                <Button variant="destructive" onClick={() => handleDelete(workspace.id)}>
                  Delete
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

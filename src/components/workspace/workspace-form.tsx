"use client"

import { useState, useTransition } from "react"
import { useFormState } from "react-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { createWorkspace, updateWorkspace, WorkspaceFormState } from "@/actions/workspace"

interface WorkspaceFormProps {
  workspace?: {
    id: string
    name: string
  }
  onCancel?: () => void
}

const initialState: WorkspaceFormState = {
  message: "",
  success: false,
  errors: undefined
}

export function WorkspaceForm({ workspace, onCancel }: WorkspaceFormProps) {
  const [isPending, startTransition] = useTransition()
  
  // Función para manejar el submit con firma correcta para useFormState
  const handleSubmitAction = async (_: WorkspaceFormState, formData: FormData) => {
    if (workspace) {
      return updateWorkspace(workspace.id, formData)
    } else {
      return createWorkspace(formData)
    }
  }

  const [state, dispatch] = useFormState(handleSubmitAction, initialState)
  const [name, setName] = useState(workspace?.name || "")

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    formData.set('name', name)
    startTransition(() => {
      dispatch(formData)
    })
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{workspace ? "Edit Workspace" : "Create Workspace"}</CardTitle>
        <CardDescription>
          {workspace 
            ? "Update your workspace details" 
            : "Create a new workspace to organize your boards"}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {state.errors?.general && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
              {state.errors.general}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="name">Workspace Name</Label>
            <Input
              id="name"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Workspace"
              required
              disabled={isPending}
            />
            {state.errors?.name && (
              <p className="text-sm text-red-600">{state.errors.name[0]}</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving..." : workspace ? "Update" : "Create"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}

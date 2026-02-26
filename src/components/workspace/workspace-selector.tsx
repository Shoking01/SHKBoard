import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Workspace {
  id: string
  name: string
}

export default function WorkspaceSelector() {
  const [workspaces] = useState<Workspace[]>([
    { id: "1", name: "Personal" },
    { id: "2", name: "Team Alpha" },
    { id: "3", name: "Project Beta" },
  ])
  
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace>(workspaces[0])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="font-normal">
          {selectedWorkspace.name}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {workspaces.map((workspace) => (
          <DropdownMenuItem
            key={workspace.id}
            onSelect={() => setSelectedWorkspace(workspace)}
          >
            {workspace.name}
          </DropdownMenuItem>
        ))}
        <DropdownMenuItem className="flex items-center justify-between">
          Create Workspace
          <span className="text-xs text-gray-500">⌘N</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

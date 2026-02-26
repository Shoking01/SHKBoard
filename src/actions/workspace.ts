'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getSupabaseServer } from '@/lib/supabase/client'

// Validación con Zod
const WorkspaceSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name must be less than 50 characters'),
})

export type WorkspaceFormState = {
  errors?: {
    name?: string[]
    general?: string
  }
  success?: boolean
  message?: string
}

export async function createWorkspace(formData: FormData): Promise<WorkspaceFormState> {
  // Verificar autenticación
  const supabase = getSupabaseServer()
  if (!supabase) {
    return {
      errors: {
        general: 'Server configuration error'
      }
    }
  }
  
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return {
      errors: {
        general: 'Authentication required'
      }
    }
  }

  // Validar datos
  const validatedFields = WorkspaceSchema.safeParse({
    name: formData.get('name'),
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      success: false,
      message: 'Validation failed'
    }
  }

  try {
    // Crear workspace
    const workspace = await prisma.workspace.create({
      data: {
        name: validatedFields.data.name,
        ownerId: user.id,
      },
    })

    revalidatePath('/dashboard')
    return {
      success: true,
      message: 'Workspace created successfully'
    }
  } catch (error) {
    return {
      errors: {
        general: 'Failed to create workspace'
      },
      success: false,
      message: 'Database error'
    }
  }
}

export async function updateWorkspace(id: string, formData: FormData): Promise<WorkspaceFormState> {
  // Verificar autenticación
  const supabase = getSupabaseServer()
  if (!supabase) {
    return {
      errors: {
        general: 'Server configuration error'
      }
    }
  }
  
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return {
      errors: {
        general: 'Authentication required'
      }
    }
  }

  // Validar datos
  const validatedFields = WorkspaceSchema.safeParse({
    name: formData.get('name'),
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      success: false,
      message: 'Validation failed'
    }
  }

  try {
    // Verificar permisos
    const workspace = await prisma.workspace.findUnique({
      where: { id },
    })

    if (!workspace || workspace.ownerId !== user.id) {
      return {
        errors: {
          general: 'Unauthorized'
        },
        success: false,
        message: 'You do not have permission to edit this workspace'
      }
    }

    // Actualizar workspace
    await prisma.workspace.update({
      where: { id },
      data: {
        name: validatedFields.data.name,
      },
    })

    revalidatePath('/dashboard')
    return {
      success: true,
      message: 'Workspace updated successfully'
    }
  } catch (error) {
    return {
      errors: {
        general: 'Failed to update workspace'
      },
      success: false,
      message: 'Database error'
    }
  }
}

export async function deleteWorkspace(id: string): Promise<WorkspaceFormState> {
  // Verificar autenticación
  const supabase = getSupabaseServer()
  if (!supabase) {
    return {
      errors: {
        general: 'Server configuration error'
      }
    }
  }
  
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return {
      errors: {
        general: 'Authentication required'
      }
    }
  }

  try {
    // Verificar permisos
    const workspace = await prisma.workspace.findUnique({
      where: { id },
    })

    if (!workspace || workspace.ownerId !== user.id) {
      return {
        errors: {
          general: 'Unauthorized'
        },
        success: false,
        message: 'You do not have permission to delete this workspace'
      }
    }

    // Eliminar workspace
    await prisma.workspace.delete({
      where: { id },
    })

    revalidatePath('/dashboard')
    return {
      success: true,
      message: 'Workspace deleted successfully'
    }
  } catch (error) {
    return {
      errors: {
        general: 'Failed to delete workspace'
      },
      success: false,
      message: 'Database error'
    }
  }
}

import { prisma } from '@/lib/prisma'

// Import Role from the generated client
import { Role } from '@/generated/client'

// Jerarquía de roles: cuanto más alto, más permisos
const ROLE_HIERARCHY: Record<Role, number> = {
  'OWNER': 3,
  'ADMIN': 2,
  'MEMBER': 1,
}

// Permisos por recurso
export enum Permission {
  // Workspace
  WORKSPACE_READ = 'workspace:read',
  WORKSPACE_UPDATE = 'workspace:update',
  WORKSPACE_DELETE = 'workspace:delete',
  WORKSPACE_MANAGE_MEMBERS = 'workspace:manage_members',
  
  // Board
  BOARD_CREATE = 'board:create',
  BOARD_READ = 'board:read',
  BOARD_UPDATE = 'board:update',
  BOARD_DELETE = 'board:delete',
  
  // Column
  COLUMN_CREATE = 'column:create',
  COLUMN_READ = 'column:read',
  COLUMN_UPDATE = 'column:update',
  COLUMN_DELETE = 'column:delete',
  
  // Task
  TASK_CREATE = 'task:create',
  TASK_READ = 'task:read',
  TASK_UPDATE = 'task:update',
  TASK_DELETE = 'task:delete',
  
  // Comment
  COMMENT_CREATE = 'comment:create',
  COMMENT_READ = 'comment:read',
  COMMENT_UPDATE = 'comment:update',
  COMMENT_DELETE = 'comment:delete',
}

// Mapeo de permisos mínimos requeridos por rol
const PERMISSION_REQUIREMENTS: Record<Permission, Role> = {
  // Workspace
  [Permission.WORKSPACE_READ]: 'MEMBER',
  [Permission.WORKSPACE_UPDATE]: 'ADMIN',
  [Permission.WORKSPACE_DELETE]: 'OWNER',
  [Permission.WORKSPACE_MANAGE_MEMBERS]: 'ADMIN',
  
  // Board
  [Permission.BOARD_CREATE]: 'ADMIN',
  [Permission.BOARD_READ]: 'MEMBER',
  [Permission.BOARD_UPDATE]: 'ADMIN',
  [Permission.BOARD_DELETE]: 'ADMIN',
  
  // Column
  [Permission.COLUMN_CREATE]: 'ADMIN',
  [Permission.COLUMN_READ]: 'MEMBER',
  [Permission.COLUMN_UPDATE]: 'ADMIN',
  [Permission.COLUMN_DELETE]: 'ADMIN',
  
  // Task
  [Permission.TASK_CREATE]: 'MEMBER',
  [Permission.TASK_READ]: 'MEMBER',
  [Permission.TASK_UPDATE]: 'MEMBER',
  [Permission.TASK_DELETE]: 'MEMBER',
  
  // Comment
  [Permission.COMMENT_CREATE]: 'MEMBER',
  [Permission.COMMENT_READ]: 'MEMBER',
  [Permission.COMMENT_UPDATE]: 'MEMBER',
  [Permission.COMMENT_DELETE]: 'MEMBER',
}

interface WorkspaceMembership {
  workspaceId: string
  userId: string
  role: Role
}

/**
 * Verifica si un usuario tiene acceso a un workspace
 */
export async function checkWorkspaceAccess(
  workspaceId: string,
  userId: string
): Promise<{ hasAccess: boolean; role: Role | null; membership: WorkspaceMembership | null }> {
  // Verificar si el usuario es el owner
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { ownerId: true },
  })
  
  if (!workspace) {
    return { hasAccess: false, role: null, membership: null }
  }
  
  // Si es owner, tiene acceso total
  if (workspace.ownerId === userId) {
    return { 
      hasAccess: true, 
      role: 'OWNER',
      membership: { workspaceId, userId, role: 'OWNER' }
    }
  }
  
  // Verificar membership
  const membership = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId,
        userId,
      },
    },
  })
  
  if (!membership) {
    return { hasAccess: false, role: null, membership: null }
  }
  
  return { 
    hasAccess: true, 
    role: membership.role,
    membership: {
      workspaceId: membership.workspaceId,
      userId: membership.userId,
      role: membership.role,
    }
  }
}

/**
 * Verifica si un usuario tiene un permiso específico
 */
export async function hasPermission(
  workspaceId: string,
  userId: string,
  permission: Permission
): Promise<boolean> {
  const { hasAccess, role } = await checkWorkspaceAccess(workspaceId, userId)
  
  if (!hasAccess || !role) {
    return false
  }
  
  const requiredRole = PERMISSION_REQUIREMENTS[permission]
  const userRoleLevel = ROLE_HIERARCHY[role]
  const requiredRoleLevel = ROLE_HIERARCHY[requiredRole]
  
  return userRoleLevel >= requiredRoleLevel
}

/**
 * Verifica múltiples permisos (todos deben cumplirse)
 */
export async function hasPermissions(
  workspaceId: string,
  userId: string,
  permissions: Permission[]
): Promise<boolean> {
  const results = await Promise.all(
    permissions.map(permission => hasPermission(workspaceId, userId, permission))
  )
  return results.every(result => result)
}

/**
 * Autoriza una operación o lanza error
 */
export async function authorize(
  workspaceId: string,
  userId: string,
  permission: Permission
): Promise<void> {
  const hasAccess = await hasPermission(workspaceId, userId, permission)
  
  if (!hasAccess) {
    throw new AuthorizationError(`No tienes permiso para realizar esta acción`)
  }
}

/**
 * Error de autorización personalizado
 */
export class AuthorizationError extends Error {
  constructor(message: string = 'No autorizado') {
    super(message)
    this.name = 'AuthorizationError'
  }
}

/**
 * Obtiene todos los workspaces accesibles por un usuario
 */
export async function getAccessibleWorkspaces(userId: string) {
  const ownedWorkspaces = await prisma.workspace.findMany({
    where: { ownerId: userId },
  })
  
  const memberWorkspaces = await prisma.workspace.findMany({
    where: {
      members: {
        some: { userId },
      },
    },
  })
  
  return [...ownedWorkspaces, ...memberWorkspaces]
}

/**
 * Verifica si un usuario puede modificar un recurso específico
 * (owner del recurso o admin/owner del workspace)
 */
export async function canModifyResource(
  workspaceId: string,
  userId: string,
  resourceOwnerId: string
): Promise<boolean> {
  const { role } = await checkWorkspaceAccess(workspaceId, userId)
  
  // Owner o Admin pueden modificar cualquier recurso
  if (role === 'OWNER' || role === 'ADMIN') {
    return true
  }
  
  // Member solo puede modificar sus propios recursos
  if (role === 'MEMBER' && resourceOwnerId === userId) {
    return true
  }
  
  return false
}

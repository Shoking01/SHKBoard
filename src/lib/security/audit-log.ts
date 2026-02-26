/**
 * Sistema de Auditoría de Seguridad
 * 
 * Registra eventos de seguridad relevantes para investigación
 */

import { prisma } from '@/lib/prisma'

// Tipos de eventos de seguridad
export enum AuditEventType {
  // Autenticación
  AUTH_LOGIN_SUCCESS = 'auth:login:success',
  AUTH_LOGIN_FAILURE = 'auth:login:failure',
  AUTH_LOGOUT = 'auth:logout',
  AUTH_REGISTER = 'auth:register',
  AUTH_PASSWORD_RESET = 'auth:password:reset',
  AUTH_SESSION_EXPIRED = 'auth:session:expired',
  
  // Autorización
  AUTHZ_ACCESS_DENIED = 'authz:access:denied',
  AUTHZ_PERMISSION_GRANTED = 'authz:permission:granted',
  
  // CRUD Workspaces
  WORKSPACE_CREATE = 'workspace:create',
  WORKSPACE_UPDATE = 'workspace:update',
  WORKSPACE_DELETE = 'workspace:delete',
  WORKSPACE_MEMBER_ADD = 'workspace:member:add',
  WORKSPACE_MEMBER_REMOVE = 'workspace:member:remove',
  WORKSPACE_MEMBER_ROLE_CHANGE = 'workspace:member:role:change',
  
  // CRUD Boards
  BOARD_CREATE = 'board:create',
  BOARD_UPDATE = 'board:update',
  BOARD_DELETE = 'board:delete',
  
  // CRUD Tasks
  TASK_CREATE = 'task:create',
  TASK_UPDATE = 'task:update',
  TASK_DELETE = 'task:delete',
  TASK_MOVE = 'task:move',
  
  // Rate Limiting
  RATE_LIMIT_EXCEEDED = 'rate:limit:exceeded',
  
  // Errores
  ERROR_UNAUTHORIZED = 'error:unauthorized',
  ERROR_FORBIDDEN = 'error:forbidden',
  ERROR_VALIDATION = 'error:validation',
}

// Severidad del evento
export enum AuditSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

// Interfaz para el log de auditoría
export interface AuditLogEntry {
  id: string
  timestamp: Date
  eventType: AuditEventType
  severity: AuditSeverity
  userId: string | null
  workspaceId: string | null
  resourceId: string | null
  ipAddress: string | null
  userAgent: string | null
  details: Record<string, unknown>
  success: boolean
}

// Mapeo de eventos a severidad
const EVENT_SEVERITY: Record<AuditEventType, AuditSeverity> = {
  [AuditEventType.AUTH_LOGIN_SUCCESS]: AuditSeverity.INFO,
  [AuditEventType.AUTH_LOGIN_FAILURE]: AuditSeverity.WARNING,
  [AuditEventType.AUTH_LOGOUT]: AuditSeverity.INFO,
  [AuditEventType.AUTH_REGISTER]: AuditSeverity.INFO,
  [AuditEventType.AUTH_PASSWORD_RESET]: AuditSeverity.WARNING,
  [AuditEventType.AUTH_SESSION_EXPIRED]: AuditSeverity.INFO,
  [AuditEventType.AUTHZ_ACCESS_DENIED]: AuditSeverity.WARNING,
  [AuditEventType.AUTHZ_PERMISSION_GRANTED]: AuditSeverity.INFO,
  [AuditEventType.WORKSPACE_CREATE]: AuditSeverity.INFO,
  [AuditEventType.WORKSPACE_UPDATE]: AuditSeverity.INFO,
  [AuditEventType.WORKSPACE_DELETE]: AuditSeverity.WARNING,
  [AuditEventType.WORKSPACE_MEMBER_ADD]: AuditSeverity.INFO,
  [AuditEventType.WORKSPACE_MEMBER_REMOVE]: AuditSeverity.WARNING,
  [AuditEventType.WORKSPACE_MEMBER_ROLE_CHANGE]: AuditSeverity.WARNING,
  [AuditEventType.BOARD_CREATE]: AuditSeverity.INFO,
  [AuditEventType.BOARD_UPDATE]: AuditSeverity.INFO,
  [AuditEventType.BOARD_DELETE]: AuditSeverity.WARNING,
  [AuditEventType.TASK_CREATE]: AuditSeverity.INFO,
  [AuditEventType.TASK_UPDATE]: AuditSeverity.INFO,
  [AuditEventType.TASK_DELETE]: AuditSeverity.INFO,
  [AuditEventType.TASK_MOVE]: AuditSeverity.INFO,
  [AuditEventType.RATE_LIMIT_EXCEEDED]: AuditSeverity.WARNING,
  [AuditEventType.ERROR_UNAUTHORIZED]: AuditSeverity.ERROR,
  [AuditEventType.ERROR_FORBIDDEN]: AuditSeverity.ERROR,
  [AuditEventType.ERROR_VALIDATION]: AuditSeverity.WARNING,
}

// Almacenamiento en memoria temporal (en producción usar base de datos)
const auditLogStore: AuditLogEntry[] = []
const MAX_LOG_ENTRIES = 10000

/**
 * Registra un evento de auditoría
 */
export async function logAuditEvent(
  eventType: AuditEventType,
  options: {
    userId?: string
    workspaceId?: string
    resourceId?: string
    ipAddress?: string
    userAgent?: string
    details?: Record<string, unknown>
    success?: boolean
  } = {}
): Promise<void> {
  const entry: AuditLogEntry = {
    id: generateLogId(),
    timestamp: new Date(),
    eventType,
    severity: EVENT_SEVERITY[eventType],
    userId: options.userId || null,
    workspaceId: options.workspaceId || null,
    resourceId: options.resourceId || null,
    ipAddress: options.ipAddress || null,
    userAgent: options.userAgent || null,
    details: options.details || {},
    success: options.success ?? true,
  }
  
  // Guardar en store temporal
  auditLogStore.unshift(entry)
  
  // Mantener solo los últimos MAX_LOG_ENTRIES
  if (auditLogStore.length > MAX_LOG_ENTRIES) {
    auditLogStore.length = MAX_LOG_ENTRIES
  }
  
  // En producción, aquí se guardaría en base de datos:
  // await prisma.auditLog.create({ data: entry })
  
  // Log en consola para desarrollo
  if (process.env.NODE_ENV === 'development') {
    console.log(`[AUDIT] ${entry.severity.toUpperCase()}: ${eventType}`, {
      userId: entry.userId,
      workspaceId: entry.workspaceId,
      details: entry.details,
    })
  }
}

/**
 * Obtiene logs de auditoría con filtros
 */
export async function getAuditLogs(
  filters: {
    userId?: string
    workspaceId?: string
    eventType?: AuditEventType
    severity?: AuditSeverity
    startDate?: Date
    endDate?: Date
    limit?: number
  } = {}
): Promise<AuditLogEntry[]> {
  let logs = [...auditLogStore]
  
  // Aplicar filtros
  if (filters.userId) {
    logs = logs.filter(log => log.userId === filters.userId)
  }
  
  if (filters.workspaceId) {
    logs = logs.filter(log => log.workspaceId === filters.workspaceId)
  }
  
  if (filters.eventType) {
    logs = logs.filter(log => log.eventType === filters.eventType)
  }
  
  if (filters.severity) {
    logs = logs.filter(log => log.severity === filters.severity)
  }
  
  if (filters.startDate) {
    logs = logs.filter(log => log.timestamp >= filters.startDate!)
  }
  
  if (filters.endDate) {
    logs = logs.filter(log => log.timestamp <= filters.endDate!)
  }
  
  // Limitar resultados
  const limit = filters.limit || 100
  return logs.slice(0, limit)
}

/**
 * Obtiene estadísticas de eventos de seguridad
 */
export async function getSecurityStats(
  workspaceId?: string,
  days: number = 30
): Promise<{
  totalEvents: number
  eventsByType: Record<string, number>
  eventsBySeverity: Record<string, number>
  failedLogins: number
  accessDenied: number
}> {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  
  let logs = auditLogStore.filter(log => log.timestamp >= startDate)
  
  if (workspaceId) {
    logs = logs.filter(log => log.workspaceId === workspaceId)
  }
  
  const eventsByType: Record<string, number> = {}
  const eventsBySeverity: Record<string, number> = {}
  let failedLogins = 0
  let accessDenied = 0
  
  logs.forEach(log => {
    eventsByType[log.eventType] = (eventsByType[log.eventType] || 0) + 1
    eventsBySeverity[log.severity] = (eventsBySeverity[log.severity] || 0) + 1
    
    if (log.eventType === AuditEventType.AUTH_LOGIN_FAILURE) {
      failedLogins++
    }
    if (log.eventType === AuditEventType.AUTHZ_ACCESS_DENIED) {
      accessDenied++
    }
  })
  
  return {
    totalEvents: logs.length,
    eventsByType,
    eventsBySeverity,
    failedLogins,
    accessDenied,
  }
}

/**
 * Genera un ID único para el log
 */
function generateLogId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Limpia logs antiguos (ejecutar periódicamente)
 */
export function cleanupOldAuditLogs(maxAgeDays: number = 90): void {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - maxAgeDays)
  
  const initialLength = auditLogStore.length
  
  // Eliminar logs antiguos
  for (let i = auditLogStore.length - 1; i >= 0; i--) {
    if (auditLogStore[i].timestamp < cutoffDate) {
      auditLogStore.splice(i, 1)
    }
  }
  
  console.log(`[AUDIT] Cleaned up ${initialLength - auditLogStore.length} old log entries`)
}

// Ejecutar cleanup cada 24 horas
setInterval(() => cleanupOldAuditLogs(), 24 * 60 * 60 * 1000)

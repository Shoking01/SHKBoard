/**
 * Rate Limiter - Sistema de limitación de peticiones
 * 
 * Implementación en memoria para desarrollo.
 * En producción, migrar a Redis o servicio externo.
 */

interface RateLimitEntry {
  count: number
  resetTime: number
}

interface RateLimitConfig {
  maxRequests: number
  windowMs: number
}

// Almacenamiento en memoria (en producción usar Redis)
const rateLimitStore = new Map<string, RateLimitEntry>()

// Configuración por defecto para diferentes endpoints
export const RATE_LIMIT_CONFIGS = {
  // Login: 5 intentos cada 15 minutos
  LOGIN: { maxRequests: 5, windowMs: 15 * 60 * 1000 },
  
  // Registro: 3 intentos cada hora
  REGISTER: { maxRequests: 3, windowMs: 60 * 60 * 1000 },
  
  // Server Actions: 100 requests por minuto
  API_DEFAULT: { maxRequests: 100, windowMs: 60 * 1000 },
  
  // Workspace CRUD: 30 requests por minuto
  WORKSPACE: { maxRequests: 30, windowMs: 60 * 1000 },
  
  // General: 60 requests por minuto
  GENERAL: { maxRequests: 60, windowMs: 60 * 1000 },
} as const

/**
 * Verifica si el request está dentro del límite
 * @param identifier - IP + endpoint o userId
 * @param config - Configuración de rate limiting
 * @returns { isAllowed: boolean, remaining: number, resetTime: number }
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = RATE_LIMIT_CONFIGS.GENERAL
): { isAllowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now()
  const entry = rateLimitStore.get(identifier)
  
  // Si no hay entrada o ya pasó el tiempo de reset
  if (!entry || now > entry.resetTime) {
    const newEntry: RateLimitEntry = {
      count: 1,
      resetTime: now + config.windowMs,
    }
    rateLimitStore.set(identifier, newEntry)
    
    return {
      isAllowed: true,
      remaining: config.maxRequests - 1,
      resetTime: newEntry.resetTime,
    }
  }
  
  // Si hay entrada activa
  if (entry.count >= config.maxRequests) {
    return {
      isAllowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
    }
  }
  
  // Incrementar contador
  entry.count++
  rateLimitStore.set(identifier, entry)
  
  return {
    isAllowed: true,
    remaining: config.maxRequests - entry.count,
    resetTime: entry.resetTime,
  }
}

/**
 * Limpia entradas expiradas del store (ejecutar periódicamente)
 */
export function cleanupRateLimitStore(): void {
  const now = Date.now()
  const keysToDelete: string[] = []
  
  rateLimitStore.forEach((entry, key) => {
    if (now > entry.resetTime) {
      keysToDelete.push(key)
    }
  })
  
  keysToDelete.forEach(key => rateLimitStore.delete(key))
}

/**
 * Obtiene el identificador único para rate limiting
 * En producción, usar IP real del request
 */
export function getRateLimitIdentifier(
  endpoint: string,
  userId?: string,
  ip?: string
): string {
  // Prioridad: userId > IP > 'anonymous'
  const id = userId || ip || 'anonymous'
  return `${endpoint}:${id}`
}

/**
 * Formatea el tiempo restante en mensaje legible
 */
export function formatResetTime(resetTime: number): string {
  const remainingMs = resetTime - Date.now()
  const remainingMinutes = Math.ceil(remainingMs / 60000)
  
  if (remainingMinutes < 1) {
    return 'menos de 1 minuto'
  } else if (remainingMinutes === 1) {
    return '1 minuto'
  } else {
    return `${remainingMinutes} minutos`
  }
}

// Limpiar store cada 5 minutos
setInterval(cleanupRateLimitStore, 5 * 60 * 1000)

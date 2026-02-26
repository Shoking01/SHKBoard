/**
 * Validador y Sanitizador de Input
 * 
 * Protección contra XSS, inyección SQL y otros ataques de input
 */

import { z } from 'zod'

// Patrones de ataque comunes
const XSS_PATTERNS = [
  /<script[^>]*>[\s\S]*?<\/script>/gi,
  /<iframe[^>]*>[\s\S]*?<\/iframe>/gi,
  /<object[^>]*>[\s\S]*?<\/object>/gi,
  /<embed[^>]*>[\s\S]*?<\/embed>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi, // Event handlers: onclick, onload, etc.
  /<[^>]+\s+(?:href|src|data)\s*=\s*["']?\s*javascript:/gi,
]

// Caracteres de control peligrosos
const DANGEROUS_CHARS = /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g

// SQL Injection patterns básicos
const SQL_INJECTION_PATTERNS = [
  /(\%27)|(\')|(\-\-)|(\%23)|(#)/gi,
  /((\%3D)|(=))[^\n]*((\%27)|(\')|(\-\-)|(\%3B)|(;))/gi,
  /\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|TRUNCATE)\b/gi,
]

// Esquemas Zod reutilizables
export const ValidationSchemas = {
  // Email
  email: z.string()
    .email('Email inválido')
    .min(5, 'Email demasiado corto')
    .max(254, 'Email demasiado largo')
    .transform(email => email.toLowerCase().trim()),
  
  // Nombre/Usuario
  name: z.string()
    .min(1, 'El nombre es requerido')
    .max(50, 'El nombre no puede tener más de 50 caracteres')
    .regex(/^[\w\s\-'.]+$/, 'El nombre contiene caracteres inválidos'),
  
  // ID (UUID o CUID)
  id: z.string()
    .min(1, 'ID requerido')
    .regex(/^[a-zA-Z0-9_-]+$/, 'ID inválido'),
  
  // Texto general
  text: z.string()
    .max(10000, 'Texto demasiado largo'),
  
  // Descripción/Tarea
  description: z.string()
    .max(10000, 'Descripción demasiado larga'),
  
  // Workspace/Board/Column name
  workspaceName: z.string()
    .min(1, 'El nombre es requerido')
    .max(100, 'El nombre no puede tener más de 100 caracteres')
    .regex(/^[\w\s\-'.]+$/, 'El nombre contiene caracteres inválidos'),
  
  // URL segura
  url: z.string()
    .url('URL inválida')
    .refine(url => {
      try {
        const parsed = new URL(url)
        return ['http:', 'https:'].includes(parsed.protocol)
      } catch {
        return false
      }
    }, 'Solo se permiten URLs HTTP/HTTPS'),
}

/**
 * Sanitiza un string removiendo código malicioso
 */
export function sanitizeString(input: string): string {
  if (!input || typeof input !== 'string') return ''
  
  let sanitized = input
    // Remover caracteres de control
    .replace(DANGEROUS_CHARS, '')
    // Remover tags HTML
    .replace(/<[^>]*>/g, '')
    // Escapar caracteres especiales HTML
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    // Normalizar espacios
    .trim()
  
  return sanitized
}

/**
 * Sanitiza HTML permitiendo solo tags seguros
 * Para campos que necesitan formato (como descripciones)
 */
export function sanitizeHtml(input: string): string {
  if (!input || typeof input !== 'string') return ''
  
  // Lista de tags permitidos
  const allowedTags = ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li', 'a']
  
  // Remover event handlers y javascript:
  let sanitized = input
    .replace(/on\w+\s*=/gi, '')
    .replace(/javascript:/gi, '')
    .replace(DANGEROUS_CHARS, '')
  
  // Remover tags no permitidos
  sanitized = sanitized.replace(/<(\/?)(\w+)[^>]*>/g, (match, closing, tag) => {
    if (allowedTags.includes(tag.toLowerCase())) {
      // Para links, asegurar que el href es seguro
      if (tag.toLowerCase() === 'a') {
        const hrefMatch = match.match(/href=["']([^"']+)["']/i)
        if (hrefMatch) {
          const href = hrefMatch[1]
          // Solo permitir URLs http/https o anclas
          if (!href.match(/^(https?:\/\/|#)/i)) {
            return ''
          }
        }
      }
      return match
    }
    return ''
  })
  
  return sanitized
}

/**
 * Detecta posible código malicioso
 */
export function detectMaliciousContent(input: string): { 
  isMalicious: boolean 
  threats: string[] 
} {
  const threats: string[] = []
  
  // Detectar XSS
  for (const pattern of XSS_PATTERNS) {
    if (pattern.test(input)) {
      threats.push('xss')
      break
    }
  }
  
  // Detectar SQL Injection
  for (const pattern of SQL_INJECTION_PATTERNS) {
    if (pattern.test(input)) {
      threats.push('sql-injection')
      break
    }
  }
  
  // Detectar path traversal
  if (/\.\.[\/\\]/.test(input) || /%2e%2e/i.test(input)) {
    threats.push('path-traversal')
  }
  
  // Detectar null bytes
  if (/\x00/.test(input)) {
    threats.push('null-byte')
  }
  
  return {
    isMalicious: threats.length > 0,
    threats,
  }
}

/**
 * Valida y sanitiza input de formulario
 */
export function validateAndSanitizeFormData<T extends Record<string, unknown>>(
  data: T,
  schema: z.ZodSchema<T>
): { 
  success: boolean 
  data?: T 
  errors?: string[] 
  sanitized?: Record<string, string>
} {
  try {
    // Validar con Zod
    const validated = schema.parse(data)
    
    // Sanitizar strings
    const sanitized: Record<string, string> = {}
    
    Object.entries(validated).forEach(([key, value]) => {
      if (typeof value === 'string') {
        // Detectar contenido malicioso
        const { isMalicious, threats } = detectMaliciousContent(value)
        
        if (isMalicious) {
          throw new Error(`Contenido malicioso detectado en campo ${key}: ${threats.join(', ')}`)
        }
        
        // Sanitizar
        sanitized[key] = sanitizeString(value)
      }
    })
    
    return { success: true, data: validated, sanitized }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.issues.map((issue: z.ZodIssue) => `${issue.path.join('.')}: ${issue.message}`)
      return { success: false, errors }
    }
    
    if (error instanceof Error) {
      return { success: false, errors: [error.message] }
    }
    
    return { success: false, errors: ['Error de validación desconocido'] }
  }
}

/**
 * Genera mensaje de error seguro (sin revelar información sensible)
 */
export function getSafeErrorMessage(error: unknown): string {
  if (error instanceof z.ZodError) {
    return 'Datos de entrada inválidos. Por favor, verifica la información.'
  }
  
  if (error instanceof Error) {
    // No revelar detalles técnicos
    if (error.message.includes('database') || error.message.includes('sql')) {
      return 'Error del servidor. Por favor, inténtalo más tarde.'
    }
    
    if (error.message.includes('malicioso')) {
      return 'El contenido contiene caracteres no permitidos.'
    }
    
    // Mensaje genérico para otros errores
    return 'Ocurrió un error. Por favor, inténtalo de nuevo.'
  }
  
  return 'Error desconocido. Por favor, inténtalo más tarde.'
}

/**
 * Valida que un ID sea seguro (previene NoSQL injection)
 */
export function isValidId(id: string): boolean {
  // Solo permitir caracteres alfanuméricos, guiones y guiones bajos
  return /^[a-zA-Z0-9_-]+$/.test(id)
}

/**
 * Escapa regex para búsquedas seguras
 */
export function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Sanitiza parámetros de búsqueda
 */
export function sanitizeSearchQuery(query: string): string {
  // Limitar longitud
  const limited = query.slice(0, 100)
  
  // Escapar regex
  const escaped = escapeRegex(limited)
  
  // Sanitizar string
  return sanitizeString(escaped)
}

/**
 * Verifica que un objeto no contenga propiedades inesperadas
 */
export function validateObjectShape<T extends object>(
  obj: unknown,
  allowedKeys: (keyof T)[]
): obj is T {
  if (!obj || typeof obj !== 'object') return false
  
  const objKeys = Object.keys(obj)
  return objKeys.every(key => allowedKeys.includes(key as keyof T))
}

// Exportar utilidades
export default {
  sanitizeString,
  sanitizeHtml,
  detectMaliciousContent,
  validateAndSanitizeFormData,
  getSafeErrorMessage,
  isValidId,
  escapeRegex,
  sanitizeSearchQuery,
  validateObjectShape,
  ValidationSchemas,
}

/**
 * Manejador de Errores Seguro
 * 
 * Asegura que no se filtre información sensible en mensajes de error
 */

import { logAuditEvent, AuditEventType, AuditSeverity } from './audit-log'

// Códigos de error internos (no visibles para el usuario)
export enum ErrorCode {
  // Errores de autenticación
  AUTH_INVALID_CREDENTIALS = 'AUTH_001',
  AUTH_SESSION_EXPIRED = 'AUTH_002',
  AUTH_UNAUTHORIZED = 'AUTH_003',
  AUTH_FORBIDDEN = 'AUTH_004',
  AUTH_RATE_LIMITED = 'AUTH_005',
  
  // Errores de validación
  VALIDATION_INVALID_INPUT = 'VAL_001',
  VALIDATION_MISSING_FIELD = 'VAL_002',
  VALIDATION_MALICIOUS_CONTENT = 'VAL_003',
  
  // Errores de base de datos
  DB_CONNECTION_ERROR = 'DB_001',
  DB_QUERY_ERROR = 'DB_002',
  DB_NOT_FOUND = 'DB_003',
  DB_UNIQUE_VIOLATION = 'DB_004',
  
  // Errores de negocio
  BUSINESS_RULE_VIOLATION = 'BIZ_001',
  RESOURCE_NOT_FOUND = 'BIZ_002',
  RESOURCE_ALREADY_EXISTS = 'BIZ_003',
  INSUFFICIENT_PERMISSIONS = 'BIZ_004',
  
  // Errores del servidor
  SERVER_INTERNAL_ERROR = 'SRV_001',
  SERVER_UNAVAILABLE = 'SRV_002',
  
  // Errores externos
  EXTERNAL_API_ERROR = 'EXT_001',
  EXTERNAL_TIMEOUT = 'EXT_002',
}

// Mapeo de errores técnicos a mensajes seguros
const ERROR_MESSAGES: Record<ErrorCode, { 
  userMessage: string 
  severity: AuditSeverity 
  logMessage: string 
}> = {
  [ErrorCode.AUTH_INVALID_CREDENTIALS]: {
    userMessage: 'Email o contraseña incorrectos',
    severity: AuditSeverity.WARNING,
    logMessage: 'Intento de login con credenciales inválidas',
  },
  [ErrorCode.AUTH_SESSION_EXPIRED]: {
    userMessage: 'Tu sesión ha expirado. Por favor, inicia sesión de nuevo',
    severity: AuditSeverity.INFO,
    logMessage: 'Sesión expirada',
  },
  [ErrorCode.AUTH_UNAUTHORIZED]: {
    userMessage: 'Debes iniciar sesión para acceder a este recurso',
    severity: AuditSeverity.WARNING,
    logMessage: 'Acceso no autorizado',
  },
  [ErrorCode.AUTH_FORBIDDEN]: {
    userMessage: 'No tienes permiso para realizar esta acción',
    severity: AuditSeverity.WARNING,
    logMessage: 'Acceso prohibido',
  },
  [ErrorCode.AUTH_RATE_LIMITED]: {
    userMessage: 'Demasiados intentos. Por favor, espera un momento',
    severity: AuditSeverity.WARNING,
    logMessage: 'Rate limit excedido',
  },
  
  [ErrorCode.VALIDATION_INVALID_INPUT]: {
    userMessage: 'Los datos proporcionados no son válidos',
    severity: AuditSeverity.WARNING,
    logMessage: 'Validación de input fallida',
  },
  [ErrorCode.VALIDATION_MISSING_FIELD]: {
    userMessage: 'Faltan campos requeridos',
    severity: AuditSeverity.WARNING,
    logMessage: 'Campo requerido faltante',
  },
  [ErrorCode.VALIDATION_MALICIOUS_CONTENT]: {
    userMessage: 'El contenido contiene caracteres no permitidos',
    severity: AuditSeverity.ERROR,
    logMessage: 'Contenido malicioso detectado',
  },
  
  [ErrorCode.DB_CONNECTION_ERROR]: {
    userMessage: 'Error del servidor. Por favor, inténtalo más tarde',
    severity: AuditSeverity.CRITICAL,
    logMessage: 'Error de conexión a base de datos',
  },
  [ErrorCode.DB_QUERY_ERROR]: {
    userMessage: 'Error del servidor. Por favor, inténtalo más tarde',
    severity: AuditSeverity.ERROR,
    logMessage: 'Error en consulta de base de datos',
  },
  [ErrorCode.DB_NOT_FOUND]: {
    userMessage: 'El recurso solicitado no existe',
    severity: AuditSeverity.INFO,
    logMessage: 'Recurso no encontrado en base de datos',
  },
  [ErrorCode.DB_UNIQUE_VIOLATION]: {
    userMessage: 'Ya existe un registro con estos datos',
    severity: AuditSeverity.WARNING,
    logMessage: 'Violación de constraint único',
  },
  
  [ErrorCode.BUSINESS_RULE_VIOLATION]: {
    userMessage: 'No se puede realizar esta acción',
    severity: AuditSeverity.WARNING,
    logMessage: 'Violación de regla de negocio',
  },
  [ErrorCode.RESOURCE_NOT_FOUND]: {
    userMessage: 'El recurso solicitado no existe',
    severity: AuditSeverity.INFO,
    logMessage: 'Recurso no encontrado',
  },
  [ErrorCode.RESOURCE_ALREADY_EXISTS]: {
    userMessage: 'Ya existe un recurso con estos datos',
    severity: AuditSeverity.WARNING,
    logMessage: 'Recurso duplicado',
  },
  [ErrorCode.INSUFFICIENT_PERMISSIONS]: {
    userMessage: 'No tienes permiso para realizar esta acción',
    severity: AuditSeverity.WARNING,
    logMessage: 'Permisos insuficientes',
  },
  
  [ErrorCode.SERVER_INTERNAL_ERROR]: {
    userMessage: 'Error interno del servidor. Por favor, inténtalo más tarde',
    severity: AuditSeverity.CRITICAL,
    logMessage: 'Error interno del servidor',
  },
  [ErrorCode.SERVER_UNAVAILABLE]: {
    userMessage: 'El servicio no está disponible. Por favor, inténtalo más tarde',
    severity: AuditSeverity.CRITICAL,
    logMessage: 'Servicio no disponible',
  },
  
  [ErrorCode.EXTERNAL_API_ERROR]: {
    userMessage: 'Error de servicio externo. Por favor, inténtalo más tarde',
    severity: AuditSeverity.ERROR,
    logMessage: 'Error en API externa',
  },
  [ErrorCode.EXTERNAL_TIMEOUT]: {
    userMessage: 'La operación tardó demasiado. Por favor, inténtalo más tarde',
    severity: AuditSeverity.WARNING,
    logMessage: 'Timeout en servicio externo',
  },
}

// Clase de error seguro
export class SecureError extends Error {
  code: ErrorCode
  errorId: string
  httpStatus: number
  details?: Record<string, unknown>
  cause?: Error
  
  constructor(
    code: ErrorCode,
    options: {
      httpStatus?: number
      details?: Record<string, unknown>
      cause?: Error
    } = {}
  ) {
    const errorInfo = ERROR_MESSAGES[code]
    super(errorInfo.logMessage)
    
    this.code = code
    this.errorId = generateErrorId()
    this.httpStatus = options.httpStatus || getDefaultHttpStatus(code)
    this.details = options.details
    this.cause = options.cause
    
    // Loggear el error
    this.logError()
  }
  
  /**
   * Obtiene el mensaje seguro para el usuario
   */
  getUserMessage(): string {
    return ERROR_MESSAGES[this.code].userMessage
  }
  
  /**
   * Obtiene la respuesta segura para el cliente
   */
  toResponse(): {
    success: false
    error: string
    errorId: string
  } {
    return {
      success: false,
      error: this.getUserMessage(),
      errorId: this.errorId,
    }
  }
  
  /**
   * Loggear el error
   */
  private async logError(): Promise<void> {
    const errorInfo = ERROR_MESSAGES[this.code]
    
    // Determinar tipo de evento de auditoría
    let eventType: AuditEventType
    
    if (this.code.startsWith('AUTH')) {
      eventType = AuditEventType.ERROR_UNAUTHORIZED
    } else if (this.code.startsWith('DB')) {
      eventType = AuditEventType.ERROR_VALIDATION
    } else {
      eventType = AuditEventType.ERROR_VALIDATION
    }
    
    // Loggear en auditoría
    await logAuditEvent(eventType, {
      details: {
        errorCode: this.code,
        errorId: this.errorId,
        message: this.message,
        ...(this.details || {}),
      },
      success: false,
    })
    
    // Loggear en consola (solo en desarrollo)
    if (process.env.NODE_ENV === 'development') {
      console.error(`[ERROR ${this.code}] ${this.errorId}:`, {
        message: this.message,
        details: this.details,
        cause: this.cause,
      })
    }
  }
}

/**
 * Genera un ID único para el error
 */
function generateErrorId(): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substr(2, 5)
  return `ERR-${timestamp}-${random}`.toUpperCase()
}

/**
 * Obtiene el status HTTP por defecto según el código de error
 */
function getDefaultHttpStatus(code: ErrorCode): number {
  if (code.startsWith('AUTH')) {
    if (code === ErrorCode.AUTH_UNAUTHORIZED) return 401
    if (code === ErrorCode.AUTH_FORBIDDEN) return 403
    if (code === ErrorCode.AUTH_RATE_LIMITED) return 429
    return 401
  }
  
  if (code.startsWith('VAL')) return 400
  
  if (code.startsWith('DB')) {
    if (code === ErrorCode.DB_NOT_FOUND) return 404
    return 500
  }
  
  if (code.startsWith('BIZ')) {
    if (code === ErrorCode.RESOURCE_NOT_FOUND) return 404
    if (code === ErrorCode.RESOURCE_ALREADY_EXISTS) return 409
    return 400
  }
  
  if (code.startsWith('SRV')) return 503
  if (code.startsWith('EXT')) return 502
  
  return 500
}

/**
 * Convierte cualquier error en un SecureError
 */
export function handleError(
  error: unknown,
  defaultCode: ErrorCode = ErrorCode.SERVER_INTERNAL_ERROR
): SecureError {
  // Si ya es SecureError, retornarlo
  if (error instanceof SecureError) {
    return error
  }
  
  // Si es Error estándar
  if (error instanceof Error) {
    // Detectar tipo de error por el mensaje
    const message = error.message.toLowerCase()
    
    // Errores de Prisma
    if (message.includes('unique constraint')) {
      return new SecureError(ErrorCode.DB_UNIQUE_VIOLATION, { cause: error })
    }
    
    if (message.includes('not found') || message.includes('record to delete does not exist')) {
      return new SecureError(ErrorCode.DB_NOT_FOUND, { cause: error })
    }
    
    if (message.includes('connection') || message.includes('timeout')) {
      return new SecureError(ErrorCode.DB_CONNECTION_ERROR, { cause: error })
    }
    
    // Errores de Supabase
    if (message.includes('jwt') || message.includes('token')) {
      return new SecureError(ErrorCode.AUTH_SESSION_EXPIRED, { cause: error })
    }
    
    if (message.includes('invalid login')) {
      return new SecureError(ErrorCode.AUTH_INVALID_CREDENTIALS, { cause: error })
    }
    
    // Error genérico
    return new SecureError(defaultCode, { cause: error })
  }
  
  // Para cualquier otro tipo de error
  return new SecureError(defaultCode)
}

/**
 * Wrapper para Server Actions con manejo de errores seguro
 */
export async function withErrorHandling<T>(
  action: () => Promise<T>,
  errorCode: ErrorCode = ErrorCode.SERVER_INTERNAL_ERROR
): Promise<{ success: true; data: T } | { success: false; error: string; errorId: string }> {
  try {
    const data = await action()
    return { success: true, data }
  } catch (error) {
    const secureError = handleError(error, errorCode)
    return secureError.toResponse()
  }
}

/**
 * Wrapper para API routes con manejo de errores seguro
 */
export function createErrorResponse(error: unknown): Response {
  const secureError = error instanceof SecureError 
    ? error 
    : handleError(error)
  
  return Response.json(secureError.toResponse(), {
    status: secureError.httpStatus,
  })
}

// Exportar utilidades
export default {
  SecureError,
  ErrorCode,
  handleError,
  withErrorHandling,
  createErrorResponse,
}

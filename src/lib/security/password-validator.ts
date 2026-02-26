/**
 * Validador de Fortaleza de Contraseñas
 * 
 * Implementa requisitos de seguridad para contraseñas según OWASP guidelines
 */

// Lista de contraseñas comunes prohibidas (top 100)
const COMMON_PASSWORDS = new Set([
  'password', '123456', '12345678', 'qwerty', 'abc123', 'monkey', '1234567',
  'letmein', 'trustno1', 'dragon', 'baseball', '111111', 'iloveyou', 'master',
  'sunshine', 'ashley', 'bailey', 'passw0rd', 'shadow', '123123', '654321',
  'superman', 'qazwsx', 'michael', 'football', 'welcome', 'jesus', 'ninja',
  'mustang', 'password1', '123456789', 'admin', 'root', 'toor', 'guest',
  'default', 'changeme', 'password123', 'qwerty123', 'letmein123',
])

// Patrones débiles prohibidos
const WEAK_PATTERNS = [
  /^(.)(\1)+$/,           // Caracteres repetidos: 'aaaaaa', '111111'
  /^(012|123|234|345|456|567|678|789|890)+$/, // Secuencias numéricas
  /^(abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)+$/i, // Secuencias alfabéticas
  /^(qwe|wer|ert|rty|tyu|yui|uio|iop|asd|sdf|dfg|fgh|ghj|hjk|jkl|zxc|xcv|cvb|vbn|bnm)+$/i, // Teclado QWERTY
]

export interface PasswordValidationResult {
  isValid: boolean
  errors: string[]
  score: number // 0-4 (0=muy débil, 4=muy fuerte)
  strength: 'very-weak' | 'weak' | 'fair' | 'strong' | 'very-strong'
}

// Requisitos mínimos
const MIN_LENGTH = 8
const MAX_LENGTH = 128

/**
 * Valida la fortaleza de una contraseña
 */
export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = []
  let score = 0
  
  // Verificar longitud mínima
  if (password.length < MIN_LENGTH) {
    errors.push(`La contraseña debe tener al menos ${MIN_LENGTH} caracteres`)
  } else {
    score += 1
  }
  
  // Verificar longitud máxima
  if (password.length > MAX_LENGTH) {
    errors.push(`La contraseña no puede tener más de ${MAX_LENGTH} caracteres`)
  }
  
  // Verificar mayúsculas
  if (!/[A-Z]/.test(password)) {
    errors.push('La contraseña debe contener al menos una letra mayúscula')
  } else {
    score += 1
  }
  
  // Verificar minúsculas
  if (!/[a-z]/.test(password)) {
    errors.push('La contraseña debe contener al menos una letra minúscula')
  } else {
    score += 1
  }
  
  // Verificar números
  if (!/[0-9]/.test(password)) {
    errors.push('La contraseña debe contener al menos un número')
  } else {
    score += 1
  }
  
  // Verificar caracteres especiales
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('La contraseña debe contener al menos un símbolo especial (!@#$%^&*)')
  } else {
    score += 1
  }
  
  // Verificar contraseñas comunes
  if (COMMON_PASSWORDS.has(password.toLowerCase())) {
    errors.push('Esta contraseña es demasiado común. Por favor, elige una contraseña más única')
    score = Math.max(0, score - 2)
  }
  
  // Verificar patrones débiles
  const hasWeakPattern = WEAK_PATTERNS.some(pattern => pattern.test(password))
  if (hasWeakPattern) {
    errors.push('La contraseña no puede ser una secuencia simple de caracteres')
    score = Math.max(0, score - 1)
  }
  
  // Verificar que no sea igual al email (si se pasa email)
  // Esta verificación se hace en el componente
  
  // Calcular fuerza
  const strength = calculateStrength(score, errors.length)
  
  // La contraseña es válida si tiene score >= 3 y no hay errores críticos
  const isValid = score >= 3 && errors.length === 0
  
  return {
    isValid,
    errors,
    score,
    strength,
  }
}

/**
 * Calcula la fuerza de la contraseña basada en el score
 */
function calculateStrength(score: number, errorCount: number): PasswordValidationResult['strength'] {
  if (errorCount > 2 || score < 2) return 'very-weak'
  if (score === 2) return 'weak'
  if (score === 3) return 'fair'
  if (score === 4) return 'strong'
  return 'very-strong'
}

/**
 * Genera sugerencias para mejorar la contraseña
 */
export function getPasswordSuggestions(): string[] {
  return [
    'Usa al menos 8 caracteres',
    'Incluye mayúsculas y minúsculas',
    'Agrega números',
    'Incluye símbolos especiales (!@#$%^&*)',
    'Evita palabras comunes o secuencias predecibles',
    'Considera usar una frase passphrase',
    'No uses información personal (nombre, fecha de nacimiento)',
  ]
}

/**
 * Calcula la entropía de la contraseña (bits de aleatoriedad)
 */
export function calculateEntropy(password: string): number {
  let poolSize = 0
  
  if (/[a-z]/.test(password)) poolSize += 26
  if (/[A-Z]/.test(password)) poolSize += 26
  if (/[0-9]/.test(password)) poolSize += 10
  if (/[^a-zA-Z0-9]/.test(password)) poolSize += 32
  
  if (poolSize === 0) return 0
  
  return Math.log2(Math.pow(poolSize, password.length))
}

/**
 * Verifica si la contraseña es fuerte
 */
export function isStrongPassword(password: string): boolean {
  const result = validatePassword(password)
  return result.isValid && result.score >= 3
}

/**
 * Estima el tiempo para crackear la contraseña (solo para demostración)
 */
export function estimateCrackTime(password: string): string {
  const entropy = calculateEntropy(password)
  
  if (entropy < 28) return 'Instantáneo'
  if (entropy < 36) return 'Segundos'
  if (entropy < 60) return 'Minutos'
  if (entropy < 80) return 'Días'
  if (entropy < 100) return 'Años'
  return 'Siglos'
}

/**
 * Genera una contraseña segura aleatoria
 */
export function generateSecurePassword(length: number = 16): string {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const numbers = '0123456789'
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?'
  
  const allChars = lowercase + uppercase + numbers + symbols
  let password = ''
  
  // Asegurar al menos uno de cada tipo
  password += lowercase[Math.floor(Math.random() * lowercase.length)]
  password += uppercase[Math.floor(Math.random() * uppercase.length)]
  password += numbers[Math.floor(Math.random() * numbers.length)]
  password += symbols[Math.floor(Math.random() * symbols.length)]
  
  // Completar el resto
  for (let i = 4; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)]
  }
  
  // Mezclar la contraseña
  return password.split('').sort(() => Math.random() - 0.5).join('')
}

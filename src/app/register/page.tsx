"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useRateLimit } from "@/hooks/use-rate-limit"
import { RATE_LIMIT_CONFIGS } from "@/lib/security/rate-limiter"
import { 
  validatePassword, 
  isStrongPassword,
  calculateEntropy,
  getPasswordSuggestions 
} from "@/lib/security/password-validator"

export default function RegisterPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [passwordValidation, setPasswordValidation] = useState<{
    isValid: boolean
    errors: string[]
    score: number
    strength: string
  } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false)
  
  const { checkLimit, message: rateLimitMessage } = useRateLimit({
    endpoint: 'register',
    maxRequests: RATE_LIMIT_CONFIGS.REGISTER.maxRequests,
    windowMs: RATE_LIMIT_CONFIGS.REGISTER.windowMs,
  })

  // Validar contraseña en tiempo real
  useEffect(() => {
    if (password.length > 0) {
      const validation = validatePassword(password)
      setPasswordValidation(validation)
    } else {
      setPasswordValidation(null)
    }
  }, [password])

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess(false)
    
    // Verificar rate limiting
    if (!checkLimit()) {
      setError(rateLimitMessage || "Demasiados intentos. Por favor, inténtalo más tarde.")
      setLoading(false)
      return
    }
    
    // Validar contraseña en el cliente
    if (!isStrongPassword(password)) {
      const validation = validatePassword(password)
      setError(`Contraseña débil: ${validation.errors[0]}`)
      setLoading(false)
      return
    }
    
    // Verificar que email y contraseña no sean iguales
    if (email.toLowerCase().includes(password.toLowerCase()) || 
        password.toLowerCase().includes(email.split('@')[0].toLowerCase())) {
      setError("La contraseña no puede ser similar a tu email")
      setLoading(false)
      return
    }
    
    try {
      const { error: signUpError, data } = await supabase.auth.signUp({
        email,
        password,
      })
      
      if (signUpError) {
        // Mensajes de error genéricos para no revelar información
        if (signUpError.message.includes('already registered')) {
          setError("No se pudo crear la cuenta. Por favor, verifica tu información.")
        } else {
          setError("Ocurrió un error al crear la cuenta. Por favor, inténtalo de nuevo.")
          console.error('Registration error:', signUpError)
        }
      } else if (data.user) {
        setSuccess(true)
        // Opcional: redirigir después de unos segundos
        setTimeout(() => {
          router.push('/login?registered=true')
        }, 3000)
      }
    } catch (err) {
      setError("Error del servidor. Por favor, inténtalo más tarde.")
      console.error('Unexpected error:', err)
    }
    
    setLoading(false)
  }

  // Función para obtener el color del indicador de fuerza
  const getStrengthColor = (strength: string) => {
    switch (strength) {
      case 'very-weak': return 'bg-red-500'
      case 'weak': return 'bg-orange-500'
      case 'fair': return 'bg-yellow-500'
      case 'strong': return 'bg-green-500'
      case 'very-strong': return 'bg-green-600'
      default: return 'bg-gray-300'
    }
  }

  // Función para obtener el texto del indicador
  const getStrengthText = (strength: string) => {
    switch (strength) {
      case 'very-weak': return 'Muy débil'
      case 'weak': return 'Débil'
      case 'fair': return 'Aceptable'
      case 'strong': return 'Fuerte'
      case 'very-strong': return 'Muy fuerte'
      default: return ''
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Crear cuenta</CardTitle>
          <CardDescription>
            Introduce tu email y crea una contraseña segura
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleRegister}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
                {error}
              </div>
            )}
            {success && (
              <div className="p-3 text-sm text-green-600 bg-green-50 rounded-md">
                ¡Cuenta creada exitosamente! Revisa tu email para confirmarla.
                Redirigiendo al login en 3 segundos...
              </div>
            )}
            
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="tu@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Contraseña
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setShowPasswordRequirements(true)}
                required
                disabled={loading}
                minLength={8}
              />
              
              {/* Indicador de fortaleza */}
              {passwordValidation && password.length > 0 && (
                <div className="mt-2 space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 ${getStrengthColor(passwordValidation.strength)}`}
                        style={{ width: `${(passwordValidation.score / 5) * 100}%` }}
                      />
                    </div>
                    <span className={`text-xs font-medium ${
                      passwordValidation.score >= 3 ? 'text-green-600' : 'text-red-500'
                    }`}>
                      {getStrengthText(passwordValidation.strength)}
                    </span>
                  </div>
                  
                  {/* Entropía */}
                  {password.length >= 8 && (
                    <p className="text-xs text-gray-500">
                      Entropía: {calculateEntropy(password).toFixed(1)} bits
                    </p>
                  )}
                </div>
              )}
              
              {/* Requisitos de contraseña */}
              {showPasswordRequirements && (
                <div className="mt-3 p-3 bg-gray-50 rounded-md text-sm">
                  <p className="font-medium text-gray-700 mb-2">Requisitos:</p>
                  <ul className="space-y-1 text-xs">
                    <li className={`flex items-center space-x-2 ${
                      password.length >= 8 ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      <span>{password.length >= 8 ? '✓' : '○'}</span>
                      <span>Mínimo 8 caracteres</span>
                    </li>
                    <li className={`flex items-center space-x-2 ${
                      /[A-Z]/.test(password) ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      <span>{/[A-Z]/.test(password) ? '✓' : '○'}</span>
                      <span>Al menos una mayúscula</span>
                    </li>
                    <li className={`flex items-center space-x-2 ${
                      /[a-z]/.test(password) ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      <span>{/[a-z]/.test(password) ? '✓' : '○'}</span>
                      <span>Al menos una minúscula</span>
                    </li>
                    <li className={`flex items-center space-x-2 ${
                      /[0-9]/.test(password) ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      <span>{/[0-9]/.test(password) ? '✓' : '○'}</span>
                      <span>Al menos un número</span>
                    </li>
                    <li className={`flex items-center space-x-2 ${
                      /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      <span>{/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) ? '✓' : '○'}</span>
                      <span>Al menos un símbolo especial</span>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-4">
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || (passwordValidation ? !passwordValidation.isValid : true)}
            >
              {loading ? "Creando cuenta..." : "Crear cuenta"}
            </Button>
            <p className="text-sm text-center text-gray-600">
              ¿Ya tienes una cuenta?{" "}
              <Link href="/login" className="text-blue-600 hover:underline">
                Iniciar sesión
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

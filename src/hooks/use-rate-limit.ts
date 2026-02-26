'use client'

import { useState, useCallback } from 'react'
import { 
  checkRateLimit, 
  getRateLimitIdentifier, 
  formatResetTime,
  RATE_LIMIT_CONFIGS 
} from '@/lib/security/rate-limiter'

interface UseRateLimitOptions {
  endpoint: string
  maxRequests?: number
  windowMs?: number
}

interface RateLimitState {
  isAllowed: boolean
  remaining: number
  resetTime: number
  message: string | null
}

export function useRateLimit(options: UseRateLimitOptions) {
  const [state, setState] = useState<RateLimitState>({
    isAllowed: true,
    remaining: options.maxRequests || RATE_LIMIT_CONFIGS.GENERAL.maxRequests,
    resetTime: 0,
    message: null,
  })

  const checkLimit = useCallback((userId?: string) => {
    const identifier = getRateLimitIdentifier(options.endpoint, userId)
    const config = options.maxRequests && options.windowMs
      ? { maxRequests: options.maxRequests, windowMs: options.windowMs }
      : RATE_LIMIT_CONFIGS.GENERAL
    
    const result = checkRateLimit(identifier, config)
    
    if (!result.isAllowed) {
      const resetTimeFormatted = formatResetTime(result.resetTime)
      setState({
        ...result,
        message: `Demasiados intentos. Por favor, espera ${resetTimeFormatted}.`,
      })
    } else {
      setState({
        ...result,
        message: null,
      })
    }
    
    return result.isAllowed
  }, [options.endpoint, options.maxRequests, options.windowMs])

  return {
    ...state,
    checkLimit,
  }
}

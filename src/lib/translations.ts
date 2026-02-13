/**
 * Translation utility for React components
 * Gets translations from WordPress wp_localize_script
 */

import type { NextDashTranslations } from '../global'

export function t(key: keyof NextDashTranslations, fallback?: string): string {
  const translations = (window.nextdashData?.translations || {}) as Partial<NextDashTranslations>
  return translations[key] || fallback || key
}

export function tf(key: keyof NextDashTranslations, ...args: string[]): string {
  const translation = t(key)
  // Simple sprintf-like replacement for %s placeholders
  let result = translation
  args.forEach((arg) => {
    result = result.replace('%s', arg)
  })
  return result
}


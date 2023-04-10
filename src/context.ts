import { MCEventListener } from '@managed-components/types'

export interface Context {
  events: Record<string, MCEventListener[]>
  clientEvents: Record<string, MCEventListener>
  routePath: string
  component: string
  componentPath: string
  cookies: Record<string, string>
  permissions: string[]
  response: {
    fetch: (string | [string, RequestInit])[]
    execute: string[]
    return?: Record<string, unknown>
    pendingCookies: Record<string, [string, string]>
    clientPrefs: Record<string, string[]>
  }
}

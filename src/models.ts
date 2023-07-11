import { ComponentSettings, MCEvent } from '@managed-components/types'

export type EventBody = {
  settings: ComponentSettings
  event: MCEvent
  clientData: Record<string, any>
  eventType: string
  componentPath: string
  permissions: string[]
  component: string
  debug: boolean
}

export type InitBody = {
  settings: ComponentSettings
  componentPath: string
  permissions: string[]
  component: string
}

export type internalFetch = (
  resource: string | Request,
  settings?: RequestInit | Request
) => Promise<Response>

export interface CookieOptions {
  Domain?: string
  Path?: string
  Expires?: string | Date
  'Max-Age'?: number
  Secure?: Boolean
  HttpOnly?: Boolean
  SameSite?: 'Strict' | 'Lax' | 'None'
}

import { ComponentSettings, MCEvent } from '@managed-components/types'

export type InitBody = {
  settings: ComponentSettings
  componentPath: string
  permissions: string[]
  component: string
  routePath: string
}

export type EventBody = InitBody & {
  event: MCEvent
  clientData: Record<string, any>
  eventType: string
  debug: boolean
}

export type internalFetch = (
  resource: string | Request,
  settings?: RequestInit | Request
) => Promise<Response>

export type Env = {
  KV: KVNamespace
}

export type RouteHandler = (r: Request) => Promise<Response> | Response

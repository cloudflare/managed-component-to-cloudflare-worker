import { ComponentSettings, MCEvent } from '@managed-components/types'

export type EventBody = {
  settings: ComponentSettings
  event: MCEvent
  clientData: Record<string, any>
  eventType: string
  componentPath: string
  permissions: string[]
  component: string
}

export type InitBody = {
  settings: ComponentSettings
  componentPath: string
  permissions: string[]
  component: string
}

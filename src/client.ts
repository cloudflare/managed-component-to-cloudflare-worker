import {
  Client as MCClient,
  ClientSetOptions,
  Manager,
} from '@managed-components/types'
import { Context } from './context'
import { hasPermission } from './utils'

export class Client implements MCClient {
  #permissions: string[]
  #component: string
  #componentPath: string
  emitter: string
  screenWidth?: number | undefined
  screenHeight?: number | undefined
  viewportHeight?: number | undefined
  viewportWidth?: number | undefined
  userAgent: string
  timezoneOffset?: number
  language: string
  referer: string
  ip: string
  title?: string | undefined
  timestamp?: number | undefined
  url: URL
  #baseDomain: string
  #cookies: Record<string, string>
  #pendingCookies: Context['response']['pendingCookies']
  #clientPrefs: Context['response']['clientPrefs']
  #response: Context['response']

  constructor(clientData: Record<string, any>, context: Context) {
    this.#permissions = context.permissions
    this.#component = context.component
    this.#componentPath = context.componentPath
    this.url = new URL(clientData.url)
    this.#response = context.response
    this.title = clientData.title
    this.timestamp = clientData.timestamp
    this.userAgent = clientData.userAgent
    this.language = clientData.language
    this.referer = clientData.referer
    this.ip = clientData.ip
    this.timezoneOffset = parseInt(clientData.timezoneOffset)
    this.emitter = clientData.emitter
    this.#baseDomain = clientData.baseDomain
    this.screenWidth = clientData.screenWidth
    this.screenHeight = clientData.screenHeight
    this.viewportWidth = clientData.viewportWidth
    this.viewportHeight = clientData.viewportHeight

    this.#cookies = context.cookies

    this.#pendingCookies = context.response.pendingCookies

    this.#clientPrefs = context.response.clientPrefs
  }

  fetch(
    resource: string,
    settings?: RequestInit | undefined
  ): boolean | undefined {
    const permission = 'client_network_requests'
    if (hasPermission(this.#component, permission, this.#permissions)) {
      this.#response.fetch.push([resource, settings || {}])
      return true
    }
    return false
  }

  execute(code: string): boolean | undefined {
    const permission = 'execute_unsafe_scripts'
    if (hasPermission(this.#component, permission, this.#permissions)) {
      this.#response.execute.push(code)
      return true
    }
    return false
  }

  return(value: unknown): void {
    this.#response.return ||= {}
    this.#response.return[this.#componentPath] = value
  }

  set(
    key: string,
    value: string | null | undefined,
    opts?: any
  ): boolean | undefined {
    if (
      !hasPermission(this.#component, 'access_client_kv', this.#permissions)
    ) {
      return
    }
    const cookieKey = this.#componentPath + '__' + key

    this.#cookies[cookieKey] = value as string
    this.#pendingCookies[cookieKey] = { value, opts }

    return true
  }

  get(key: string): string | undefined {
    if (
      !hasPermission(this.#component, 'access_client_kv', this.#permissions)
    ) {
      return
    }
    const cookieKey = this.#componentPath + '__' + key
    return this.#cookies[cookieKey]
  }

  attachEvent(event: string): void {
    const componentPath = this.#componentPath
    if (!this.#clientPrefs[componentPath]) {
      this.#clientPrefs[componentPath] = [event]
    } else {
      this.#clientPrefs[componentPath].push(event)
    }
  }

  detachEvent(event: string): void {
    if (!this.#clientPrefs) return

    const componentPath = this.#componentPath
    const eventIndex = this.#clientPrefs[componentPath]?.indexOf(event)
    if (eventIndex > -1) {
      this.#clientPrefs[componentPath].splice(eventIndex, 1)
    }
  }
}

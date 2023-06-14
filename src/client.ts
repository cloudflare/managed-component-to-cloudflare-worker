import {
  Client as MCClient,
  ClientSetOptions,
  Manager,
} from '@managed-components/types'
import { Context } from './context'
import { genCookieOptions, hasPermission } from './utils'

export class Client implements MCClient {
  #permissions: string[]
  #component: string
  #componentPath: string
  emitter: string
  userAgent: string
  offset?: number
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
    this.offset = parseInt(clientData.timezoneOffset)
    this.emitter = clientData.emitter
    this.#baseDomain = clientData.baseDomain

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
    const cookieKey = this.#componentPath + '__' + key

    this.#cookies[cookieKey] = value as string

    const cookieOptions = genCookieOptions(opts, this.#baseDomain)
    this.#pendingCookies[cookieKey] = [value as string, cookieOptions]

    return true
  }

  // TODO can we support here get from another component ???
  // We can but the question is if we should and how should we do it?
  get(key: string): string | undefined {
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

// Manager that needs to be sent to the component when first sending a
import {
  EmbedCallback,
  Manager as MCManager,
  MCEventListener,
  WidgetCallback,
} from '@managed-components/types'
import { Context } from './context'
import { get, set } from './storage'
import { invalidateCache, useCache } from './useCache'
import { hasPermission } from './utils'

export class Manager implements MCManager {
  #routePath: string
  #listeners: Record<string, MCEventListener[]>
  #clientListeners: Record<string, MCEventListener>
  component: string
  #permissions: string[]

  constructor(context: Context) {
    this.component = context.component
    this.#listeners = context.events
    this.#clientListeners = context.clientEvents
    this.#routePath = context.routePath
    this.#permissions = context.permissions
  }

  addEventListener(type: string, callback: MCEventListener) {
    this.#listeners[type] ||= []
    this.#listeners[type].push(callback)
    return true
  }
  createEventListener(type: string, callback: MCEventListener) {
    this.#clientListeners[type] = callback
    return true
  }
  get(key: string): string | undefined {
    return get(this.component + '__' + key)
  }
  set(key: string, value: any): boolean | undefined {
    return set(this.component + '__' + key, value)
  }

  route(path: string, callback: (request: any) => Response) {
    const permission = 'provide_server_functionality'
    if (hasPermission(this.component, permission, this.#permissions)) {
      // TODO properly do this
      const fullPath = this.#routePath + path
      return fullPath
    }
    return undefined
  }
  proxy(path: string, target: string) {
    const permission = 'provide_server_functionality'

    if (hasPermission(this.component, permission, this.#permissions)) {
      // TODO properly do this
      const fullPath = this.#routePath + path
      return fullPath
    }
    return undefined
  }

  serve(path: string, target: string) {
    const permission = 'serve_static_files'
    if (hasPermission(this.component, permission, this.#permissions)) {
      // TODO properly do this
      const fullPath = this.#routePath + path
      return fullPath
    }

    return undefined
  }

  async useCache(key: string, callback: Function, expiry?: number) {
    return await useCache(this.component + '__' + key, callback, expiry)
  }

  invalidateCache(key: string) {
    invalidateCache(this.component + '__' + key)
    return true
  }

  registerEmbed(name: string, callback: EmbedCallback) {
    // this.#generic.registeredEmbeds[this.#component + '__' + name] = callback
    return true
  }

  registerWidget(callback: WidgetCallback) {
    const permission = 'provide_widget'
    if (hasPermission(this.component, permission, this.#permissions)) {
      // TODO add widget to widgets list
    }
    return false
  }
}

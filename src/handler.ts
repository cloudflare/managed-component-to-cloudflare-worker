import { ComponentSettings } from '@managed-components/types'
import { Client } from './client'
import { Context } from './context'
import { Manager } from './manager'
import { Env, EventBody, InitBody } from './models'
;(globalThis as any).systemFetch = globalThis.fetch
globalThis.fetch = async (
  resource: string | Request,
  _settings?: RequestInit | Request
) => {
  // For now we will keep supporting normal fetch, but later we can replace the console.error with throw
  console.error(
    `Fetch isn't available to Managed Components, please choose client.fetch or manager.fetch. Trying to call: ${JSON.stringify(
      resource
    )}`
  )
  return new Response(
    `Fetch isn't available to Managed Components, please choose client.fetch or manager.fetch. Trying to call: ${JSON.stringify(
      resource
    )}`,
    { status: 500 }
  )
}

export const handleRequest = async (
  request: Request,
  execContext: ExecutionContext,
  env: Env,
  componentCb: (manager: Manager, settings: ComponentSettings) => void
) => {
  const context: Context = {
    component: '',
    componentPath: '',
    events: {},
    clientEvents: {},
    routePath: '',
    mappedEndpoints: {},
    cookies: {},
    permissions: [],
    debug: false,
    response: {
      fetch: [],
      execute: [],
      return: {},
      pendingCookies: {},
      clientPrefs: {},
      serverFetch: [],
    },
    execContext,
    env,
  }

  const url = new URL(request.url)
  if (url.pathname === '/route') {
    let settings: ComponentSettings
    let routeEndpoint: string
    let params: string
    try {
      context.component = request.headers.get('zaraz-component') || ''
      context.componentPath = request.headers.get('zaraz-component-path') || ''
      context.routePath = request.headers.get('zaraz-route-path') || ''
      routeEndpoint = request.headers.get('zaraz-route-endpoint') || ''
      context.permissions = JSON.parse(
        request.headers.get('zaraz-permissions') || ''
      )
      settings = JSON.parse(request.headers.get('zaraz-settings') || '')
      params = new URL(request.url).searchParams.toString()
    } catch (e) {
      return new Response('Invalid headers', { status: 400 })
    }
    const manager = new Manager(context)
    await componentCb(manager, settings)
    try {
      return await context.mappedEndpoints[routeEndpoint](
        new Request(routeEndpoint + '?' + params, request.clone())
      )
    } catch (e) {
      console.error(e)
      return new Response('Route handler error', { status: 500 })
    }
  } else if (request.method === 'POST') {
    let body: InitBody | EventBody

    try {
      body = await request.json()
    } catch (e) {
      console.error('no request json data: ', e)
      return new Response((e as Error).toString(), { status: 500 })
    }

    context.componentPath = body.componentPath
    context.permissions = body.permissions
    context.component = body.component
    context.routePath = body.routePath || ''

    if (url.pathname === '/init') {
      const manager = new Manager(context)
      const { settings } = body as InitBody
      await componentCb(manager, settings)
      const { cookies, ...restOfContext } = context
      return new Response(
        JSON.stringify({
          ...restOfContext,
          events: Object.keys(context.events),
          clientEvents: Object.keys(context.clientEvents),
          componentPath: context.componentPath,
          mappedEndpoints: Object.keys(context.mappedEndpoints),
        })
      )
    } else if (url.pathname === '/event') {
      const { eventType, event, settings, clientData, debug } =
        body as EventBody
      const isClientEvent = url.searchParams.get('type') === 'client'

      context.cookies = clientData.cookies
      context.debug = debug

      const manager = new Manager(context)

      await componentCb(manager, settings)
      event.client = new Client(clientData, context)
      if (isClientEvent) {
        if (Object.keys(context.clientEvents).includes(eventType)) {
          await context.clientEvents[eventType](event)
        }
      } else {
        if (Object.keys(context.events).includes(eventType)) {
          await Promise.all(context.events[eventType].map(fn => fn(event)))
        }
      }

      return new Response(
        JSON.stringify({
          componentPath: context.componentPath,
          ...context.response,
        })
      )
    }
  } else {
    return new Response('External MC Test ✅')
  }
  return new Response('Invalid Path or Method', { status: 404 })
}

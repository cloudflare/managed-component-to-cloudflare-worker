import { ComponentSettings } from '@managed-components/types'
import { Client } from './client'
import { Context } from './context'
import { Manager } from './manager'
import { EventBody, InitBody, internalFetch } from './models'
;(globalThis as any).systemFetch = globalThis.fetch
globalThis.fetch = async (
  resource: string | Request,
  settings?: RequestInit | Request
) => {
  // For now we will keep supporting normal fetch, but later we can replace the console.error with throw
  console.error(
    `Fetch isn't available to Managed Components, please choose client.fetch or manager.fetch. Trying to call: ${JSON.stringify(
      resource
    )}`
  )
  return new Response(
    JSON.stringify({
      response: `Fetch isn't available to Managed Components, please choose client.fetch or manager.fetch. Trying to call: ${JSON.stringify(
        resource
      )}`,
    }),
    { status: 405 }
  )
}

export const handleRequest = async (
  request: Request,
  componentCb: (manager: Manager, settings: ComponentSettings) => void
) => {
  const context: Context = {
    component: '',
    componentPath: '',
    events: {},
    clientEvents: {},
    routePath: '',
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
  }

  if (request.method === 'POST') {
    const url = new URL(request.url)
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
          context.clientEvents[eventType](event)
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

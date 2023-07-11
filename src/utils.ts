import { ClientSetOptions } from '@managed-components/types'
import { Context } from './context'
import { CookieOptions } from './models'

export const genCookieOptions = (
  response: Context['response'],
  options: ClientSetOptions = {},
  baseDomain: string,
  key: string,
  val: any
) => {
  const cookieOptions: CookieOptions = {}

  let domain = baseDomain || false

  if (domain) cookieOptions['Domain'] = domain

  const { expiry, scope = 'infinite' } = options || {}

  cookieOptions['Path'] = '/'

  if (typeof expiry === 'number') {
    cookieOptions['Max-Age'] = expiry
  } else if (expiry instanceof Date) {
    cookieOptions['Expires'] = expiry
  }

  switch (scope) {
    case 'page':
      response.execute.push(
        `zarazData.mcVars||={}; zarazData.mcVars[unescape('${escape(
          key
        )}')] = unescape('${escape(val)}')`
      )
      break
    case 'session':
      delete cookieOptions['Expires']
      delete cookieOptions['Max-Age']
      break
    default:
      // If Max-Age is already set in options, Expires will be ignored on the browser(lower priority)
      cookieOptions['Expires'] ||
        typeof cookieOptions['Max-Age'] === 'number' ||
        (cookieOptions['Max-Age'] = 31536000000)
      break
  }

  if (scope !== 'page') {
    let cookieOptionsString = Object.entries(cookieOptions).reduce(
      (accumulator, [key, value]) => {
        return accumulator + `; ${key}=${value}`
      },
      ''
    )

    // TODO should we care about this? We can send notFirstParty as an argument or
    // we can process the returned cookies in the worker and add these options
    // to the cookieOptionsString :/

    // if (!context.notFirstParty) {
    //   cookieOptionsString += '; HttpOnly'

    //   if (context.system.page.url.protocol === 'https:')
    //     cookieOptionsString += '; Secure; SameSite=Lax'
    // }

    return cookieOptionsString
  }
}

export const hasPermission = (
  component: string,
  permission: string,
  permissions: string[]
) => {
  if (!permissions.includes(permission)) {
    console.error(
      `🚨 ${component}: ${permission?.toLocaleUpperCase()} - Permission not granted `
    )
    return false
  }
  return true
}

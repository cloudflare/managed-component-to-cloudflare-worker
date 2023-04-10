export const genCookieOptions = (
  options: Record<string, any> = {},
  baseDomain: string,
  isSessionCookie = false
) => {
  let domain = baseDomain || false

  if (domain) options['Domain'] = domain

  options['Path'] = options['Path'] || '/'
  if (!isSessionCookie) {
    // If Max-Age is already set in options, Expires will be ignored on the browser(lower priority)
    options['Expires'] = options['Expires'] || 'Fri, 31 Dec 2028 23:59:59 GMT'
  }

  const cookieOptions = Object.entries(options).reduce(
    (accumulator, [key, value]) => {
      return accumulator + `; ${key}=${value}`
    },
    ''
  )

  return cookieOptions
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

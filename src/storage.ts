export const set = async (
  KV: KVNamespace,
  context: ExecutionContext,
  key: string,
  value: any
) => {
  try {
    const put = KV.put(key, JSON.stringify(value))
    context.waitUntil(put)
    await put
    return true
  } catch (e) {
    console.error('Manager set error: ', e)
    return false
  }
}

export const get = async (KV: KVNamespace, key: string) => {
  const value = await KV.get(key)
  try {
    return value ? JSON.parse(value) : value
  } catch (e) {
    console.error('Manager get error: ', e)
    return null
  }
}

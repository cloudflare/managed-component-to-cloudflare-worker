export const useCache = async (
  KV: KVNamespace,
  context: ExecutionContext,
  key: string,
  callback: Function,
  expirySeconds = 3600
) => {
  try {
    const cached = await KV.get(key)
    if (cached) return JSON.parse(cached)

    const valueToCache = await callback()
    const put = KV.put(key, JSON.stringify(valueToCache), {
      expirationTtl: expirySeconds,
    })
    context.waitUntil(put)
    await put

    return valueToCache
  } catch (e) {
    console.error('useCache error: ', e)
  }
}

export const invalidateCache = async (
  KV: KVNamespace,
  context: ExecutionContext,
  key: string
) => {
  const del = KV.delete(key)
  context.waitUntil(del)
  return await del
}

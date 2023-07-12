export const useCache = async (
  KV: KVNamespace,
  context: ExecutionContext,
  key: string,
  callback: Function,
  expirySeconds = 3600
) => {
  const cached = await KV.get(key)
  if (cached) return cached

  const valueToCache = await callback()

  context.waitUntil(
    KV.put(key, valueToCache, {
      expirationTtl: expirySeconds,
    })
  )
}

export const invalidateCache = (
  KV: KVNamespace,
  context: ExecutionContext,
  key: string
) => {
  context.waitUntil(KV.delete(key))
}

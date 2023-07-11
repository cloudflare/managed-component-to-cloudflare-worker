export const set = (
  KV: KVNamespace,
  context: ExecutionContext,
  key: string,
  value: any
) => {
  context.waitUntil(KV.put(key, value))
  return true
}

export const get = async (KV: KVNamespace, key: string) => {
  const value = await KV.get(key)
  return value || undefined
}

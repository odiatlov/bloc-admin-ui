export const reviewRequestIdentity = (scope: string, payload: object) => {
  const key = `finance-review:${scope}:${JSON.stringify(payload)}`
  let id: string = crypto.randomUUID()
  try { id = sessionStorage.getItem(key) || id; sessionStorage.setItem(key, id) } catch { /* The request remains usable without storage. */ }
  return { id, complete: () => { try { sessionStorage.removeItem(key) } catch { /* Storage can be unavailable. */ } } }
}

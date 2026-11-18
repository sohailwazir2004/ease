// The ONE place that talks to the server with fetch().
// Every other file calls the small functions in events.js instead of using fetch directly.

// Where the server lives. Change it with a VITE_API_URL line in a .env file.
const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:4000'

export async function request(method, path, body) {
  let res
  try {
    res = await fetch(`${BASE}/api${path}`, {
      method,
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    // fetch only throws when the server cannot be reached at all.
    throw new Error('Cannot reach the server. Is it running?')
  }

  if (res.status === 204) return null // "deleted", nothing to read

  const data = await res.json().catch(() => null)
  if (!res.ok) throw new Error(data?.error ?? `Request failed (${res.status})`)
  return data
}

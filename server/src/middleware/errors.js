// One place that turns problems into clean JSON answers.

// An error we throw on purpose, carrying the HTTP status code to send back
// (400 = bad input, 404 = not found, 409 = conflict).
export class ApiError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

// Express calls this when a route throws (Express 5 also catches errors from async routes).
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (err instanceof ApiError) return res.status(err.status).json({ error: err.message })
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Request body is not valid JSON' })
  if (err.type === 'entity.too.large') return res.status(413).json({ error: 'Request body is too large' })
  console.error(err) // unexpected bug: log it, but do not leak details to the client
  res.status(500).json({ error: 'Something went wrong on the server' })
}

export function notFound(req, res) {
  res.status(404).json({ error: `No route for ${req.method} ${req.path}` })
}

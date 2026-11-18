// Small helper functions (no React in here, just plain JavaScript).

export function formatDateTime(value) {
  if (!value) return 'No date'
  return new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

export function isUpcoming(value) {
  return new Date(value) >= new Date()
}

// Makes a CSV file's text from an array of arrays. Values with commas or quotes
// must be wrapped in "double quotes" (and inner quotes doubled).
export function toCSV(rows) {
  return rows
    .map((row) =>
      row
        .map((cell) => {
          const text = String(cell ?? '')
          return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
        })
        .join(','),
    )
    .join('\n')
}

// Triggers a browser download for some text.
export function downloadFile(filename, text, type = 'text/csv') {
  const url = URL.createObjectURL(new Blob([text], { type }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

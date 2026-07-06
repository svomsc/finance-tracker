export function suggestCategory(note, categories) {
  const text = note.trim().toLowerCase()
  if (!text) return null

  for (const cat of categories) {
    for (const keyword of cat.keywords || []) {
      if (text.includes(keyword)) return cat.key
    }
  }
  return null
}

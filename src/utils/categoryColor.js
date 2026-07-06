// Static lookup so Tailwind JIT can see every arbitrary-value class literally in source.
// Every hex used across CATEGORY_PRESETS and CUSTOM_COLOR_PALETTE must have an entry here.
export const CATEGORY_COLOR_CLASSES = {
  "#f97316": "bg-[#f97316]",
  "#3b82f6": "bg-[#3b82f6]",
  "#a855f7": "bg-[#a855f7]",
  "#ec4899": "bg-[#ec4899]",
  "#eab308": "bg-[#eab308]",
  "#f43f5e": "bg-[#f43f5e]",
  "#92400e": "bg-[#92400e]",
  "#06b6d4": "bg-[#06b6d4]",
  "#6366f1": "bg-[#6366f1]",
  "#0ea5e9": "bg-[#0ea5e9]",
  "#16a34a": "bg-[#16a34a]",
  "#db2777": "bg-[#db2777]",
  "#64748b": "bg-[#64748b]",
  "#7c3aed": "bg-[#7c3aed]",
  "#d946ef": "bg-[#d946ef]",
  "#22c55e": "bg-[#22c55e]",
  "#f472b6": "bg-[#f472b6]",
  "#ca8a04": "bg-[#ca8a04]",
  "#fb923c": "bg-[#fb923c]",
  "#f59e0b": "bg-[#f59e0b]",
  "#0891b2": "bg-[#0891b2]",
  "#78716c": "bg-[#78716c]",
  "#dc2626": "bg-[#dc2626]",
  "#4338ca": "bg-[#4338ca]",
  "#78350f": "bg-[#78350f]",
  "#b45309": "bg-[#b45309]",
  "#9333ea": "bg-[#9333ea]",
  "#475569": "bg-[#475569]",
  "#059669": "bg-[#059669]",
  "#0d9488": "bg-[#0d9488]",
  "#6b7280": "bg-[#6b7280]",
}

export function categoryBgClass(hex) {
  return CATEGORY_COLOR_CLASSES[hex] || "bg-slate-500"
}

// Приблизительная эвристика: категория → уровень пирамиды Маслоу.
// Это иллюстративная группировка, а не строгая психологическая классификация.
export const MASLOW_MAP = {
  food: "physiology",
  transport: "physiology",
  housing: "physiology",
  utilities: "physiology",
  health: "physiology",
  mobile: "physiology",
  sport: "physiology",

  insurance: "safety",
  savings: "safety",
  investments: "safety",
  taxes: "safety",
  repair: "safety",
  furniture: "safety",
  children: "safety",

  clothes: "expression",
  taxi: "expression",
  restaurants: "expression",
  cafe: "expression",
  travel: "expression",
  subscriptions: "expression",
  education: "expression",
  beauty: "expression",
  electronics: "expression",
  books: "expression",
  entertainment: "expression",
  gifts: "expression",
  pets: "expression",
  alcohol: "expression",
  charity: "expression",
  hobby: "expression",
  other: "expression",
}

export const MASLOW_LABELS = {
  physiology: "Физиология",
  safety: "Безопасность",
  expression: "Самовыражение",
}

export function maslowBucket(categoryKey) {
  return MASLOW_MAP[categoryKey] || "expression"
}

export function computeMaslowBreakdown(transactions) {
  const sums = { physiology: 0, safety: 0, expression: 0 }
  for (const t of transactions) {
    if (t.type !== "expense") continue
    sums[maslowBucket(t.category)] += t.amount
  }
  const total = sums.physiology + sums.safety + sums.expression
  return Object.keys(sums).map((key) => ({
    key,
    label: MASLOW_LABELS[key],
    amount: sums[key],
    percent: total > 0 ? (sums[key] / total) * 100 : 0,
  }))
}

export const WEEKDAY_LABELS = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"]

export function computeWeekdayBreakdown(transactions) {
  const sums = new Array(7).fill(0)
  for (const t of transactions) {
    if (t.type !== "expense" || !t.date) continue
    const day = new Date(t.date + "T00:00:00").getDay()
    sums[day] += t.amount
  }
  return WEEKDAY_LABELS.map((label, i) => ({ label, amount: sums[i] }))
}

import { useMemo } from "react"
import { widthPercentClass } from "../utils/progressWidth"

function fmt(n) {
  return Math.round(n).toLocaleString("ru-RU") + " ₽"
}

export default function BudgetGoals({ transactions, budgets, setBudgetLimit, categories }) {
  const now = useMemo(() => new Date(), [])
  const currentMonthKey = `${now.getFullYear()}-${String(
    now.getMonth() + 1
  ).padStart(2, "0")}`

  const spentByCategory = useMemo(() => {
    const sums = {}
    for (const t of transactions) {
      if (t.type === "expense" && t.date?.startsWith(currentMonthKey)) {
        sums[t.category] = (sums[t.category] || 0) + t.amount
      }
    }
    return sums
  }, [transactions, currentMonthKey])

  return (
    <div className="flex flex-col gap-4 px-4 pt-4">
      <p className="text-sm text-secondary">
        Установи месячный лимит для каждой категории — при превышении транзакции
        подсветятся.
      </p>
      {categories.map((cat) => {
        const key = cat.key
        const limit = budgets[key] || 0
        const spent = spentByCategory[key] || 0
        const exceeded = limit > 0 && spent > limit
        const progress = limit > 0 ? Math.min(100, (spent / limit) * 100) : 0

        return (
          <div
            key={key}
            className={`bg-surface rounded-2xl p-4 shadow-lg ${
              exceeded ? "ring-2 ring-danger" : ""
            }`}
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">{cat.emoji}</span>
              <span className="flex-1 font-semibold text-primary">{cat.name}</span>
              <input
                type="number"
                inputMode="decimal"
                min="0"
                placeholder="Лимит"
                value={budgets[key] || ""}
                onChange={(e) => setBudgetLimit(key, e.target.value)}
                className="w-28 bg-input rounded-xl px-3 py-2 text-right text-primary outline-none"
              />
            </div>
            {limit > 0 && (
              <>
                <div className="w-full h-2.5 bg-input rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${widthPercentClass(
                      progress
                    )} ${exceeded ? "bg-danger" : "bg-accent"}`}
                  />
                </div>
                <p
                  className={`text-xs mt-1.5 ${
                    exceeded ? "text-danger" : "text-secondary"
                  }`}
                >
                  {fmt(spent)} из {fmt(limit)}
                  {exceeded ? " — лимит превышен" : ""}
                </p>
              </>
            )}
          </div>
        )
      })}
    </div>
  )
}

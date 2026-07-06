import { useMemo, useState } from "react"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import { toLocalISODate as isoDate } from "../utils/date"
import { categoryBgClass } from "../utils/categoryColor"

function fmt(n) {
  return Math.round(n).toLocaleString("ru-RU") + " ₽"
}

const PERIODS = [
  { key: "month", label: "Этот месяц" },
  { key: "3months", label: "3 месяца" },
  { key: "all", label: "Всё время" },
  { key: "travel", label: "Путешествия" },
]

const TOOLTIP_COLORS = {
  light: { bg: "#ffffff", border: "#e2e8f0" },
  dark: { bg: "#1a1f2e", border: "#334155" },
  warm: { bg: "#2a2218", border: "rgba(217,119,6,0.25)" },
  cool: { bg: "#122234", border: "rgba(148,163,184,0.25)" },
}

export default function Statistics({ transactions, theme, categoryMap, trips }) {
  const [period, setPeriod] = useState("month")
  const [selectedTripId, setSelectedTripId] = useState(trips[0]?.id ?? null)
  const tooltipColors = TOOLTIP_COLORS[theme] || TOOLTIP_COLORS.dark
  const selectedTrip = trips.find((t) => t.id === selectedTripId) ?? null

  const filtered = useMemo(() => {
    if (period === "travel") {
      if (!selectedTripId) return []
      return transactions.filter(
        (t) => t.type === "expense" && t.tripId === selectedTripId
      )
    }
    const now = new Date()
    let cutoff = null
    if (period === "month") {
      const key = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
      return transactions.filter(
        (t) => t.type === "expense" && t.date?.startsWith(key)
      )
    }
    if (period === "3months") {
      const d = new Date(now)
      d.setMonth(d.getMonth() - 3)
      cutoff = isoDate(d)
    }
    return transactions.filter(
      (t) => t.type === "expense" && (!cutoff || t.date >= cutoff)
    )
  }, [transactions, period, selectedTripId])

  const tripSpent = useMemo(
    () => filtered.reduce((s, t) => s + t.amount, 0),
    [filtered]
  )

  const rows = useMemo(() => {
    const sums = {}
    for (const t of filtered) {
      sums[t.category] = (sums[t.category] || 0) + t.amount
    }
    const total = Object.values(sums).reduce((s, v) => s + v, 0)
    return Object.entries(sums)
      .map(([category, amount]) => ({
        category,
        amount,
        percent: total > 0 ? (amount / total) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount)
  }, [filtered])

  return (
    <div className="flex flex-col gap-5 px-4 pt-4">
      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {PERIODS.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => setPeriod(p.key)}
            className={`shrink-0 px-4 py-2 rounded-2xl text-sm font-semibold transition-colors duration-300 ${
              period === p.key ? "bg-accent text-white" : "bg-surface text-secondary"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {period === "travel" && trips.length === 0 ? (
        <div className="flex items-center justify-center pt-16">
          <p className="text-tertiary">Нет путешествий</p>
        </div>
      ) : (
        <>
          {period === "travel" && (
            <select
              value={selectedTripId ?? ""}
              onChange={(e) => setSelectedTripId(e.target.value || null)}
              className="w-full bg-surface rounded-2xl px-4 py-3 text-primary outline-none"
            >
              {trips.map((trip) => (
                <option key={trip.id} value={trip.id}>
                  {trip.name}
                </option>
              ))}
            </select>
          )}

          {period === "travel" && selectedTrip && (
            <div className="bg-surface rounded-2xl p-4 shadow-lg flex items-center justify-between">
              <span className="text-sm text-primary font-medium">Потрачено</span>
              <span className="text-sm font-semibold text-primary">
                {fmt(tripSpent)}
                {selectedTrip.budgetLimit > 0 ? ` из ${fmt(selectedTrip.budgetLimit)}` : ""}
              </span>
            </div>
          )}

          {rows.length === 0 ? (
            <div className="flex items-center justify-center pt-8">
              <p className="text-tertiary">Нет расходов</p>
            </div>
          ) : (
        <>
          <div className="bg-surface rounded-2xl p-4 shadow-lg">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={rows}
                  dataKey="amount"
                  nameKey="category"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={2}
                >
                  {rows.map((r) => (
                    <Cell key={r.category} fill={categoryMap[r.category]?.hex} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [fmt(value), categoryMap[name]?.name]}
                  contentStyle={{
                    background: tooltipColors.bg,
                    border: `1px solid ${tooltipColors.border}`,
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-surface rounded-2xl p-4 shadow-lg flex flex-col gap-3">
            {rows.map((r) => (
              <div key={r.category} className="flex items-center gap-3">
                <span
                  className={`w-3 h-3 rounded-full shrink-0 ${categoryBgClass(categoryMap[r.category]?.hex)}`}
                />
                <span className="text-xl">{categoryMap[r.category]?.emoji}</span>
                <span className="flex-1 text-sm text-primary">
                  {categoryMap[r.category]?.name}
                </span>
                <span className="text-xs text-secondary w-12 text-right">
                  {r.percent.toFixed(0)}%
                </span>
                <span className="text-sm font-semibold text-primary w-24 text-right">
                  {fmt(r.amount)}
                </span>
              </div>
            ))}
          </div>

          <div className="bg-surface rounded-2xl p-4 shadow-lg">
            <p className="text-sm text-secondary leading-relaxed">
              Твоя самая дорогая категория — {categoryMap[rows[0].category]?.name}{" "}
              ({rows[0].percent.toFixed(0)}% бюджета).{" "}
              {rows[0].percent >= 35
                ? "Рекомендуем пересмотреть расходы."
                : "Расходы распределены достаточно равномерно."}
            </p>
          </div>
            </>
          )}
        </>
      )}
    </div>
  )
}

import { useMemo, useState } from "react"
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts"
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Lightbulb,
  Target,
  Users,
  X,
  Plane,
} from "lucide-react"
import { widthPercentClass } from "../utils/progressWidth"
import { toLocalISODate } from "../utils/date"

function fmt(n) {
  return Math.round(n).toLocaleString("ru-RU") + " ₽"
}

const isoDate = toLocalISODate

function shortDate(iso) {
  const [, m, d] = iso.split("-")
  return `${d}.${m}`
}

const CHART_COLORS = {
  light: { grid: "#e2e8f0", tick: "#64748b", tooltipBg: "#ffffff", tooltipBorder: "#e2e8f0", tooltipText: "#1f2937" },
  dark: { grid: "#334155", tick: "#94a3b8", tooltipBg: "#1a1f2e", tooltipBorder: "#334155", tooltipText: "#f1f5f9" },
  warm: { grid: "rgba(217,119,6,0.25)", tick: "#a68f76", tooltipBg: "#2a2218", tooltipBorder: "rgba(217,119,6,0.25)", tooltipText: "#f5f1ed" },
  cool: { grid: "rgba(148,163,184,0.25)", tick: "#a8c5d6", tooltipBg: "#122234", tooltipBorder: "rgba(148,163,184,0.25)", tooltipText: "#e6f1f6" },
}

export default function Dashboard({
  transactions,
  monthlyGoal,
  setMonthlyGoal,
  budgets,
  theme,
  categoryMap,
  trips,
}) {
  const chartColors = CHART_COLORS[theme] || CHART_COLORS.dark
  const [selectedInsight, setSelectedInsight] = useState(null)
  const now = useMemo(() => new Date(), [])
  const currentMonthKey = `${now.getFullYear()}-${String(
    now.getMonth() + 1
  ).padStart(2, "0")}`
  const lastMonthDate = useMemo(() => {
    const d = new Date(now)
    d.setDate(1)
    d.setMonth(d.getMonth() - 1)
    return d
  }, [now])
  const lastMonthKey = `${lastMonthDate.getFullYear()}-${String(
    lastMonthDate.getMonth() + 1
  ).padStart(2, "0")}`

  const balance = useMemo(() => {
    return transactions.reduce(
      (sum, t) => sum + (t.type === "income" ? t.amount : -t.amount),
      0
    )
  }, [transactions])

  const { monthlyIncome, monthlyExpense } = useMemo(() => {
    let income = 0
    let expense = 0
    for (const t of transactions) {
      if (t.date?.startsWith(currentMonthKey)) {
        if (t.type === "income") income += t.amount
        else expense += t.amount
      }
    }
    return { monthlyIncome: income, monthlyExpense: expense }
  }, [transactions, currentMonthKey])

  const last30 = useMemo(() => {
    const days = []
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      days.push(isoDate(d))
    }
    const map = Object.fromEntries(
      days.map((iso) => [iso, { date: shortDate(iso), income: 0, expense: 0 }])
    )
    for (const t of transactions) {
      if (map[t.date]) {
        if (t.type === "income") map[t.date].income += t.amount
        else map[t.date].expense += t.amount
      }
    }
    return days.map((iso) => map[iso])
  }, [transactions, now])

  const last3 = useMemo(
    () => [...transactions].sort((a, b) => b.timestamp - a.timestamp).slice(0, 3),
    [transactions]
  )

  const { sparkline, trendPercent, trendUp } = useMemo(() => {
    const days7 = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      days7.push(isoDate(d))
    }
    const days14 = []
    for (let i = 13; i >= 7; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      days14.push(isoDate(d))
    }
    const sumExpense = (iso) =>
      transactions
        .filter((t) => t.date === iso && t.type === "expense")
        .reduce((s, t) => s + t.amount, 0)

    const spark = days7.map((iso, i) => ({ i, value: sumExpense(iso) }))
    const thisWeek = days7.reduce((s, iso) => s + sumExpense(iso), 0)
    const prevWeek = days14.reduce((s, iso) => s + sumExpense(iso), 0)

    let percent = 0
    if (prevWeek > 0) percent = ((thisWeek - prevWeek) / prevWeek) * 100
    else if (thisWeek > 0) percent = 100

    return {
      sparkline: spark,
      trendPercent: Math.round(percent),
      trendUp: thisWeek >= prevWeek,
    }
  }, [transactions, now])

  const exceededCategories = useMemo(() => {
    const spentByCategory = {}
    for (const t of transactions) {
      if (t.type === "expense" && t.date?.startsWith(currentMonthKey)) {
        spentByCategory[t.category] = (spentByCategory[t.category] || 0) + t.amount
      }
    }
    return Object.entries(budgets)
      .filter(([cat, limit]) => limit > 0 && (spentByCategory[cat] || 0) > limit)
      .map(([cat]) => cat)
  }, [transactions, budgets, currentMonthKey])

  const tripStats = useMemo(() => {
    return trips.map((trip) => {
      const spent = transactions
        .filter((t) => t.type === "expense" && t.tripId === trip.id)
        .reduce((s, t) => s + t.amount, 0)
      const progress =
        trip.budgetLimit > 0 ? Math.min(100, (spent / trip.budgetLimit) * 100) : 0
      return { ...trip, spent, progress }
    })
  }, [trips, transactions])

  const netSavings = monthlyIncome - monthlyExpense
  const goalProgress =
    monthlyGoal > 0 ? Math.min(100, Math.max(0, (netSavings / monthlyGoal) * 100)) : 0
  const remainingToGoal = Math.max(monthlyGoal - netSavings, 0)

  const { lastMonthIncome, lastMonthExpense, categoryDeltas } = useMemo(() => {
    let income = 0
    let expense = 0
    const thisMonthByCategory = {}
    const lastMonthByCategory = {}
    for (const t of transactions) {
      if (t.date?.startsWith(lastMonthKey)) {
        if (t.type === "income") income += t.amount
        else {
          expense += t.amount
          lastMonthByCategory[t.category] = (lastMonthByCategory[t.category] || 0) + t.amount
        }
      } else if (t.type === "expense" && t.date?.startsWith(currentMonthKey)) {
        thisMonthByCategory[t.category] = (thisMonthByCategory[t.category] || 0) + t.amount
      }
    }
    const deltas = Object.keys(lastMonthByCategory)
      .map((cat) => {
        const before = lastMonthByCategory[cat]
        const after = thisMonthByCategory[cat] || 0
        const percent = before > 0 ? ((after - before) / before) * 100 : 0
        return { category: cat, percent }
      })
      .sort((a, b) => a.percent - b.percent)
    return { lastMonthIncome: income, lastMonthExpense: expense, categoryDeltas: deltas }
  }, [transactions, currentMonthKey, lastMonthKey])

  const insights = useMemo(() => {
    const list = []

    if (lastMonthExpense > 0) {
      const percent = Math.round(((monthlyExpense - lastMonthExpense) / lastMonthExpense) * 100)
      list.push({
        key: "trend",
        icon: percent >= 0 ? TrendingUp : TrendingDown,
        text: `Траты ${percent >= 0 ? "выросли" : "снизились"} на ${percent >= 0 ? "+" : ""}${percent}% vs прошлый месяц`,
        detail: `В этом месяце расходы составили ${fmt(monthlyExpense)}, в прошлом — ${fmt(lastMonthExpense)}.`,
      })
    }

    const biggestDrop = categoryDeltas.find((d) => d.percent < 0)
    if (biggestDrop) {
      const cat = categoryMap[biggestDrop.category]
      list.push({
        key: "saving",
        icon: TrendingDown,
        text: `Экономия на ${cat?.name ?? "категории"} ${Math.round(biggestDrop.percent)}%`,
        detail: `Расходы по категории ${cat?.name ?? ""} снизились на ${Math.abs(
          Math.round(biggestDrop.percent)
        )}% по сравнению с прошлым месяцем.`,
      })
    }

    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
    const daysPassed = now.getDate()
    const dailyAvg = daysPassed > 0 ? monthlyExpense / daysPassed : 0
    const projected = dailyAvg * daysInMonth
    const planTotal = Object.values(budgets).reduce((s, v) => s + (v > 0 ? v : 0), 0)
    list.push({
      key: "projection",
      icon: Lightbulb,
      text:
        planTotal > 0
          ? `В таком темпе потратишь ${fmt(projected)} (${
              projected <= planTotal ? "на " + fmt(planTotal - projected) + " меньше плана" : "на " + fmt(projected - planTotal) + " больше плана"
            })`
          : `В таком темпе потратишь ~${fmt(projected)} в этом месяце`,
      detail: `Средний расход в день: ${fmt(dailyAvg)}. Дней в месяце: ${daysInMonth}.`,
    })

    const daysLeft = Math.max(daysInMonth - daysPassed, 0)
    list.push({
      key: "goal",
      icon: Target,
      text: `До цели осталось ${fmt(remainingToGoal)} (${daysLeft} дн.)`,
      detail: `Цель на месяц: ${fmt(monthlyGoal)}. Накоплено (доходы минус расходы): ${fmt(netSavings)}.`,
    })

    list.push({
      key: "compare",
      icon: Users,
      text: "Сравнение с прошлым месяцем",
      detail: `Доходы: ${fmt(monthlyIncome)} (было ${fmt(lastMonthIncome)}). Расходы: ${fmt(
        monthlyExpense
      )} (было ${fmt(lastMonthExpense)}).`,
    })

    return list
  }, [
    monthlyExpense,
    lastMonthExpense,
    lastMonthIncome,
    monthlyIncome,
    categoryDeltas,
    categoryMap,
    budgets,
    now,
    remainingToGoal,
    monthlyGoal,
    netSavings,
  ])

  return (
    <div className="flex flex-col gap-4 px-4 pt-4">
      <div className="bg-surface rounded-2xl p-5 shadow-lg">
        <p className="text-secondary text-sm">Баланс</p>
        <p className="text-4xl font-bold text-primary mt-1">{fmt(balance)}</p>
      </div>

      <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-4 px-4 snap-x snap-mandatory">
        {insights.map((insight) => (
          <button
            key={insight.key}
            type="button"
            onClick={() => setSelectedInsight(insight)}
            className="card-hover snap-start shrink-0 w-[220px] bg-surface rounded-2xl p-4 text-left shadow-lg"
          >
            <insight.icon size={18} className="text-[var(--brand)] mb-2" />
            <p className="text-sm text-primary leading-snug">{insight.text}</p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-surface rounded-2xl p-4 shadow-lg">
          <p className="text-secondary text-xs">Доходы (месяц)</p>
          <p className="text-xl font-bold text-accent mt-1">{fmt(monthlyIncome)}</p>
        </div>
        <div className="bg-surface rounded-2xl p-4 shadow-lg">
          <p className="text-secondary text-xs">Расходы (месяц)</p>
          <p className="text-xl font-bold text-danger mt-1">{fmt(monthlyExpense)}</p>
        </div>
      </div>

      {tripStats.length > 0 && (
        <div className="bg-surface rounded-2xl p-4 shadow-lg">
          <p className="text-secondary text-sm mb-3 flex items-center gap-2">
            <Plane size={16} className="text-[var(--brand)]" />
            Путешествия
          </p>
          <div className="flex flex-col gap-4">
            {tripStats.map((trip) => (
              <div key={trip.id}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-primary font-medium">{trip.name}</span>
                  <span className="text-xs text-secondary">
                    {fmt(trip.spent)}
                    {trip.budgetLimit > 0 ? ` из ${fmt(trip.budgetLimit)}` : ""}
                  </span>
                </div>
                {trip.budgetLimit > 0 && (
                  <div className="w-full h-2 bg-input rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${widthPercentClass(
                        trip.progress
                      )} ${trip.spent > trip.budgetLimit ? "bg-danger" : "bg-[var(--brand)]"}`}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {exceededCategories.length > 0 && (
        <div className="bg-danger/15 border border-danger rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle size={20} className="text-danger shrink-0 mt-0.5" />
          <p className="text-sm text-danger">
            Превышен бюджет по категориям:{" "}
            {exceededCategories.map((c) => categoryMap[c]?.name).join(", ")}
          </p>
        </div>
      )}

      <div className="bg-surface rounded-2xl p-4 shadow-lg">
        <div className="flex items-center justify-between mb-2">
          <p className="text-secondary text-sm">Тренд расходов (7 дней)</p>
          <span
            className={`flex items-center gap-1 text-sm font-semibold ${
              trendUp ? "text-danger" : "text-accent"
            }`}
          >
            {trendUp ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            {trendUp ? "+" : ""}
            {trendPercent}% vs прошлая неделя
          </span>
        </div>
        <ResponsiveContainer width="100%" height={50}>
          <LineChart data={sparkline}>
            <Line
              type="monotone"
              dataKey="value"
              stroke={trendUp ? "#ef4444" : "#10b981"}
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-surface rounded-2xl p-4 shadow-lg">
        <p className="text-secondary text-sm mb-2">Доходы / расходы за 30 дней</p>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={last30}>
            <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 9, fill: chartColors.tick }}
              interval={4}
              axisLine={false}
              tickLine={false}
            />
            <YAxis hide />
            <Tooltip
              contentStyle={{
                background: chartColors.tooltipBg,
                border: `1px solid ${chartColors.tooltipBorder}`,
                borderRadius: 12,
                fontSize: 12,
              }}
              labelStyle={{ color: chartColors.tooltipText }}
            />
            <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-surface rounded-2xl p-4 shadow-lg">
        <p className="text-secondary text-sm mb-3">Цель на месяц</p>
        <input
          type="range"
          min={0}
          max={1000000}
          step={1000}
          value={monthlyGoal}
          onChange={(e) => setMonthlyGoal(e.target.value)}
          className="w-full accent-accent"
        />
        <div className="flex justify-between text-xs text-secondary mt-1">
          <span>0 ₽</span>
          <span className="text-primary font-semibold">{fmt(monthlyGoal)}</span>
          <span>1 000 000 ₽</span>
        </div>
        <div className="w-full h-3 bg-input rounded-full mt-3 overflow-hidden">
          <div
            className={`h-full bg-accent rounded-full transition-all duration-300 ${widthPercentClass(
              goalProgress
            )}`}
          />
        </div>
        <p className="text-sm text-secondary mt-2">
          Осталось до цели: {fmt(remainingToGoal)}
        </p>
      </div>

      <div className="bg-surface rounded-2xl p-4 shadow-lg">
        <p className="text-secondary text-sm mb-3">Последние транзакции</p>
        {last3.length === 0 && (
          <p className="text-tertiary text-sm">Нет транзакций</p>
        )}
        <div className="flex flex-col gap-3">
          {last3.map((t) => {
            const cat = t.category ? categoryMap[t.category] : null
            const emoji = cat?.emoji ?? "💰"
            const label = cat?.name ?? (t.type === "income" ? "Доход" : "Прочее")
            return (
              <div key={t.id} className="flex items-center gap-3">
                <span className="text-xl">{emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-primary truncate">
                    {t.type === "income" ? t.note || label : label}
                  </p>
                  {t.type !== "income" && t.note && (
                    <p className="text-xs text-tertiary truncate">{t.note}</p>
                  )}
                </div>
                <span
                  className={`text-sm font-semibold ${
                    t.type === "income" ? "text-accent" : "text-danger"
                  }`}
                >
                  {t.type === "income" ? "+" : "-"}
                  {fmt(t.amount)}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {selectedInsight && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6 animate-fade-in">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setSelectedInsight(null)}
          />
          <div className="relative bg-surface rounded-2xl p-6 w-full max-w-sm shadow-lg">
            <div className="flex items-start justify-between mb-3">
              <selectedInsight.icon size={22} className="text-[var(--brand)]" />
              <button
                type="button"
                onClick={() => setSelectedInsight(null)}
                className="p-1.5 rounded-full bg-input"
              >
                <X size={16} className="text-secondary" />
              </button>
            </div>
            <p className="font-semibold text-primary mb-2">{selectedInsight.text}</p>
            <p className="text-sm text-secondary">{selectedInsight.detail}</p>
          </div>
        </div>
      )}
    </div>
  )
}

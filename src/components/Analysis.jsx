import { useMemo } from "react"
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts"
import { Download, X } from "lucide-react"
import {
  computeMaslowBreakdown,
  computeWeekdayBreakdown,
} from "../utils/maslow"
import { REFERENCE_PROFILE, REFERENCE_PROFILE_LABEL } from "../data/referenceProfile"
import { widthPercentClass } from "../utils/progressWidth"

const CHART_COLORS = {
  light: { grid: "#e2e8f0", tick: "#64748b", tooltipBg: "#ffffff", tooltipBorder: "#e2e8f0", tooltipText: "#1f2937", brand: "#7c3aed" },
  dark: { grid: "#334155", tick: "#94a3b8", tooltipBg: "#1a1f2e", tooltipBorder: "#334155", tooltipText: "#f1f5f9", brand: "#7c3aed" },
  warm: { grid: "rgba(217,119,6,0.25)", tick: "#a68f76", tooltipBg: "#2a2218", tooltipBorder: "rgba(217,119,6,0.25)", tooltipText: "#f5f1ed", brand: "#d97706" },
  cool: { grid: "rgba(148,163,184,0.25)", tick: "#a8c5d6", tooltipBg: "#122234", tooltipBorder: "rgba(148,163,184,0.25)", tooltipText: "#e6f1f6", brand: "#38bdf8" },
}

function fmt(n) {
  return Math.round(n).toLocaleString("ru-RU") + " ₽"
}

export default function Analysis({ transactions, theme, onClose }) {
  const chartColors = CHART_COLORS[theme] || CHART_COLORS.dark
  const maslow = useMemo(() => computeMaslowBreakdown(transactions), [transactions])
  const weekday = useMemo(() => computeWeekdayBreakdown(transactions), [transactions])

  function handleExport() {
    const payload = {
      generatedAt: new Date().toISOString(),
      maslow,
      weekday,
      note: "Профиль сравнения — иллюстративная оценка, не результат реального исследования.",
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `finance-tracker-analysis-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="h-full w-full bg-app overflow-y-auto">
      <div className="px-4 pt-6 pb-10 max-w-md mx-auto flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-primary">Анализ</h1>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full bg-surface"
          >
            <X size={18} className="text-secondary" />
          </button>
        </div>

        <div className="bg-surface rounded-2xl p-4 shadow-lg">
          <p className="text-sm text-secondary mb-3">
            Какой % трат на физиологию vs безопасность vs самовыражение?
          </p>
          <div className="flex flex-col gap-3">
            {maslow.map((m) => (
              <div key={m.key}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-primary">{m.label}</span>
                  <span className="text-xs text-secondary">
                    {m.percent.toFixed(0)}% · {fmt(m.amount)}
                  </span>
                </div>
                <div className="w-full h-2 bg-input rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-[var(--brand)] rounded-full transition-all duration-300 ${widthPercentClass(
                      m.percent
                    )}`}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-tertiary mt-3">
            Группировка категорий по Маслоу приблизительная и иллюстративная.
          </p>
        </div>

        <div className="bg-surface rounded-2xl p-4 shadow-lg">
          <p className="text-sm text-secondary mb-2">Расходы по дням недели</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={weekday}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: chartColors.tick }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis hide />
              <Tooltip
                formatter={(value) => fmt(value)}
                contentStyle={{
                  background: chartColors.tooltipBg,
                  border: `1px solid ${chartColors.tooltipBorder}`,
                  borderRadius: 12,
                  fontSize: 12,
                }}
                labelStyle={{ color: chartColors.tooltipText }}
              />
              <Bar dataKey="amount" fill={chartColors.brand} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-surface rounded-2xl p-4 shadow-lg">
          <p className="text-sm text-secondary mb-3">
            Твой профиль vs {REFERENCE_PROFILE_LABEL}
          </p>
          <div className="flex flex-col gap-4">
            {maslow.map((m) => (
              <div key={m.key}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-primary">{m.label}</span>
                  <span className="text-xs text-secondary">
                    Ты: {m.percent.toFixed(0)}% · Профиль: {REFERENCE_PROFILE[m.key]}%
                  </span>
                </div>
                <div className="relative w-full h-2 bg-input rounded-full overflow-hidden">
                  <div
                    className={`absolute inset-y-0 left-0 bg-[var(--brand)] rounded-full transition-all duration-300 ${widthPercentClass(
                      m.percent
                    )}`}
                  />
                  <div
                    className={`absolute inset-y-0 left-0 border-r-2 border-white/80 h-full ${widthPercentClass(
                      REFERENCE_PROFILE[m.key]
                    )}`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={handleExport}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-accent text-white font-bold transition-transform duration-300 active:scale-95"
        >
          <Download size={18} />
          Экспортировать анализ в JSON
        </button>
      </div>
    </div>
  )
}

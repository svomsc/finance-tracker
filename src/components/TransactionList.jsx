import { useMemo, useRef, useState } from "react"
import { Trash2, X, Paperclip, Plane } from "lucide-react"
import { toLocalISODate } from "../utils/date"
import { useAttachments } from "../hooks/useAttachments"

function fmt(n) {
  return Math.round(n).toLocaleString("ru-RU") + " ₽"
}

function groupLabel(iso) {
  const todayISO = toLocalISODate(new Date())
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayISO = toLocalISODate(yesterday)

  if (iso === todayISO) return "Сегодня"
  if (iso === yesterdayISO) return "Вчера"

  const date = new Date(iso + "T00:00:00")
  return date.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

function Row({ t, onDelete, categoryMap, tripMap }) {
  const [open, setOpen] = useState(false)
  const [previewIndex, setPreviewIndex] = useState(null)
  const startX = useRef(null)
  const cat = t.category ? categoryMap[t.category] : null
  const emoji = cat?.emoji ?? "💰"
  const label = cat?.name ?? (t.type === "income" ? "Доход" : "Прочее")
  const attachments = useAttachments(t.id)
  const trip = t.tripId ? tripMap[t.tripId] : null

  function handleTouchStart(e) {
    startX.current = e.touches[0].clientX
  }

  function handleTouchEnd(e) {
    if (startX.current === null) return
    const delta = e.changedTouches[0].clientX - startX.current
    startX.current = null
    if (delta < -40) setOpen(true)
    else if (delta > 40) setOpen(false)
  }

  return (
    <>
      <div className="relative overflow-hidden rounded-2xl">
        <button
          type="button"
          onClick={() => onDelete(t.id)}
          className="absolute right-0 top-0 h-full w-20 bg-danger flex items-center justify-center"
        >
          <Trash2 size={20} className="text-white" />
        </button>
        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onClick={() => open && setOpen(false)}
          className={`flex flex-col gap-2 bg-surface p-3 transition-transform duration-300 ${
            open ? "-translate-x-20" : "translate-x-0"
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl shrink-0">{emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-primary truncate">
                {t.type === "income" ? t.note || label : label}
              </p>
              {t.type !== "income" && t.note && (
                <p className="text-xs text-tertiary truncate">{t.note}</p>
              )}
              {trip && (
                <span className="inline-flex items-center gap-1 mt-0.5 text-[11px] text-[var(--brand)]">
                  <Plane size={10} />
                  {trip.name}
                </span>
              )}
            </div>
            <span
              className={`text-sm font-semibold shrink-0 ${
                t.type === "income" ? "text-accent" : "text-danger"
              }`}
            >
              {t.type === "income" ? "+" : "-"}
              {fmt(t.amount)}
            </span>
          </div>

          {attachments.length > 0 && (
            <div className="flex gap-2 flex-wrap pl-9">
              {attachments.map((a, i) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setPreviewIndex(i)
                  }}
                  className="w-12 h-12 rounded-lg overflow-hidden shrink-0"
                >
                  {a.type === "image" ? (
                    <img src={a.url} alt="" className="w-12 h-12 object-cover" />
                  ) : (
                    <div className="w-12 h-12 bg-input flex items-center justify-center">
                      <Paperclip size={16} className="text-secondary" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {previewIndex !== null && attachments[previewIndex] && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 animate-fade-in"
          onClick={() => setPreviewIndex(null)}
        >
          <button
            type="button"
            onClick={() => setPreviewIndex(null)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10"
          >
            <X size={20} className="text-white" />
          </button>
          {attachments[previewIndex].type === "image" ? (
            <img
              src={attachments[previewIndex].url}
              alt=""
              className="max-w-[92%] max-h-[85%] rounded-xl object-contain"
            />
          ) : (
            <div className="flex flex-col items-center gap-3 text-white">
              <Paperclip size={40} />
              <p className="text-sm">{attachments[previewIndex].name}</p>
            </div>
          )}
        </div>
      )}
    </>
  )
}

export default function TransactionList({ transactions, deleteTransaction, categoryMap, tripMap }) {
  const groups = useMemo(() => {
    const byDate = {}
    for (const t of transactions) {
      if (!byDate[t.date]) byDate[t.date] = []
      byDate[t.date].push(t)
    }
    return Object.entries(byDate)
      .sort(([a], [b]) => (a < b ? 1 : -1))
      .map(([date, items]) => [
        date,
        [...items].sort((a, b) => b.timestamp - a.timestamp),
      ])
  }, [transactions])

  if (transactions.length === 0) {
    return (
      <div className="flex items-center justify-center h-full px-4 pt-20">
        <p className="text-tertiary">Нет транзакций</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5 px-4 pt-4">
      {groups.map(([date, items]) => (
        <div key={date} className="flex flex-col gap-2">
          <p className="text-sm font-bold text-secondary capitalize">
            {groupLabel(date)}
          </p>
          <div className="flex flex-col gap-2">
            {items.map((t) => (
              <Row key={t.id} t={t} onDelete={deleteTransaction} categoryMap={categoryMap} tripMap={tripMap} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

import { useMemo, useRef, useState } from "react"
import { X, Sparkles, Camera, Image, Paperclip, Plane } from "lucide-react"
import { toLocalISODate } from "../utils/date"
import { suggestCategory } from "../utils/suggestCategory"
import { addAttachment, generateAttachmentId } from "../utils/db"
import CameraCapture from "./CameraCapture"

const NEW_TRIP = "__new__"

function todayISO() {
  return toLocalISODate(new Date())
}

function fmt(n) {
  return Math.round(n).toLocaleString("ru-RU") + " ₽"
}

function uid() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export default function TransactionForm({
  isOpen,
  onClose,
  addTransaction,
  categories,
  transactions,
  trips,
  addTrip,
}) {
  const [amount, setAmount] = useState("")
  const [type, setType] = useState("expense")
  const [category, setCategory] = useState(categories[0]?.key ?? null)
  const [date, setDate] = useState(todayISO())
  const [note, setNote] = useState("")
  const [pendingAttachments, setPendingAttachments] = useState([])
  const [cameraOpen, setCameraOpen] = useState(false)
  const [isTravel, setIsTravel] = useState(false)
  const [selectedTripId, setSelectedTripId] = useState(null)
  const [creatingTrip, setCreatingTrip] = useState(false)
  const [newTripName, setNewTripName] = useState("")
  const [newTripStart, setNewTripStart] = useState(todayISO())
  const [newTripLimit, setNewTripLimit] = useState("")
  const touchStartY = useRef(null)
  const galleryInputRef = useRef(null)
  const fileInputRef = useRef(null)

  const recentAmounts = useMemo(() => {
    if (type !== "expense" || !category) return []
    return transactions
      .filter((t) => t.type === "expense" && t.category === category)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 5)
      .map((t) => t.amount)
  }, [transactions, type, category])

  const suggestedKey = useMemo(() => {
    if (type !== "expense") return null
    const key = suggestCategory(note, categories)
    return key && key !== category ? key : null
  }, [note, categories, type, category])

  if (!isOpen) return null

  function resetForm() {
    setAmount("")
    setType("expense")
    setCategory(categories[0]?.key ?? null)
    setDate(todayISO())
    setNote("")
    pendingAttachments.forEach((a) => URL.revokeObjectURL(a.url))
    setPendingAttachments([])
    setIsTravel(false)
    setSelectedTripId(null)
    setCreatingTrip(false)
    setNewTripName("")
    setNewTripStart(todayISO())
    setNewTripLimit("")
  }

  function handleClose() {
    resetForm()
    onClose()
  }

  function handleSubmit(e) {
    e.preventDefault()
    const value = parseFloat(amount)
    if (!value || value <= 0) return

    const newTx = addTransaction({
      amount: value,
      type,
      category: type === "income" ? null : category,
      date,
      note,
      tripId: type === "expense" && isTravel ? selectedTripId : null,
    })

    pendingAttachments.forEach((a) => {
      addAttachment({
        id: generateAttachmentId(),
        transactionId: newTx.id,
        type: a.kind,
        name: a.name,
        mimeType: a.mimeType,
        blob: a.blob,
        timestamp: Date.now(),
      }).catch(() => {})
    })

    resetForm()
    onClose()
  }

  function handleTouchStart(e) {
    touchStartY.current = e.touches[0].clientY
  }

  function handleTouchEnd(e) {
    if (touchStartY.current === null) return
    const delta = e.changedTouches[0].clientY - touchStartY.current
    touchStartY.current = null
    if (delta > 80) handleClose()
  }

  function addPending(blob, name, mimeType, kind) {
    setPendingAttachments((prev) => [
      ...prev,
      { tempId: uid(), blob, name, mimeType, kind, url: URL.createObjectURL(blob) },
    ])
  }

  function handleGalleryChange(e) {
    const files = Array.from(e.target.files || [])
    files.forEach((file) => addPending(file, file.name, file.type, "image"))
    e.target.value = ""
  }

  function handleFileChange(e) {
    const files = Array.from(e.target.files || [])
    files.forEach((file) =>
      addPending(
        file,
        file.name,
        file.type,
        file.type.startsWith("image/") ? "image" : "file"
      )
    )
    e.target.value = ""
  }

  function handleCameraCapture(blob) {
    addPending(blob, `photo_${Date.now()}.jpg`, "image/jpeg", "image")
    setCameraOpen(false)
  }

  function removePending(tempId) {
    setPendingAttachments((prev) => {
      const item = prev.find((a) => a.tempId === tempId)
      if (item) URL.revokeObjectURL(item.url)
      return prev.filter((a) => a.tempId !== tempId)
    })
  }

  function handleCreateTrip() {
    const name = newTripName.trim()
    if (!name) return
    const trip = addTrip({
      name,
      startDate: newTripStart,
      budgetLimit: newTripLimit,
    })
    setSelectedTripId(trip.id)
    setCreatingTrip(false)
    setNewTripName("")
    setNewTripLimit("")
  }

  const suggestedCategory = suggestedKey
    ? categories.find((c) => c.key === suggestedKey)
    : null

  return (
    <div className="fixed inset-0 z-40 flex items-end animate-fade-in">
      <div
        className="absolute inset-0 bg-black/60"
        onClick={handleClose}
      />
      <div
        className="relative w-full max-w-md mx-auto bg-surface rounded-t-3xl p-6 pb-10 animate-slide-in max-h-[88vh] overflow-y-auto"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="w-10 h-1.5 rounded-full bg-slate-600 mx-auto absolute left-1/2 -translate-x-1/2 -top-2" />
          <h2 className="text-lg font-bold text-primary">Новая транзакция</h2>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-full bg-input transition-colors duration-300"
          >
            <X size={18} className="text-secondary" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex justify-center">
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              autoFocus
              className="w-full text-center text-4xl font-bold bg-transparent text-primary placeholder-app outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setType("income")}
              className={`py-3 rounded-2xl font-semibold transition-colors duration-300 ${
                type === "income"
                  ? "bg-accent text-white"
                  : "bg-input text-secondary"
              }`}
            >
              Доход
            </button>
            <button
              type="button"
              onClick={() => setType("expense")}
              className={`py-3 rounded-2xl font-semibold transition-colors duration-300 ${
                type === "expense"
                  ? "bg-danger text-white"
                  : "bg-input text-secondary"
              }`}
            >
              Расход
            </button>
          </div>

          {type === "expense" && (
            <div>
              <p className="text-sm text-secondary mb-2">Категория</p>
              <div className="grid grid-cols-3 gap-3">
                {categories.map((cat) => {
                  const selected = category === cat.key
                  return (
                    <button
                      key={cat.key}
                      type="button"
                      onClick={() => setCategory(cat.key)}
                      className={`flex flex-col items-center gap-1 py-3 rounded-2xl transition-colors duration-300 ${
                        selected
                          ? "bg-selected ring-2 ring-[var(--brand)]"
                          : "bg-input"
                      }`}
                    >
                      <span className="text-2xl">{cat.emoji}</span>
                      <span className="text-[11px] text-secondary text-center leading-tight">
                        {cat.name}
                      </span>
                    </button>
                  )
                })}
              </div>

              {recentAmounts.length > 0 && (
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <span className="text-xs text-tertiary">Недавно:</span>
                  {recentAmounts.map((value, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setAmount(String(value))}
                      className="px-3 py-1.5 rounded-full bg-input text-secondary text-xs font-semibold transition-colors duration-300"
                    >
                      {fmt(value)}
                    </button>
                  ))}
                </div>
              )}

              {suggestedCategory && (
                <button
                  type="button"
                  onClick={() => setCategory(suggestedCategory.key)}
                  className="mt-3 w-full flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[var(--brand-soft)] text-sm transition-colors duration-300"
                >
                  <Sparkles size={16} className="text-[var(--brand)] shrink-0" />
                  <span className="text-primary">
                    Похоже на {suggestedCategory.emoji} {suggestedCategory.name} — применить?
                  </span>
                </button>
              )}

              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => setIsTravel((v) => !v)}
                  className={`w-full flex items-center gap-2 px-4 py-3 rounded-2xl transition-colors duration-300 ${
                    isTravel ? "bg-selected ring-2 ring-[var(--brand)]" : "bg-input"
                  }`}
                >
                  <Plane size={18} className="text-[var(--brand)]" />
                  <span className="text-sm text-primary">Это часть путешествия?</span>
                </button>

                {isTravel && (
                  <div className="mt-3 flex flex-col gap-3">
                    {!creatingTrip && (
                      <select
                        value={selectedTripId ?? ""}
                        onChange={(e) => {
                          if (e.target.value === NEW_TRIP) {
                            setCreatingTrip(true)
                          } else {
                            setSelectedTripId(e.target.value || null)
                          }
                        }}
                        className="w-full bg-input rounded-2xl px-4 py-3 text-primary outline-none"
                      >
                        <option value="">Выбери путешествие</option>
                        {trips.map((trip) => (
                          <option key={trip.id} value={trip.id}>
                            {trip.name}
                          </option>
                        ))}
                        <option value={NEW_TRIP}>+ Создать новое</option>
                      </select>
                    )}

                    {creatingTrip && (
                      <div className="bg-input rounded-2xl p-4 flex flex-col gap-3">
                        <input
                          type="text"
                          value={newTripName}
                          onChange={(e) => setNewTripName(e.target.value)}
                          placeholder="Название путешествия"
                          className="w-full bg-surface rounded-xl px-4 py-3 text-primary placeholder-app outline-none"
                        />
                        <input
                          type="date"
                          value={newTripStart}
                          onChange={(e) => setNewTripStart(e.target.value)}
                          className="w-full bg-surface rounded-xl px-4 py-3 text-primary outline-none"
                        />
                        <input
                          type="number"
                          inputMode="decimal"
                          min="0"
                          value={newTripLimit}
                          onChange={(e) => setNewTripLimit(e.target.value)}
                          placeholder="Бюджет (необязательно)"
                          className="w-full bg-surface rounded-xl px-4 py-3 text-primary placeholder-app outline-none"
                        />
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => setCreatingTrip(false)}
                            className="py-2.5 rounded-xl bg-surface text-primary font-semibold transition-colors duration-300"
                          >
                            Отмена
                          </button>
                          <button
                            type="button"
                            onClick={handleCreateTrip}
                            className="py-2.5 rounded-xl bg-accent text-white font-semibold transition-colors duration-300"
                          >
                            Создать
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          <div>
            <p className="text-sm text-secondary mb-2">Дата</p>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-input rounded-2xl px-4 py-3 text-primary outline-none"
            />
          </div>

          <div>
            <p className="text-sm text-secondary mb-2">Заметка</p>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={
                type === "income" ? "Например: Дополнительный доход" : "Необязательно"
              }
              rows={2}
              className="w-full bg-input rounded-2xl px-4 py-3 text-primary placeholder-app outline-none resize-none"
            />
          </div>

          <div>
            <p className="text-sm text-secondary mb-2">Фото и файлы</p>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setCameraOpen(true)}
                className="flex flex-col items-center gap-1 py-3 rounded-2xl bg-input transition-colors duration-300"
              >
                <Camera size={18} className="text-secondary" />
                <span className="text-[11px] text-secondary">Камера</span>
              </button>
              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                className="flex flex-col items-center gap-1 py-3 rounded-2xl bg-input transition-colors duration-300"
              >
                <Image size={18} className="text-secondary" />
                <span className="text-[11px] text-secondary">Галерея</span>
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center gap-1 py-3 rounded-2xl bg-input transition-colors duration-300"
              >
                <Paperclip size={18} className="text-secondary" />
                <span className="text-[11px] text-secondary">Файл</span>
              </button>
            </div>
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleGalleryChange}
              className="hidden"
            />
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />

            {pendingAttachments.length > 0 && (
              <div className="flex gap-2 mt-3 flex-wrap">
                {pendingAttachments.map((a) => (
                  <div key={a.tempId} className="relative w-16 h-16">
                    {a.kind === "image" ? (
                      <img
                        src={a.url}
                        alt=""
                        className="w-16 h-16 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-input flex items-center justify-center">
                        <Paperclip size={20} className="text-secondary" />
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => removePending(a.tempId)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-danger flex items-center justify-center"
                    >
                      <X size={12} className="text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-4 rounded-2xl bg-accent text-white font-bold text-lg transition-transform duration-300 active:scale-95"
          >
            Сохранить
          </button>
        </form>
      </div>

      {cameraOpen && (
        <CameraCapture
          onCapture={handleCameraCapture}
          onClose={() => setCameraOpen(false)}
        />
      )}
    </div>
  )
}

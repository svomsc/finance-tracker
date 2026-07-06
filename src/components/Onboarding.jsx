import { useState } from "react"
import { Check, Plus, X } from "lucide-react"
import { CATEGORY_PRESETS, DEFAULT_SELECTED_KEYS, CUSTOM_COLOR_PALETTE } from "../data/categoryPresets"
import { categoryBgClass } from "../utils/categoryColor"

export default function Onboarding({ completeOnboarding }) {
  const [selectedKeys, setSelectedKeys] = useState(() => new Set(DEFAULT_SELECTED_KEYS))
  const [customCategories, setCustomCategories] = useState([])
  const [addingCustom, setAddingCustom] = useState(false)
  const [customName, setCustomName] = useState("")
  const [customColor, setCustomColor] = useState(CUSTOM_COLOR_PALETTE[0])

  function toggleKey(preset) {
    if (preset.required) return
    setSelectedKeys((prev) => {
      const next = new Set(prev)
      if (next.has(preset.key)) next.delete(preset.key)
      else next.add(preset.key)
      return next
    })
  }

  function handleAddCustom() {
    const name = customName.trim()
    if (!name) return
    const key = `custom_${Date.now()}`
    setCustomCategories((prev) => [
      ...prev,
      { key, name, emoji: "🏷️", hex: customColor, keywords: [] },
    ])
    setCustomName("")
    setCustomColor(CUSTOM_COLOR_PALETTE[0])
    setAddingCustom(false)
  }

  function removeCustom(key) {
    setCustomCategories((prev) => prev.filter((c) => c.key !== key))
  }

  function handleContinue() {
    const chosenPresets = CATEGORY_PRESETS.filter(
      (c) => c.required || selectedKeys.has(c.key)
    )
    completeOnboarding([...chosenPresets, ...customCategories])
  }

  return (
    <div className="h-full w-full bg-app overflow-y-auto">
      <div className="px-4 pt-8 pb-28 max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-primary mb-1">Выбери свои категории</h1>
        <p className="text-sm text-secondary mb-6">
          Еда, Транспорт и Жильё включены всегда. Остальное — по вкусу, можно
          изменить позже.
        </p>

        <div className="grid grid-cols-3 gap-3 mb-4">
          {CATEGORY_PRESETS.map((preset) => {
            const selected = preset.required || selectedKeys.has(preset.key)
            return (
              <button
                key={preset.key}
                type="button"
                onClick={() => toggleKey(preset)}
                disabled={preset.required}
                className={`relative flex flex-col items-center gap-1 py-3 rounded-2xl transition-colors duration-300 ${
                  selected ? "bg-selected ring-2 ring-[var(--brand)]" : "bg-surface"
                } ${preset.required ? "opacity-80" : ""}`}
              >
                {selected && (
                  <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[var(--brand)] flex items-center justify-center">
                    <Check size={10} className="text-white" strokeWidth={3} />
                  </span>
                )}
                <span className="text-2xl">{preset.emoji}</span>
                <span className="text-[11px] text-secondary text-center leading-tight">
                  {preset.name}
                </span>
              </button>
            )
          })}

          {customCategories.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => removeCustom(c.key)}
              className="relative flex flex-col items-center gap-1 py-3 rounded-2xl bg-selected ring-2 ring-[var(--brand)] transition-colors duration-300"
            >
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-danger flex items-center justify-center">
                <X size={10} className="text-white" strokeWidth={3} />
              </span>
              <span className="text-2xl">{c.emoji}</span>
              <span className="text-[11px] text-secondary text-center leading-tight">
                {c.name}
              </span>
            </button>
          ))}
        </div>

        {addingCustom ? (
          <div className="bg-surface rounded-2xl p-4 mb-4 flex flex-col gap-3">
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="Название категории"
              autoFocus
              className="w-full bg-input rounded-xl px-4 py-3 text-primary placeholder-app outline-none"
            />
            <div className="flex gap-2 flex-wrap">
              {CUSTOM_COLOR_PALETTE.map((hex) => (
                <button
                  key={hex}
                  type="button"
                  onClick={() => setCustomColor(hex)}
                  className={`w-8 h-8 rounded-full transition-transform duration-300 ${categoryBgClass(hex)} ${
                    customColor === hex ? "scale-110 ring-2 ring-primary" : ""
                  }`}
                />
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setAddingCustom(false)}
                className="py-3 rounded-2xl bg-input text-primary font-semibold transition-colors duration-300"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleAddCustom}
                className="py-3 rounded-2xl bg-accent text-white font-semibold transition-colors duration-300"
              >
                Добавить
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setAddingCustom(true)}
            className="w-full flex items-center justify-center gap-2 py-3 mb-4 rounded-2xl bg-surface text-secondary font-semibold transition-colors duration-300"
          >
            <Plus size={18} />
            Добавить свою
          </button>
        )}

        <button
          type="button"
          onClick={handleContinue}
          className="w-full py-4 rounded-2xl bg-accent text-white font-bold text-lg transition-transform duration-300 active:scale-95"
        >
          Продолжить
        </button>
      </div>
    </div>
  )
}

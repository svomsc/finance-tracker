import { useState } from "react"
import {
  Download,
  Trash2,
  AlertTriangle,
  Sun,
  Moon,
  Flame,
  Snowflake,
  Fingerprint,
  BarChart2,
} from "lucide-react"
import BiometricPrompt from "./BiometricPrompt"

const THEMES = [
  { key: "dark", label: "Dark", icon: Moon },
  { key: "light", label: "Light", icon: Sun },
  { key: "warm", label: "Warm", icon: Flame },
  { key: "cool", label: "Cool", icon: Snowflake },
]

const METHOD_LABELS = {
  webauthn: "Face ID / Touch ID",
  pin: "PIN-код",
}

export default function Settings({
  transactions,
  exportData,
  clearAll,
  clearTrips,
  theme,
  setTheme,
  lockEnabled,
  method,
  isPlatformAuthenticatorAvailable,
  registerWebAuthn,
  setPin,
  disableLock,
  onOpenAnalysis,
}) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmDisableLock, setConfirmDisableLock] = useState(false)
  const [showLockSetup, setShowLockSetup] = useState(false)

  function handleConfirmClear() {
    clearAll()
    clearTrips()
    setConfirmOpen(false)
  }

  return (
    <div className="flex flex-col gap-4 px-4 pt-4">
      <div className="bg-surface rounded-2xl p-4 shadow-lg">
        <p className="text-primary font-semibold mb-3">Тема оформления</p>
        <div className="grid grid-cols-4 gap-2">
          {THEMES.map((t) => {
            const selected = theme === t.key
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTheme(t.key)}
                className={`flex flex-col items-center gap-1.5 py-3 rounded-2xl transition-colors duration-300 ${
                  selected ? "bg-selected ring-2 ring-[var(--brand)]" : "bg-input"
                }`}
              >
                <t.icon size={18} className={selected ? "text-[var(--brand)]" : "text-secondary"} />
                <span className="text-[11px] text-secondary">{t.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="bg-surface rounded-2xl p-4 shadow-lg flex items-center justify-between">
        <div>
          <p className="text-primary font-semibold">Блокировка приложения</p>
          <p className="text-xs text-tertiary">
            {lockEnabled ? `Включено: ${METHOD_LABELS[method] ?? method}` : "Отключено"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => (lockEnabled ? setConfirmDisableLock(true) : setShowLockSetup(true))}
          className={`p-3 rounded-2xl transition-transform duration-300 active:scale-95 ${
            lockEnabled ? "bg-[var(--brand)]" : "bg-input"
          }`}
        >
          <Fingerprint size={20} className={lockEnabled ? "text-white" : "text-secondary"} />
        </button>
      </div>

      <div className="bg-surface rounded-2xl p-4 shadow-lg flex items-center justify-between">
        <div>
          <p className="text-primary font-semibold">Анализ</p>
          <p className="text-xs text-tertiary">Маслоу, дни недели, сравнение</p>
        </div>
        <button
          type="button"
          onClick={onOpenAnalysis}
          className="p-3 rounded-2xl bg-input transition-transform duration-300 active:scale-95"
        >
          <BarChart2 size={20} className="text-secondary" />
        </button>
      </div>

      <div className="bg-surface rounded-2xl p-4 shadow-lg flex items-center justify-between">
        <div>
          <p className="text-primary font-semibold">Экспортировать данные</p>
          <p className="text-xs text-tertiary">
            {transactions.length} транзакций в JSON
          </p>
        </div>
        <button
          type="button"
          onClick={exportData}
          className="p-3 rounded-2xl bg-accent transition-transform duration-300 active:scale-95"
        >
          <Download size={20} className="text-white" />
        </button>
      </div>

      <div className="bg-surface rounded-2xl p-4 shadow-lg flex items-center justify-between">
        <div>
          <p className="text-primary font-semibold">Очистить всё</p>
          <p className="text-xs text-tertiary">Удалить все транзакции и настройки</p>
        </div>
        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          className="p-3 rounded-2xl bg-danger transition-transform duration-300 active:scale-95"
        >
          <Trash2 size={20} className="text-white" />
        </button>
      </div>

      <p className="text-center text-tertiary text-xs mt-6">Finance Tracker v1.0</p>

      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6 animate-fade-in">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setConfirmOpen(false)}
          />
          <div className="relative bg-surface rounded-2xl p-6 w-full max-w-sm shadow-lg">
            <div className="flex flex-col items-center gap-3 text-center">
              <AlertTriangle size={32} className="text-danger" />
              <p className="font-semibold text-primary">Удалить все данные?</p>
              <p className="text-sm text-secondary">
                Это действие необратимо. Все транзакции, бюджеты и цель будут удалены.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-5">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="py-3 rounded-2xl bg-input text-primary font-semibold transition-colors duration-300"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleConfirmClear}
                className="py-3 rounded-2xl bg-danger text-white font-semibold transition-colors duration-300"
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDisableLock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6 animate-fade-in">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setConfirmDisableLock(false)}
          />
          <div className="relative bg-surface rounded-2xl p-6 w-full max-w-sm shadow-lg">
            <div className="flex flex-col items-center gap-3 text-center">
              <AlertTriangle size={32} className="text-danger" />
              <p className="font-semibold text-primary">Отключить блокировку?</p>
              <p className="text-sm text-secondary">
                Приложение перестанет требовать Face ID/PIN при входе.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-5">
              <button
                type="button"
                onClick={() => setConfirmDisableLock(false)}
                className="py-3 rounded-2xl bg-input text-primary font-semibold transition-colors duration-300"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={() => {
                  disableLock()
                  setConfirmDisableLock(false)
                }}
                className="py-3 rounded-2xl bg-danger text-white font-semibold transition-colors duration-300"
              >
                Отключить
              </button>
            </div>
          </div>
        </div>
      )}

      {showLockSetup && (
        <div className="fixed inset-0 z-50">
          <BiometricPrompt
            onDone={() => setShowLockSetup(false)}
            registerWebAuthn={registerWebAuthn}
            setPin={setPin}
            isPlatformAuthenticatorAvailable={isPlatformAuthenticatorAvailable}
          />
        </div>
      )}
    </div>
  )
}

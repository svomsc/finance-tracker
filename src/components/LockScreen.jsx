import { useState } from "react"
import { Fingerprint, Delete } from "lucide-react"

const PIN_LENGTH = 4

export default function LockScreen({ method, verifyWebAuthn, verifyPin }) {
  const [pin, setPin] = useState("")
  const [showPin, setShowPin] = useState(method === "pin")
  const [error, setError] = useState(false)
  const [checking, setChecking] = useState(false)

  async function handleFaceId() {
    setChecking(true)
    setError(false)
    const ok = await verifyWebAuthn()
    setChecking(false)
    if (!ok) setError(true)
  }

  async function handleDigit(d) {
    if (pin.length >= PIN_LENGTH) return
    const next = pin + d
    setPin(next)
    setError(false)
    if (next.length === PIN_LENGTH) {
      const ok = await verifyPin(next)
      if (!ok) {
        setError(true)
        setPin("")
      }
    }
  }

  function handleBackspace() {
    setPin((p) => p.slice(0, -1))
    setError(false)
  }

  return (
    <div className="h-full w-full bg-app flex flex-col items-center justify-center px-6">
      <h1 className="text-xl font-bold text-primary mb-8">Finance Tracker заблокирован</h1>

      {!showPin ? (
        <div className="flex flex-col items-center gap-4">
          <button
            type="button"
            onClick={handleFaceId}
            disabled={checking}
            className="w-20 h-20 rounded-full bg-surface flex items-center justify-center transition-transform duration-300 active:scale-95"
          >
            <Fingerprint size={36} className="text-[var(--brand)]" />
          </button>
          <p className="text-sm text-secondary">
            {checking ? "Проверка..." : "Нажми, чтобы разблокировать"}
          </p>
          {error && <p className="text-sm text-danger">Не удалось подтвердить личность</p>}
          <button
            type="button"
            onClick={() => setShowPin(true)}
            className="text-sm text-[var(--brand)] mt-4"
          >
            Использовать PIN
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-6 w-full max-w-xs">
          <div className="flex gap-3">
            {Array.from({ length: PIN_LENGTH }).map((_, i) => (
              <span
                key={i}
                className={`w-3.5 h-3.5 rounded-full ${
                  i < pin.length ? "bg-[var(--brand)]" : "bg-input"
                }`}
              />
            ))}
          </div>
          {error && <p className="text-sm text-danger">Неверный PIN</p>}
          <div className="grid grid-cols-3 gap-4 w-full">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => handleDigit(d)}
                className="py-4 rounded-2xl bg-surface text-primary text-xl font-semibold transition-colors duration-300"
              >
                {d}
              </button>
            ))}
            <div />
            <button
              type="button"
              onClick={() => handleDigit("0")}
              className="py-4 rounded-2xl bg-surface text-primary text-xl font-semibold transition-colors duration-300"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleBackspace}
              className="py-4 rounded-2xl bg-surface text-primary flex items-center justify-center transition-colors duration-300"
            >
              <Delete size={20} />
            </button>
          </div>
          {method === "webauthn" && (
            <button
              type="button"
              onClick={() => setShowPin(false)}
              className="text-sm text-[var(--brand)]"
            >
              Использовать Face ID
            </button>
          )}
        </div>
      )}
    </div>
  )
}

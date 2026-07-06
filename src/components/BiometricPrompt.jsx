import { useState } from "react"
import { Fingerprint, Delete, ShieldCheck } from "lucide-react"

const PIN_LENGTH = 4

export default function BiometricPrompt({
  onDone,
  registerWebAuthn,
  setPin,
  isPlatformAuthenticatorAvailable,
}) {
  const [stage, setStage] = useState("intro")
  const [isFallback, setIsFallback] = useState(false)
  const [pinDraft, setPinDraft] = useState("")
  const [pinFirst, setPinFirst] = useState("")
  const [error, setError] = useState("")

  async function handleUseFaceId() {
    setError("")
    const available = await isPlatformAuthenticatorAvailable()
    if (!available) {
      setError("Face ID/Touch ID недоступны на этом устройстве. Настрой PIN.")
      setIsFallback(false)
      setStage("pin1")
      return
    }
    try {
      await registerWebAuthn()
      setIsFallback(true)
      setStage("pin1")
    } catch {
      setError("Не удалось настроить Face ID. Настрой PIN.")
      setIsFallback(false)
      setStage("pin1")
    }
  }

  function handleUsePin() {
    setIsFallback(false)
    setStage("pin1")
  }

  function handleSkip() {
    onDone()
  }

  function handleDigit(d) {
    const current = stage === "pin1" ? pinDraft : pinDraft
    if (current.length >= PIN_LENGTH) return
    const next = current + d
    setPinDraft(next)
    if (next.length === PIN_LENGTH) {
      if (stage === "pin1") {
        setPinFirst(next)
        setPinDraft("")
        setStage("pin2")
      } else {
        if (next === pinFirst) {
          setPin(next).then(onDone)
        } else {
          setError("PIN не совпадает, попробуй снова")
          setPinDraft("")
          setPinFirst("")
          setStage("pin1")
        }
      }
    }
  }

  function handleBackspace() {
    setPinDraft((p) => p.slice(0, -1))
  }

  return (
    <div className="h-full w-full bg-app flex flex-col items-center justify-center px-6">
      {stage === "intro" && (
        <div className="flex flex-col items-center gap-5 text-center max-w-xs">
          <div className="w-20 h-20 rounded-full bg-surface flex items-center justify-center">
            <Fingerprint size={36} className="text-[var(--brand)]" />
          </div>
          <h1 className="text-xl font-bold text-primary">
            Использовать Face ID для входа?
          </h1>
          <p className="text-sm text-secondary">
            Защити данные о финансах биометрией этого устройства. Всегда можно
            изменить в Настройках.
          </p>
          <button
            type="button"
            onClick={handleUseFaceId}
            className="w-full py-4 rounded-2xl bg-accent text-white font-bold transition-transform duration-300 active:scale-95"
          >
            Использовать Face ID
          </button>
          <button
            type="button"
            onClick={handleUsePin}
            className="w-full py-3 rounded-2xl bg-surface text-primary font-semibold transition-colors duration-300"
          >
            Настроить PIN
          </button>
          <button type="button" onClick={handleSkip} className="text-sm text-tertiary">
            Пропустить
          </button>
        </div>
      )}

      {(stage === "pin1" || stage === "pin2") && (
        <div className="flex flex-col items-center gap-6 w-full max-w-xs">
          <ShieldCheck size={32} className="text-[var(--brand)]" />
          <h2 className="text-lg font-bold text-primary text-center">
            {isFallback
              ? "Установи резервный PIN"
              : stage === "pin1"
              ? "Придумай PIN"
              : "Повтори PIN"}
          </h2>
          {error && <p className="text-sm text-danger text-center">{error}</p>}
          <div className="flex gap-3">
            {Array.from({ length: PIN_LENGTH }).map((_, i) => (
              <span
                key={i}
                className={`w-3.5 h-3.5 rounded-full ${
                  i < pinDraft.length ? "bg-[var(--brand)]" : "bg-input"
                }`}
              />
            ))}
          </div>
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
          <button type="button" onClick={handleSkip} className="text-sm text-tertiary">
            Пропустить
          </button>
        </div>
      )}
    </div>
  )
}

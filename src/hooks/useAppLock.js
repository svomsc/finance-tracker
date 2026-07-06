import { useState } from "react"

const KEYS = {
  enabled: "ft_lock_enabled",
  method: "ft_lock_method",
  credentialId: "ft_lock_credential_id",
  pinHash: "ft_lock_pin_hash",
  prompted: "ft_lock_prompted",
}

function bufferToBase64(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
}

function base64ToBuffer(base64) {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes.buffer
}

async function hashPin(pin) {
  const data = new TextEncoder().encode(pin)
  const digest = await crypto.subtle.digest("SHA-256", data)
  return bufferToBase64(digest)
}

export function useAppLock() {
  const [lockEnabled, setLockEnabled] = useState(
    () => localStorage.getItem(KEYS.enabled) === "true"
  )
  const [method, setMethod] = useState(() => localStorage.getItem(KEYS.method))
  const [locked, setLocked] = useState(
    () => localStorage.getItem(KEYS.enabled) === "true"
  )
  const [prompted, setPrompted] = useState(
    () => localStorage.getItem(KEYS.prompted) === "true"
  )

  async function isPlatformAuthenticatorAvailable() {
    if (!window.PublicKeyCredential) return false
    try {
      return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
    } catch {
      return false
    }
  }

  async function registerWebAuthn() {
    const challenge = crypto.getRandomValues(new Uint8Array(32))
    const userId = crypto.getRandomValues(new Uint8Array(16))
    const credential = await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: { name: "Finance Tracker" },
        user: { id: userId, name: "user", displayName: "Finance Tracker" },
        pubKeyCredParams: [
          { type: "public-key", alg: -7 },
          { type: "public-key", alg: -257 },
        ],
        authenticatorSelection: {
          authenticatorAttachment: "platform",
          userVerification: "required",
        },
        timeout: 60000,
      },
    })
    const id = bufferToBase64(credential.rawId)
    localStorage.setItem(KEYS.credentialId, id)
    localStorage.setItem(KEYS.method, "webauthn")
    localStorage.setItem(KEYS.enabled, "true")
    setMethod("webauthn")
    setLockEnabled(true)
    setLocked(false)
  }

  async function verifyWebAuthn() {
    const credentialId = localStorage.getItem(KEYS.credentialId)
    if (!credentialId) return false
    const challenge = crypto.getRandomValues(new Uint8Array(32))
    try {
      await navigator.credentials.get({
        publicKey: {
          challenge,
          allowCredentials: [
            { id: base64ToBuffer(credentialId), type: "public-key" },
          ],
          userVerification: "required",
          timeout: 60000,
        },
      })
      setLocked(false)
      return true
    } catch {
      return false
    }
  }

  async function setPin(pin) {
    const hash = await hashPin(pin)
    localStorage.setItem(KEYS.pinHash, hash)
    localStorage.setItem(KEYS.method, "pin")
    localStorage.setItem(KEYS.enabled, "true")
    setMethod("pin")
    setLockEnabled(true)
    setLocked(false)
  }

  async function verifyPin(pin) {
    const stored = localStorage.getItem(KEYS.pinHash)
    const hash = await hashPin(pin)
    if (stored && stored === hash) {
      setLocked(false)
      return true
    }
    return false
  }

  function disableLock() {
    localStorage.removeItem(KEYS.enabled)
    localStorage.removeItem(KEYS.method)
    localStorage.removeItem(KEYS.credentialId)
    localStorage.removeItem(KEYS.pinHash)
    setMethod(null)
    setLockEnabled(false)
    setLocked(false)
  }

  function markPrompted() {
    localStorage.setItem(KEYS.prompted, "true")
    setPrompted(true)
  }

  return {
    lockEnabled,
    method,
    locked,
    prompted,
    isPlatformAuthenticatorAvailable,
    registerWebAuthn,
    verifyWebAuthn,
    setPin,
    verifyPin,
    disableLock,
    markPrompted,
  }
}

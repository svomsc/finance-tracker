import { useEffect, useRef, useState } from "react"
import { X, Camera } from "lucide-react"

export default function CameraCapture({ onCapture, onClose }) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        })
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream
        if (videoRef.current) videoRef.current.srcObject = stream
      } catch {
        if (!cancelled) setError("Не удалось получить доступ к камере")
      }
    }

    start()

    return () => {
      cancelled = true
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  function handleCapture() {
    const video = videoRef.current
    if (!video || !video.videoWidth) return
    const canvas = document.createElement("canvas")
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext("2d").drawImage(video, 0, 0)
    canvas.toBlob((blob) => {
      if (blob) onCapture(blob)
    }, "image/jpeg", 0.9)
  }

  return (
    <div className="fixed inset-0 z-[60] bg-black flex flex-col">
      <div className="flex items-center justify-between p-4">
        <span className="text-white font-semibold">Камера</span>
        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-full bg-white/10"
        >
          <X size={20} className="text-white" />
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center overflow-hidden">
        {error ? (
          <p className="text-white text-sm px-6 text-center">{error}</p>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="max-w-full max-h-full"
          />
        )}
      </div>

      <div className="p-8 flex items-center justify-center">
        <button
          type="button"
          onClick={handleCapture}
          disabled={!!error}
          className="w-16 h-16 rounded-full bg-white flex items-center justify-center disabled:opacity-30"
        >
          <Camera size={26} className="text-black" />
        </button>
      </div>
    </div>
  )
}

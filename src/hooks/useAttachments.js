import { useEffect, useState } from "react"
import { getAttachmentsByTransaction } from "../utils/db"

export function useAttachments(transactionId) {
  const [attachments, setAttachments] = useState([])

  useEffect(() => {
    let cancelled = false
    let urls = []

    if (!transactionId) {
      return
    }

    getAttachmentsByTransaction(transactionId).then((items) => {
      if (cancelled) return
      urls = items.map((item) => URL.createObjectURL(item.blob))
      setAttachments(
        items.map((item, i) => ({ ...item, url: urls[i] }))
      )
    })

    return () => {
      cancelled = true
      urls.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [transactionId])

  return attachments
}

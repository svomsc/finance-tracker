import { useEffect, useState, useCallback } from "react"
import { deleteAttachmentsByTransaction, clearAllAttachments } from "../utils/db"

const KEYS = {
  transactions: "ft_transactions",
  monthlyGoal: "ft_monthlyGoal",
  budgets: "ft_budgets",
}

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

export function useFinances() {
  const [transactions, setTransactions] = useState(() =>
    readJSON(KEYS.transactions, [])
  )
  const [monthlyGoal, setMonthlyGoalState] = useState(() =>
    readJSON(KEYS.monthlyGoal, 50000)
  )
  const [budgets, setBudgets] = useState(() => readJSON(KEYS.budgets, {}))

  useEffect(() => {
    localStorage.setItem(KEYS.transactions, JSON.stringify(transactions))
  }, [transactions])

  useEffect(() => {
    localStorage.setItem(KEYS.monthlyGoal, JSON.stringify(monthlyGoal))
  }, [monthlyGoal])

  useEffect(() => {
    localStorage.setItem(KEYS.budgets, JSON.stringify(budgets))
  }, [budgets])

  const addTransaction = useCallback((tx) => {
    const timestamp = Date.now()
    const newTx = {
      id: String(timestamp),
      amount: Number(tx.amount),
      type: tx.type,
      category: tx.category,
      date: tx.date,
      note: tx.note || "",
      tripId: tx.tripId || null,
      timestamp,
    }
    setTransactions((prev) => [newTx, ...prev])
    return newTx
  }, [])

  const deleteTransaction = useCallback((id) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id))
    deleteAttachmentsByTransaction(id).catch(() => {})
  }, [])

  const clearAll = useCallback(() => {
    setTransactions([])
    setBudgets({})
    setMonthlyGoalState(50000)
    clearAllAttachments().catch(() => {})
  }, [])

  const exportData = useCallback(() => {
    const blob = new Blob([JSON.stringify(transactions, null, 2)], {
      type: "application/json",
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `finance-tracker-export-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }, [transactions])

  const setMonthlyGoal = useCallback((value) => {
    setMonthlyGoalState(Number(value))
  }, [])

  const setBudgetLimit = useCallback((category, limit) => {
    setBudgets((prev) => ({ ...prev, [category]: Number(limit) }))
  }, [])

  return {
    transactions,
    addTransaction,
    deleteTransaction,
    clearAll,
    exportData,
    monthlyGoal,
    setMonthlyGoal,
    budgets,
    setBudgetLimit,
  }
}

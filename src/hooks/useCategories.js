import { useEffect, useState } from "react"
import { CATEGORY_PRESETS, DEFAULT_SELECTED_KEYS } from "../data/categoryPresets"

const KEYS = {
  onboarded: "ft_onboarded",
  categories: "ft_categories",
}

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function defaultCategories() {
  return CATEGORY_PRESETS.filter((c) => DEFAULT_SELECTED_KEYS.includes(c.key))
}

export function useCategories() {
  const [onboarded, setOnboarded] = useState(() => readJSON(KEYS.onboarded, false))
  const [categories, setCategories] = useState(() =>
    readJSON(KEYS.categories, defaultCategories())
  )

  useEffect(() => {
    localStorage.setItem(KEYS.onboarded, JSON.stringify(onboarded))
  }, [onboarded])

  useEffect(() => {
    localStorage.setItem(KEYS.categories, JSON.stringify(categories))
  }, [categories])

  function completeOnboarding(finalCategories) {
    setCategories(finalCategories)
    setOnboarded(true)
  }

  return { onboarded, categories, completeOnboarding }
}

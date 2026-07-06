import { useEffect, useState } from "react"

const KEY = "ft_trips"

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

export function useTravel() {
  const [trips, setTrips] = useState(() => readJSON(KEY, []))

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(trips))
  }, [trips])

  function addTrip({ name, startDate, budgetLimit }) {
    const trip = {
      id: `trip_${Date.now()}`,
      name,
      startDate,
      budgetLimit: Number(budgetLimit) || 0,
    }
    setTrips((prev) => [...prev, trip])
    return trip
  }

  function clearTrips() {
    setTrips([])
  }

  return { trips, addTrip, clearTrips }
}

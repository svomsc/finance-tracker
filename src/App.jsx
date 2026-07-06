import { useEffect, useMemo, useState } from "react"
import { useFinances } from "./hooks/useFinances"
import { useCategories } from "./hooks/useCategories"
import { useTravel } from "./hooks/useTravel"
import { useAppLock } from "./hooks/useAppLock"
import Navigation from "./components/Navigation"
import Dashboard from "./components/Dashboard"
import TransactionList from "./components/TransactionList"
import Statistics from "./components/Statistics"
import BudgetGoals from "./components/BudgetGoals"
import Settings from "./components/Settings"
import TransactionForm from "./components/TransactionForm"
import Onboarding from "./components/Onboarding"
import LockScreen from "./components/LockScreen"
import BiometricPrompt from "./components/BiometricPrompt"
import Analysis from "./components/Analysis"

const VALID_THEMES = ["dark", "light", "warm", "cool"]

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("ft_theme")
    if (saved && VALID_THEMES.includes(saved)) return saved
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light"
  })

  useEffect(() => {
    localStorage.setItem("ft_theme", theme)
    document.documentElement.className = `theme-${theme}`
  }, [theme])

  const {
    transactions,
    addTransaction,
    deleteTransaction,
    clearAll,
    exportData,
    monthlyGoal,
    setMonthlyGoal,
    budgets,
    setBudgetLimit,
  } = useFinances()

  const { onboarded, categories, completeOnboarding } = useCategories()
  const { trips, addTrip, clearTrips } = useTravel()
  const {
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
  } = useAppLock()

  const categoryMap = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.key, c])),
    [categories]
  )

  const tripMap = useMemo(
    () => Object.fromEntries(trips.map((t) => [t.id, t])),
    [trips]
  )

  if (!onboarded) {
    return <Onboarding completeOnboarding={completeOnboarding} />
  }

  if (lockEnabled && locked) {
    return (
      <LockScreen method={method} verifyWebAuthn={verifyWebAuthn} verifyPin={verifyPin} />
    )
  }

  if (!prompted) {
    return (
      <BiometricPrompt
        onDone={markPrompted}
        registerWebAuthn={registerWebAuthn}
        setPin={setPin}
        isPlatformAuthenticatorAvailable={isPlatformAuthenticatorAvailable}
      />
    )
  }

  if (activeTab === "analysis") {
    return (
      <Analysis
        transactions={transactions}
        theme={theme}
        onClose={() => setActiveTab("dashboard")}
      />
    )
  }

  return (
    <div className="h-full w-full flex flex-col bg-app">
      <main className="flex-1 overflow-y-auto pb-28">
        {activeTab === "dashboard" && (
          <Dashboard
            transactions={transactions}
            monthlyGoal={monthlyGoal}
            setMonthlyGoal={setMonthlyGoal}
            budgets={budgets}
            theme={theme}
            categoryMap={categoryMap}
            trips={trips}
          />
        )}
        {activeTab === "list" && (
          <TransactionList
            transactions={transactions}
            deleteTransaction={deleteTransaction}
            categoryMap={categoryMap}
            tripMap={tripMap}
          />
        )}
        {activeTab === "stats" && (
          <Statistics
            transactions={transactions}
            theme={theme}
            categoryMap={categoryMap}
            trips={trips}
          />
        )}
        {activeTab === "budgets" && (
          <BudgetGoals
            transactions={transactions}
            budgets={budgets}
            setBudgetLimit={setBudgetLimit}
            categories={categories}
          />
        )}
        {activeTab === "settings" && (
          <Settings
            transactions={transactions}
            exportData={exportData}
            clearAll={clearAll}
            clearTrips={clearTrips}
            theme={theme}
            setTheme={setTheme}
            lockEnabled={lockEnabled}
            method={method}
            isPlatformAuthenticatorAvailable={isPlatformAuthenticatorAvailable}
            registerWebAuthn={registerWebAuthn}
            setPin={setPin}
            disableLock={disableLock}
            onOpenAnalysis={() => setActiveTab("analysis")}
          />
        )}
      </main>

      <Navigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onAddClick={() => setIsFormOpen(true)}
      />

      <TransactionForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        addTransaction={addTransaction}
        categories={categories}
        transactions={transactions}
        trips={trips}
        addTrip={addTrip}
      />
    </div>
  )
}

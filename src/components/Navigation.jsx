import { Home, List, PieChart, Target, Settings, Plus } from "lucide-react"

const TABS = [
  { key: "dashboard", label: "Главная", icon: Home },
  { key: "list", label: "История", icon: List },
  null,
  { key: "stats", label: "Статистика", icon: PieChart },
  { key: "budgets", label: "Бюджеты", icon: Target },
]

export default function Navigation({ activeTab, onTabChange, onAddClick }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-surface/95 backdrop-blur border-t border-app pb-safe">
      <div className="flex items-end justify-around px-2 pt-2 pb-2 max-w-md mx-auto">
        {TABS.map((tab) =>
          tab === null ? (
            <button
              key="add"
              type="button"
              onClick={onAddClick}
              className="flex flex-col items-center -mt-6 transition-transform duration-300 active:scale-95"
            >
              <span className="w-14 h-14 rounded-full bg-accent flex items-center justify-center shadow-lg shadow-accent/40">
                <Plus size={28} className="text-white" strokeWidth={2.5} />
              </span>
            </button>
          ) : (
            <button
              key={tab.key}
              type="button"
              onClick={() => onTabChange(tab.key)}
              className="flex flex-col items-center gap-1 py-1 px-2 min-w-[56px] transition-colors duration-300"
            >
              <tab.icon
                size={22}
                className={
                  activeTab === tab.key ? "text-accent" : "text-secondary"
                }
              />
              <span
                className={`text-[11px] ${
                  activeTab === tab.key ? "text-accent" : "text-secondary"
                }`}
              >
                {tab.label}
              </span>
            </button>
          )
        )}
        <button
          type="button"
          onClick={() => onTabChange("settings")}
          className="flex flex-col items-center gap-1 py-1 px-2 min-w-[56px] transition-colors duration-300"
        >
          <Settings
            size={22}
            className={
              activeTab === "settings" ? "text-accent" : "text-secondary"
            }
          />
          <span
            className={`text-[11px] ${
              activeTab === "settings" ? "text-accent" : "text-secondary"
            }`}
          >
            Настройки
          </span>
        </button>
      </div>
    </nav>
  )
}

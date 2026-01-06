export type TabId = 'today' | 'tomorrow' | 'deferred'

interface TabBarProps {
  activeTab: TabId
  onTabChange: (tab: TabId) => void
}

const tabs: { id: TabId; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'tomorrow', label: 'Tomorrow' },
  { id: 'deferred', label: 'Deferred' },
]

export const TabBar = ({ activeTab, onTabChange }: TabBarProps) => {
  return (
    <nav className="flex gap-1 rounded-lg bg-surface-muted p-1">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              flex-1 rounded-md px-4 py-2
              font-body text-sm font-medium
              transition-all duration-150
              ${
                isActive
                  ? 'bg-surface text-foreground shadow-sm'
                  : 'bg-transparent text-muted-foreground hover:bg-surface/50'
              }
            `}
          >
            {tab.label}
          </button>
        )
      })}
    </nav>
  )
}

import { useState } from 'react'
import { Header } from './components/Header'
import { TabBar, type TabId } from './components/TabBar'
import { TodayView } from './views/TodayView'
import { useTasks } from './hooks/useTasks'

export const App = () => {
  const [activeTab, setActiveTab] = useState<TabId>('today')
  const { tasks, addTask, newTaskIds } = useTasks()

  const renderView = () => {
    switch (activeTab) {
      case 'today':
        return <TodayView tasks={tasks} onAddTask={addTask} newTaskIds={newTaskIds} />
      case 'tomorrow':
        return (
          <div className="flex items-center justify-center rounded-lg border border-border-subtle bg-surface-muted p-12 text-muted-foreground">
            Tomorrow View
          </div>
        )
      case 'deferred':
        return (
          <div className="flex items-center justify-center rounded-lg border border-border-subtle bg-surface-muted p-12 text-muted-foreground">
            Deferred View
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-[600px] px-4 sm:px-6">
        <Header />
        <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
        <main className="py-6">{renderView()}</main>
      </div>
    </div>
  )
}

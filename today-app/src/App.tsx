import { useState, useCallback } from 'react'
import { Header } from './components/Header'
import { TabBar, type TabId } from './components/TabBar'
import { TodayView } from './views/TodayView'
import { useTasks } from './hooks/useTasks'

export const App = () => {
  const [activeTab, setActiveTab] = useState<TabId>('today')
  const { tasks, addTask, completeTask, deleteTask, newTaskIds } = useTasks()

  // Filter out completed tasks for the Today view
  const todayTasks = tasks.filter(task => task.completedAt === null)

  // Placeholder defer function - full implementation in Story 3.4
  const deferTask = useCallback((id: string) => {
    console.log('[Today] Defer requested for task:', id)
    // Full implementation in Story 3.4
  }, [])

  const renderView = () => {
    switch (activeTab) {
      case 'today':
        return (
          <TodayView
            tasks={todayTasks}
            onAddTask={addTask}
            onCompleteTask={completeTask}
            onDeleteTask={deleteTask}
            onDeferTask={deferTask}
            newTaskIds={newTaskIds}
          />
        )
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

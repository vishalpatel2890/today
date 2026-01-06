import { useState, useCallback } from 'react'
import { Header } from './components/Header'
import { TabBar, type TabId } from './components/TabBar'
import { TodayView } from './views/TodayView'
import { TomorrowView } from './views/TomorrowView'
import { DeferredView } from './views/DeferredView'
import { Toast } from './components/Toast'
import { useTasks } from './hooks/useTasks'

export const App = () => {
  const [activeTab, setActiveTab] = useState<TabId>('today')
  const { tasks, categories, addTask, completeTask, deleteTask, deferTask, addCategory, newTaskIds } = useTasks()

  // Toast state - AC-3.4.3, AC-3.4.4
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: '', visible: false })

  const showToast = useCallback((message: string) => {
    setToast({ message, visible: true })
  }, [])

  const hideToast = useCallback(() => {
    setToast(prev => ({ ...prev, visible: false }))
  }, [])

  const renderView = () => {
    switch (activeTab) {
      case 'today':
        return (
          <TodayView
            tasks={tasks}
            categories={categories}
            onAddTask={addTask}
            onCompleteTask={completeTask}
            onDeleteTask={deleteTask}
            onDeferTask={deferTask}
            onCreateCategory={addCategory}
            onShowToast={showToast}
            newTaskIds={newTaskIds}
          />
        )
      case 'tomorrow':
        return (
          <TomorrowView
            tasks={tasks}
            categories={categories}
            onCompleteTask={completeTask}
            onDeleteTask={deleteTask}
            onDeferTask={deferTask}
            onCreateCategory={addCategory}
            onShowToast={showToast}
          />
        )
      case 'deferred':
        return (
          <DeferredView
            tasks={tasks}
            categories={categories}
            onComplete={completeTask}
            onDelete={deleteTask}
            onDefer={deferTask}
            onCreateCategory={addCategory}
            onShowToast={showToast}
          />
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
      {/* Toast notification - rendered at App level for consistent positioning */}
      <Toast message={toast.message} isVisible={toast.visible} onDismiss={hideToast} />
    </div>
  )
}

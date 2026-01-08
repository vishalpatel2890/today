import { useState, useEffect } from 'react'
import { Header } from './components/Header'
import { TabBar, type TabId } from './components/TabBar'
import { TodayView } from './views/TodayView'
import { TomorrowView } from './views/TomorrowView'
import { DeferredView } from './views/DeferredView'
import { ToastContainer } from './components/Toast'
import { ToastProvider, useToast } from './contexts/ToastContext'
import { useTasks } from './hooks/useTasks'
import { useAuth } from './hooks/useAuth'
import { useAutoSurface } from './hooks/useAutoSurface'
import { LinkEmailModal } from './components/LinkEmailModal'

/**
 * Inner App component that uses toast context
 * Separated to allow useToast hook to work within ToastProvider
 */
const AppContent = () => {
  const [activeTab, setActiveTab] = useState<TabId>('today')
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false)
  const { user, isLoading: isAuthLoading, isLinked, linkEmail, linkingStatus, linkingError, resetLinkingStatus } = useAuth()
  const { tasks, categories, addTask, completeTask, deleteTask, updateTask, updateNotes, addCategory, newTaskIds, storageError } = useTasks(user?.id ?? null)
  const { addToast } = useToast()

  // AC-4.2.5: Auto-surface tasks based on date on app load
  const { todayTasks, tomorrowTasks, deferredTasks } = useAutoSurface(tasks)

  // AC-4.3.3: Show toast when localStorage quota is exceeded
  useEffect(() => {
    if (storageError) {
      addToast('Storage full. Some data may not save.', { type: 'error' })
    }
  }, [storageError, addToast])

  // Show loading state while auth initializes
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  const renderView = () => {
    switch (activeTab) {
      case 'today':
        return (
          <TodayView
            tasks={todayTasks}
            categories={categories}
            onAddTask={addTask}
            onCompleteTask={completeTask}
            onDeleteTask={deleteTask}
            onUpdateTask={updateTask}
            onCreateCategory={addCategory}
            onNotesUpdate={updateNotes}
            newTaskIds={newTaskIds}
          />
        )
      case 'tomorrow':
        return (
          <TomorrowView
            tasks={tomorrowTasks}
            categories={categories}
            onCompleteTask={completeTask}
            onDeleteTask={deleteTask}
            onUpdateTask={updateTask}
            onCreateCategory={addCategory}
            onNotesUpdate={updateNotes}
          />
        )
      case 'deferred':
        return (
          <DeferredView
            tasks={deferredTasks}
            categories={categories}
            onComplete={completeTask}
            onDelete={deleteTask}
            onUpdate={updateTask}
            onCreateCategory={addCategory}
            onNotesUpdate={updateNotes}
          />
        )
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-[600px] px-4 sm:px-6">
        <Header
          isLinked={isLinked}
          email={user?.email}
          onSyncClick={() => setIsLinkModalOpen(true)}
          userId={user?.id ?? null}
        />
        <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
        <main className="py-6">{renderView()}</main>
      </div>
      {/* Toast notifications - AC-4.3.4: bottom-center, AC-4.3.7: stacked */}
      <ToastContainer />
      {/* Link email modal - AC-5.1.7 */}
      <LinkEmailModal
        isOpen={isLinkModalOpen}
        onClose={() => setIsLinkModalOpen(false)}
        onSubmit={linkEmail}
        status={linkingStatus}
        error={linkingError}
        onReset={resetLinkingStatus}
      />
    </div>
  )
}

/**
 * Main App component with ToastProvider wrapper
 */
export const App = () => {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  )
}

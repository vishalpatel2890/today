import { useState, useEffect, useCallback } from 'react'
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
import { useTimeTrackingHotkeys } from './hooks/useTimeTrackingHotkeys'
import { useCompletedTasksHotkey } from './hooks/useCompletedTasksHotkey'
import { LinkEmailModal } from './components/LinkEmailModal'
import { TimeTrackingModal } from './components/time-tracking/TimeTrackingModal'
import { TimeInsightsModal } from './components/time-tracking/TimeInsightsModal'
import { CompletedTasksModal } from './components/CompletedTasksModal'

/**
 * Inner App component that uses toast context
 * Separated to allow useToast hook to work within ToastProvider
 */
const AppContent = () => {
  const [activeTab, setActiveTab] = useState<TabId>('today')
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false)
  const [isTimeTrackingOpen, setIsTimeTrackingOpen] = useState(false)
  const [isInsightsModalOpen, setIsInsightsModalOpen] = useState(false)
  const [isCompletedModalOpen, setIsCompletedModalOpen] = useState(false)
  const { user, isLoading: isAuthLoading, isLinked, linkEmail, linkingStatus, linkingError, resetLinkingStatus, otpStatus, otpError, pendingEmail, verifyOtp, resendOtp, resetOtpStatus } = useAuth()
  const { tasks, categories, addTask, completeTask, uncompleteTask, deleteTask, updateTask, updateNotes, addCategory, newTaskIds, storageError } = useTasks(user?.id ?? null)
  const { addToast } = useToast()

  // AC-4.2.5: Auto-surface tasks based on date on app load
  const { todayTasks, tomorrowTasks, deferredTasks } = useAutoSurface(tasks)

  // Time tracking hotkey handlers (Story 1.1, 2.1)
  const handleOpenTracking = useCallback(() => {
    // Close insights modal if open, then toggle tracking modal (AC3)
    setIsInsightsModalOpen(false)
    setIsTimeTrackingOpen(prev => !prev)
  }, [])

  const handleOpenInsights = useCallback(() => {
    // Close tracking modal if open, then toggle insights modal (Story 2.1 AC3)
    setIsTimeTrackingOpen(false)
    setIsInsightsModalOpen(prev => !prev)
  }, [])

  // Register global hotkeys (AC1, AC2, AC4, AC5, AC6)
  useTimeTrackingHotkeys(handleOpenTracking, handleOpenInsights)

  // Completed tasks modal handler (Story: Completed Tasks View)
  const handleOpenCompleted = useCallback(() => {
    setIsCompletedModalOpen(prev => !prev)
  }, [])

  // Register Cmd+Opt+D hotkey for completed tasks modal (AC1)
  useCompletedTasksHotkey(handleOpenCompleted)

  // Handler for uncompleting a task with toast notification (AC6)
  const handleUncompleteTask = useCallback((id: string) => {
    uncompleteTask(id)
    addToast('Task restored to Today')
  }, [uncompleteTask, addToast])

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
        otpStatus={otpStatus}
        otpError={otpError}
        pendingEmail={pendingEmail}
        onVerifyOtp={verifyOtp}
        onResendOtp={resendOtp}
        onResetOtp={resetOtpStatus}
      />
      {/* Time tracking modal - Story 1.1, 1.2, Epic 4 sync */}
      <TimeTrackingModal
        isOpen={isTimeTrackingOpen}
        onClose={() => setIsTimeTrackingOpen(false)}
        tasks={tasks}
        userId={user?.id ?? null}
      />
      {/* Time insights modal - Story 2.1, 3.3, data isolation fix */}
      <TimeInsightsModal
        isOpen={isInsightsModalOpen}
        onClose={() => setIsInsightsModalOpen(false)}
        userId={user?.id ?? null}
        tasks={tasks}
      />
      {/* Completed tasks modal - Story: Completed Tasks View (AC1-AC10) */}
      <CompletedTasksModal
        isOpen={isCompletedModalOpen}
        onClose={() => setIsCompletedModalOpen(false)}
        tasks={tasks}
        onUncomplete={handleUncompleteTask}
        onUpdateNotes={updateNotes}
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

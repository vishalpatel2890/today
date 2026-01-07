import { useState, useEffect, useRef } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { addDays, startOfDay, format, parseISO, isToday, isTomorrow } from 'date-fns'
import type { Task } from '../types'
import { DatePicker } from './DatePicker'
import { CategoryDropdown } from './CategoryDropdown'

type DateOption = 'today' | 'tomorrow' | 'pick-date' | 'no-date' | null

interface UpdateModalProps {
  task: Task
  categories: string[]
  isOpen: boolean
  onClose: () => void
  onCreateCategory: (name: string) => void
  onUpdate: (text: string, deferredTo: string | null, category: string | null) => void
}

export const UpdateModal = ({ task, categories, isOpen, onClose, onCreateCategory, onUpdate }: UpdateModalProps) => {
  const [taskText, setTaskText] = useState(task.text)
  const [dateOption, setDateOption] = useState<DateOption>(null)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const textInputRef = useRef<HTMLInputElement>(null)

  // Initialize state from task when modal opens
  useEffect(() => {
    if (isOpen) {
      setTaskText(task.text)
      // Initialize date option based on task's current deferredTo
      if (task.deferredTo) {
        const taskDate = parseISO(task.deferredTo)
        if (isToday(taskDate)) {
          setDateOption('today')
          setSelectedDate(startOfDay(new Date()).toISOString())
        } else if (isTomorrow(taskDate)) {
          setDateOption('tomorrow')
          setSelectedDate(addDays(startOfDay(new Date()), 1).toISOString())
        } else {
          setDateOption('pick-date')
          setSelectedDate(task.deferredTo)
        }
      } else {
        setDateOption('no-date')
        setSelectedDate(null)
      }
      // Initialize category
      setSelectedCategory(task.category)
      // Focus text input
      setTimeout(() => textInputRef.current?.focus(), 100)
    }
  }, [isOpen, task])

  // Update button enabled when text is not empty
  const canUpdate = taskText.trim().length > 0

  // Handle update action
  const handleUpdate = () => {
    if (!canUpdate) return
    onUpdate(taskText.trim(), selectedDate, selectedCategory)
    onClose()
  }

  const today = startOfDay(new Date())
  const tomorrow = addDays(today, 1)

  const handleTodayClick = () => {
    setDateOption('today')
    setSelectedDate(today.toISOString())
  }

  const handleTomorrowClick = () => {
    setDateOption('tomorrow')
    setSelectedDate(tomorrow.toISOString())
  }

  const handlePickDateClick = () => {
    setDateOption('pick-date')
    // Keep selectedDate if already set from calendar, otherwise clear
    if (dateOption !== 'pick-date') {
      setSelectedDate(null)
    }
  }

  const handleNoDateClick = () => {
    setDateOption('no-date')
    setSelectedDate(null)
  }

  const handleDateSelect = (date: string | null) => {
    setSelectedDate(date)
  }

  // Format display date for showing selection
  const getDisplayDate = (): string => {
    if (dateOption === 'today') {
      return 'Today'
    }
    if (dateOption === 'tomorrow') {
      return 'Tomorrow'
    }
    if (dateOption === 'pick-date' && selectedDate) {
      return format(parseISO(selectedDate), 'MMM d')
    }
    if (dateOption === 'no-date') {
      return 'No date'
    }
    return ''
  }

  const buttonBaseClass = 'flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors'
  const buttonDefaultClass = 'border border-border bg-surface text-foreground hover:bg-surface-muted'
  const buttonSelectedClass = 'bg-primary text-white'

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 data-[state=open]:animate-fade-in" />
        <Dialog.Content
          className="fixed left-1/2 z-50 w-full -translate-x-1/2 rounded-t-2xl bg-surface p-6 shadow-lg focus:outline-none data-[state=open]:animate-slide-up bottom-0 md:bottom-auto md:top-1/2 md:-translate-y-1/2 md:max-w-md md:rounded-lg"
        >
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="font-display text-lg font-semibold text-foreground">
              Update Task
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                className="rounded-full p-1 text-muted-foreground hover:bg-surface-muted hover:text-foreground transition-colors"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </Dialog.Close>
          </div>

          <div>
            {/* Task Name Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-foreground mb-2">
                Task
              </label>
              <input
                ref={textInputRef}
                type="text"
                value={taskText}
                onChange={(e) => setTaskText(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-base text-foreground focus:border-primary focus:outline-none"
                placeholder="Task name"
              />
            </div>

            {/* Date Selection Section */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-foreground mb-2">
                When?
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleTodayClick}
                  className={`${buttonBaseClass} ${dateOption === 'today' ? buttonSelectedClass : buttonDefaultClass}`}
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={handleTomorrowClick}
                  className={`${buttonBaseClass} ${dateOption === 'tomorrow' ? buttonSelectedClass : buttonDefaultClass}`}
                >
                  Tomorrow
                </button>
                <button
                  type="button"
                  onClick={handlePickDateClick}
                  className={`${buttonBaseClass} ${dateOption === 'pick-date' ? buttonSelectedClass : buttonDefaultClass}`}
                >
                  Pick date
                </button>
                <button
                  type="button"
                  onClick={handleNoDateClick}
                  className={`${buttonBaseClass} ${dateOption === 'no-date' ? buttonSelectedClass : buttonDefaultClass}`}
                >
                  No date
                </button>
              </div>
            </div>

            {/* DatePicker - shown when "Pick date" is selected */}
            {dateOption === 'pick-date' && (
              <DatePicker
                selectedDate={selectedDate}
                onSelect={handleDateSelect}
                minDate={today}
              />
            )}

            {/* Category Section */}
            <div className="mt-4 pt-4 border-t border-border">
              <label className="block text-sm font-medium text-foreground mb-2">
                Category (optional)
              </label>
              <CategoryDropdown
                categories={categories}
                selectedCategory={selectedCategory}
                onSelect={setSelectedCategory}
                onCreate={onCreateCategory}
              />
            </div>

            {/* Selection Summary */}
            {(dateOption || selectedCategory) && (
              <div className="mt-4 p-3 bg-surface-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  {dateOption && (
                    <><span className="text-foreground font-medium">{getDisplayDate()}</span></>
                  )}
                  {dateOption && selectedCategory && ' / '}
                  {selectedCategory && (
                    <span className="text-foreground font-medium">{selectedCategory}</span>
                  )}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2 px-4 text-sm font-medium rounded-md border border-border bg-surface text-foreground hover:bg-surface-muted transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdate}
                disabled={!canUpdate}
                className={`flex-1 py-2 px-4 text-sm font-medium rounded-md bg-primary text-white transition-colors ${
                  canUpdate
                    ? 'hover:bg-primary/90 cursor-pointer'
                    : 'opacity-50 cursor-not-allowed'
                }`}
                title={canUpdate ? 'Update task' : 'Enter task name'}
              >
                Update
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

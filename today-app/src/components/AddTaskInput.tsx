import { useState, type KeyboardEvent } from 'react'

interface AddTaskInputProps {
  onAddTask: (text: string) => void
}

/**
 * Quick add task input component
 * Submits on Enter, validates non-empty input
 * Source: Story 2.2, notes/ux-design-specification.md
 */
export const AddTaskInput = ({ onAddTask }: AddTaskInputProps) => {
  const [value, setValue] = useState('')

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const trimmedValue = value.trim()
      if (trimmedValue === '') {
        return
      }
      onAddTask(trimmedValue)
      setValue('')
    }
  }

  return (
    <input
      type="text"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={handleKeyDown}
      placeholder="Add a task..."
      className="w-full rounded-lg border-2 border-dashed border-border bg-surface p-4 font-body text-base text-foreground transition-all placeholder:text-muted-foreground hover:border-muted-foreground focus:border-solid focus:border-foreground focus:outline-none"
    />
  )
}

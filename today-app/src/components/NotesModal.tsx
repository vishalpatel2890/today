import { useState, useEffect } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import X from 'lucide-react/dist/esm/icons/x'
import Pencil from 'lucide-react/dist/esm/icons/pencil'
import type { Task, TaskNotes } from '../types'
import { NotesEditor } from './NotesEditor'
import { NotesDisplay } from './NotesDisplay'

interface NotesModalProps {
  task: Task
  isOpen: boolean
  onClose: () => void
  onSave: (notes: TaskNotes | null) => void
}

/**
 * NotesModal - Modal for viewing and editing task notes
 * AC #1-3: URLs render as clickable chips with website name
 * AC #4-5: Checklist checkboxes toggle and persist
 * AC #6: All note types render correctly
 * AC #7: Empty notes don't create bad data
 */
export const NotesModal = ({ task, isOpen, onClose, onSave }: NotesModalProps) => {
  const [notesContent, setNotesContent] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [currentNotes, setCurrentNotes] = useState<TaskNotes | null>(null)

  // Initialize state from task when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentNotes(task.notes)
      // Start in view mode if notes exist, edit mode if empty
      const hasNotes = task.notes && task.notes.items.length > 0
      setIsEditing(!hasNotes)

      // Convert stored notes back to editable text format
      if (hasNotes) {
        const text = task.notes!.items.map(item => {
          switch (item.type) {
            case 'bullet':
              return `- ${item.value}`
            case 'checklist':
              return `[${item.checked ? 'x' : ' '}] ${item.value}`
            case 'link':
              return item.value
            default:
              return item.value
          }
        }).join('\n')
        setNotesContent(text)
      } else {
        setNotesContent('')
      }
    }
  }, [isOpen, task.notes])

  // Handle checkbox toggle in view mode (AC #4, #5)
  const handleCheckboxToggle = (itemId: string, checked: boolean) => {
    if (!currentNotes) return

    const updatedItems = currentNotes.items.map(item =>
      item.id === itemId ? { ...item, checked } : item
    )

    const updatedNotes: TaskNotes = {
      items: updatedItems,
      updatedAt: new Date().toISOString()
    }

    setCurrentNotes(updatedNotes)
    // Immediately persist checkbox toggle
    onSave(updatedNotes)
  }

  // Switch to edit mode
  const handleEditClick = () => {
    // Sync current notes state to text content before editing
    if (currentNotes && currentNotes.items.length > 0) {
      const text = currentNotes.items.map(item => {
        switch (item.type) {
          case 'bullet':
            return `- ${item.value}`
          case 'checklist':
            return `[${item.checked ? 'x' : ' '}] ${item.value}`
          case 'link':
            return item.value
          default:
            return item.value
        }
      }).join('\n')
      setNotesContent(text)
    }
    setIsEditing(true)
  }

  // Handle save action (AC #7: empty check)
  const handleSave = () => {
    const trimmedContent = notesContent.trim()

    if (!trimmedContent) {
      onSave(null)
      setCurrentNotes(null)
    } else {
      const parsedNotes = parseNoteInput(trimmedContent)
      onSave(parsedNotes)
      setCurrentNotes(parsedNotes)
    }
    setIsEditing(false)
  }

  // Handle cancel in edit mode
  const handleCancelEdit = () => {
    // Restore from current notes
    if (currentNotes && currentNotes.items.length > 0) {
      const text = currentNotes.items.map(item => {
        switch (item.type) {
          case 'bullet':
            return `- ${item.value}`
          case 'checklist':
            return `[${item.checked ? 'x' : ' '}] ${item.value}`
          case 'link':
            return item.value
          default:
            return item.value
        }
      }).join('\n')
      setNotesContent(text)
      setIsEditing(false)
    } else {
      // No notes to restore, close modal
      onClose()
    }
  }

  const hasNotes = currentNotes && currentNotes.items.length > 0

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 data-[state=open]:animate-fade-in" />
        <Dialog.Content
          className="fixed left-0 right-0 z-50 w-full rounded-t-2xl bg-surface p-6 shadow-lg focus:outline-none data-[state=open]:animate-slide-up bottom-0 md:left-1/2 md:right-auto md:-translate-x-1/2 md:bottom-auto md:top-1/2 md:-translate-y-1/2 md:max-w-lg md:rounded-lg"
        >
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="font-display text-lg font-semibold text-foreground">
              Notes
            </Dialog.Title>
            <div className="flex items-center gap-2">
              {!isEditing && hasNotes && (
                <button
                  type="button"
                  onClick={handleEditClick}
                  className="rounded-full p-1 text-muted-foreground hover:bg-surface-muted hover:text-foreground transition-colors"
                  aria-label="Edit notes"
                >
                  <Pencil className="h-5 w-5" />
                </button>
              )}
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
          </div>

          <div className="mb-4">
            <p className="text-sm text-muted-foreground truncate">{task.text}</p>
          </div>

          {isEditing ? (
            <>
              <NotesEditor
                value={notesContent}
                onChange={setNotesContent}
              />

              <div className="mt-2 text-xs text-muted-foreground">
                <p>Format: <code className="bg-surface-muted px-1 rounded">- bullet</code>, <code className="bg-surface-muted px-1 rounded">[ ] checklist</code>, <code className="bg-surface-muted px-1 rounded">[x] checked</code>, <code className="bg-surface-muted px-1 rounded">https://...</code></p>
              </div>

              {/* Edit Mode Action Buttons */}
              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="flex-1 py-2 px-4 text-sm font-medium rounded-md border border-border bg-surface text-foreground hover:bg-surface-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="flex-1 py-2 px-4 text-sm font-medium rounded-md bg-primary text-white hover:bg-primary/90 transition-colors"
                >
                  Save
                </button>
              </div>
            </>
          ) : (
            <>
              {/* View Mode - Display formatted notes */}
              <div className="min-h-[150px] max-h-[300px] overflow-y-auto rounded-md border border-border bg-background px-3 py-3">
                {hasNotes ? (
                  <NotesDisplay
                    notes={currentNotes!}
                    onCheckboxToggle={handleCheckboxToggle}
                  />
                ) : (
                  <p className="text-muted-foreground italic">No notes yet. Click Edit to add notes.</p>
                )}
              </div>

              {/* View Mode Action Buttons */}
              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2 px-4 text-sm font-medium rounded-md border border-border bg-surface text-foreground hover:bg-surface-muted transition-colors"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleEditClick}
                  className="flex-1 py-2 px-4 text-sm font-medium rounded-md bg-primary text-white hover:bg-primary/90 transition-colors"
                >
                  Edit
                </button>
              </div>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

/**
 * Parse note input text into structured NoteItem array
 */
function parseNoteInput(text: string): TaskNotes {
  const lines = text.split('\n')
  const items = lines
    .map(line => {
      const id = crypto.randomUUID()

      // Checklist: [ ] or [x]
      const checklistMatch = line.match(/^\[([x ])\]\s*(.*)$/i)
      if (checklistMatch) {
        const checked = checklistMatch[1].toLowerCase() === 'x'
        return {
          id,
          type: 'checklist' as const,
          value: checklistMatch[2],
          checked
        }
      }

      // Bullet: - or •
      const bulletMatch = line.match(/^[-•]\s+(.*)$/)
      if (bulletMatch) {
        return {
          id,
          type: 'bullet' as const,
          value: bulletMatch[1]
        }
      }

      // URL detection - full line is a URL
      const urlMatch = line.trim().match(/^https?:\/\/[^\s]+$/)
      if (urlMatch) {
        return {
          id,
          type: 'link' as const,
          value: line.trim(),
          label: extractWebsiteName(line.trim())
        }
      }

      // Plain text
      return {
        id,
        type: 'text' as const,
        value: line
      }
    })
    .filter(item => item.value.trim() !== '')

  return {
    items,
    updatedAt: new Date().toISOString()
  }
}

/**
 * Extract website name from URL for link chips
 */
function extractWebsiteName(url: string): string {
  try {
    const parsed = new URL(url)
    let hostname = parsed.hostname

    // Remove www. prefix
    hostname = hostname.replace(/^www\./, '')

    // Get first part of domain
    const parts = hostname.split('.')
    const name = parts[0]

    // Capitalize first letter
    return name.charAt(0).toUpperCase() + name.slice(1)
  } catch {
    return url
  }
}

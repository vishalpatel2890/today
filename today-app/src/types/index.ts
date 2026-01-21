/**
 * Note item types for task notes
 */
export type NoteItemType = 'text' | 'bullet' | 'checklist' | 'link'

/**
 * Individual note item (text, bullet, checklist, or link)
 */
export interface NoteItem {
  id: string
  type: NoteItemType
  value: string
  checked?: boolean  // Only for checklist type
  label?: string     // Only for link type (website name)
}

/**
 * Task notes structure
 */
export interface TaskNotes {
  items: NoteItem[]
  updatedAt: string
}

/**
 * Task data model for the Today app
 * Source: notes/architecture.md Data Architecture section
 */
export interface Task {
  id: string
  text: string
  createdAt: string
  deferredTo: string | null
  category: string | null
  completedAt: string | null
  notes: TaskNotes | null
  sortOrder: number
}

/**
 * Application state containing tasks and categories
 * Source: notes/architecture.md Data Architecture section
 */
export interface AppState {
  tasks: Task[]
  categories: string[]
}

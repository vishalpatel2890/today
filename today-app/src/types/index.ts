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
}

/**
 * Application state containing tasks and categories
 * Source: notes/architecture.md Data Architecture section
 */
export interface AppState {
  tasks: Task[]
  categories: string[]
}

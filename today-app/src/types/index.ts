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

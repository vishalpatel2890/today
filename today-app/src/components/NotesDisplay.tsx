import Square from 'lucide-react/dist/esm/icons/square'
import CheckSquare from 'lucide-react/dist/esm/icons/check-square'
import type { NoteItem, TaskNotes } from '../types'
import { LinkChip } from './LinkChip'

interface NotesDisplayProps {
  notes: TaskNotes
  onCheckboxToggle: (itemId: string, checked: boolean) => void
}

/**
 * NotesDisplay - Read-only view of notes with interactive checkboxes and link chips
 * AC #1: URLs render as chips
 * AC #2: Chips show website name
 * AC #3: Chips are clickable
 * AC #4: Checklist checkboxes toggle
 * AC #6: All note types render correctly
 */
export const NotesDisplay = ({ notes, onCheckboxToggle }: NotesDisplayProps) => {
  const renderItem = (item: NoteItem) => {
    switch (item.type) {
      case 'bullet':
        return (
          <li key={item.id} className="flex items-start gap-2 text-foreground">
            <span className="text-muted-foreground mt-1.5 text-sm">•</span>
            <span className="flex-1">{item.value}</span>
          </li>
        )

      case 'checklist':
        return (
          <li key={item.id} className="flex items-start gap-2 text-foreground">
            <button
              type="button"
              onClick={() => onCheckboxToggle(item.id, !item.checked)}
              className="flex-shrink-0 mt-0.5 cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
              aria-label={item.checked ? 'Uncheck item' : 'Check item'}
            >
              {item.checked ? (
                <CheckSquare className="h-5 w-5 text-primary" strokeWidth={2} />
              ) : (
                <Square className="h-5 w-5" strokeWidth={2} />
              )}
            </button>
            <span className={`flex-1 ${item.checked ? 'line-through text-muted-foreground' : ''}`}>
              {item.value}
            </span>
          </li>
        )

      case 'link':
        return (
          <li key={item.id} className="py-1">
            <LinkChip url={item.value} label={item.label || item.value} />
          </li>
        )

      case 'text':
      default:
        return (
          <li key={item.id} className="text-foreground">
            {item.value}
          </li>
        )
    }
  }

  return (
    <ul className="space-y-2 list-none p-0 m-0">
      {notes.items.map(renderItem)}
    </ul>
  )
}

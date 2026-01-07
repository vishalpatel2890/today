import { useRef, useEffect } from 'react'

interface NotesEditorProps {
  value: string
  onChange: (value: string) => void
}

/**
 * NotesEditor - Textarea component for editing task notes
 * Supports markdown-like syntax for bullets and checklists
 * AC-1.2.4: Bullets (- item or • item)
 * AC-1.2.5: Checklists ([ ] todo or [x] done)
 */
export const NotesEditor = ({ value, onChange }: NotesEditorProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-focus when mounted
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus()
      // Place cursor at end
      textareaRef.current.selectionStart = textareaRef.current.value.length
      textareaRef.current.selectionEnd = textareaRef.current.value.length
    }
  }, [])

  // Auto-resize textarea based on content
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.min(textarea.scrollHeight, 300)}px`
    }
  }, [value])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Handle Enter key for auto-continuation of lists
    if (e.key === 'Enter' && !e.shiftKey) {
      const textarea = e.currentTarget
      const { selectionStart } = textarea
      const textBefore = value.substring(0, selectionStart)
      const lines = textBefore.split('\n')
      const currentLine = lines[lines.length - 1]

      // Check if current line is a bullet or checklist
      const bulletMatch = currentLine.match(/^([-•]\s+)/)
      const checklistMatch = currentLine.match(/^(\[[ x]\]\s*)/)

      if (bulletMatch || checklistMatch) {
        // If the line is just the prefix (empty list item), clear it
        const prefix = bulletMatch ? bulletMatch[1] : checklistMatch![1]
        if (currentLine.trim() === prefix.trim() || currentLine === prefix) {
          // Remove the empty list item prefix
          e.preventDefault()
          const newValue = textBefore.substring(0, textBefore.length - currentLine.length) +
            '\n' +
            value.substring(selectionStart)
          onChange(newValue)
          // Set cursor position after the change
          setTimeout(() => {
            const newPos = textBefore.length - currentLine.length + 1
            textarea.selectionStart = newPos
            textarea.selectionEnd = newPos
          }, 0)
          return
        }

        // Continue the list on new line
        e.preventDefault()
        const continuation = bulletMatch ? '- ' : '[ ] '
        const newValue = textBefore + '\n' + continuation + value.substring(selectionStart)
        onChange(newValue)

        // Set cursor position after the prefix
        setTimeout(() => {
          const newPos = selectionStart + 1 + continuation.length
          textarea.selectionStart = newPos
          textarea.selectionEnd = newPos
        }, 0)
      }
    }
  }

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={handleKeyDown}
      className="w-full min-h-[150px] max-h-[300px] rounded-md border border-border bg-background px-3 py-2 text-base text-foreground font-mono focus:border-primary focus:outline-none resize-none"
      placeholder="Add notes here...

Use:
- bullet point
[ ] unchecked item
[x] checked item
https://example.com (link)"
    />
  )
}

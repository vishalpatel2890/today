import { useState, useRef, useEffect } from 'react'
import * as Select from '@radix-ui/react-select'
import { ChevronDown, Check, Plus } from 'lucide-react'

interface CategoryDropdownProps {
  categories: string[]
  selectedCategory: string | null
  onSelect: (category: string) => void
  onCreate: (name: string) => void
}

const CREATE_NEW_VALUE = '__create_new__'

export const CategoryDropdown = ({
  categories,
  selectedCategory,
  onSelect,
  onCreate,
}: CategoryDropdownProps) => {
  const [isCreating, setIsCreating] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus input when entering create mode
  useEffect(() => {
    if (isCreating && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isCreating])

  const handleValueChange = (value: string) => {
    if (value === CREATE_NEW_VALUE) {
      setIsCreating(true)
    } else {
      onSelect(value)
    }
  }

  const handleCreateSubmit = () => {
    const trimmedName = newCategoryName.trim()
    if (!trimmedName) return // AC-3.3.6: Reject empty names

    onCreate(trimmedName)
    onSelect(trimmedName)
    setNewCategoryName('')
    setIsCreating(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleCreateSubmit()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setNewCategoryName('')
      setIsCreating(false)
    }
  }

  const handleCancelCreate = () => {
    setNewCategoryName('')
    setIsCreating(false)
  }

  return (
    <div className="flex flex-col gap-2">
      <Select.Root
        value={selectedCategory ?? undefined}
        onValueChange={handleValueChange}
      >
        <Select.Trigger
          className="flex w-full items-center justify-between rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground hover:bg-surface-muted focus:outline-none focus:ring-2 focus:ring-primary/20 data-[placeholder]:text-muted-foreground"
          aria-label="Select category"
        >
          <Select.Value placeholder="Select category" />
          <Select.Icon>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </Select.Icon>
        </Select.Trigger>

        <Select.Portal>
          <Select.Content
            className="z-50 overflow-hidden rounded-lg border border-border bg-surface shadow-md"
            position="popper"
            sideOffset={4}
          >
            <Select.Viewport className="max-h-60 p-1">
              {categories.map((category) => (
                <Select.Item
                  key={category}
                  value={category}
                  className="relative flex cursor-pointer select-none items-center rounded-md px-3 py-2 text-sm text-foreground outline-none hover:bg-surface-muted focus:bg-surface-muted data-[state=checked]:bg-primary/10 data-[state=checked]:text-primary"
                >
                  <Select.ItemText>{category}</Select.ItemText>
                  <Select.ItemIndicator className="absolute right-2">
                    <Check className="h-4 w-4" />
                  </Select.ItemIndicator>
                </Select.Item>
              ))}

              {/* Separator if there are existing categories */}
              {categories.length > 0 && (
                <div className="mx-2 my-1 h-px bg-border" />
              )}

              {/* Create new option */}
              <Select.Item
                value={CREATE_NEW_VALUE}
                className="flex cursor-pointer select-none items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-primary outline-none hover:bg-surface-muted focus:bg-surface-muted"
              >
                <Plus className="h-4 w-4" />
                <Select.ItemText>Create new...</Select.ItemText>
              </Select.Item>
            </Select.Viewport>
          </Select.Content>
        </Select.Portal>
      </Select.Root>

      {/* Inline input for creating new category */}
      {isCreating && (
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Category name"
            className="flex-1 rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            autoComplete="off"
          />
          <button
            type="button"
            onClick={handleCancelCreate}
            className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}

import { useRef, useEffect } from 'react'

interface OtpInputProps {
  value: string              // Current 6-digit value (can be partial)
  onChange: (value: string) => void  // Called on any change
  onComplete: (value: string) => void  // Called when all 6 digits entered
  disabled?: boolean         // Disable all inputs
  error?: boolean            // Show error state styling
  autoFocus?: boolean        // Auto-focus first input (default: true)
}

/**
 * 6-digit OTP input component with auto-focus, auto-advance, and paste support
 * AC1.1: Renders 6 individual digit input boxes
 * AC1.2: First input box auto-focuses when component mounts
 * AC1.3: Typing a digit automatically advances focus to next box
 * AC1.4: Pasting a 6-digit code fills all boxes correctly
 * AC1.5: onComplete callback fires when all 6 digits are entered
 * AC1.6: Error state applies red border styling to all boxes
 * AC1.7: Disabled state prevents input and shows reduced opacity
 * AC1.8: Backspace clears current digit and moves focus to previous box
 * AC1.9: Only numeric characters (0-9) are accepted
 */
export const OtpInput = ({
  value,
  onChange,
  onComplete,
  disabled = false,
  error = false,
  autoFocus = true
}: OtpInputProps) => {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Split value into array of digits
  const digits = value.split('').slice(0, 6)

  // Auto-focus first input on mount (AC1.2)
  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0].focus()
    }
  }, [autoFocus])

  const handleChange = (index: number, digit: string) => {
    // Only accept single digits (AC1.9)
    if (!/^\d?$/.test(digit)) return

    const newDigits = [...digits]
    // Pad with empty strings if needed
    while (newDigits.length < 6) {
      newDigits.push('')
    }
    newDigits[index] = digit
    const newValue = newDigits.join('')
    onChange(newValue)

    // Auto-advance to next input (AC1.3)
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }

    // Check if complete (AC1.5)
    const trimmedValue = newValue.replace(/\s/g, '')
    if (trimmedValue.length === 6 && /^\d{6}$/.test(trimmedValue)) {
      onComplete(trimmedValue)
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)

    // AC1.4: Pasting a 6-digit code fills all boxes correctly
    if (pastedData.length > 0) {
      onChange(pastedData)

      // Move focus to the end or to the next empty box
      const focusIndex = Math.min(pastedData.length, 5)
      inputRefs.current[focusIndex]?.focus()

      // If pasted complete code, trigger onComplete
      if (pastedData.length === 6) {
        onComplete(pastedData)
      }
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    // AC1.8: Backspace clears current digit and moves focus to previous box
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        // If current box empty, move to previous and clear it
        inputRefs.current[index - 1]?.focus()
        const newDigits = [...digits]
        while (newDigits.length < 6) newDigits.push('')
        newDigits[index - 1] = ''
        onChange(newDigits.join(''))
      }
    }
    // Arrow key navigation
    if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault()
      inputRefs.current[index - 1]?.focus()
    }
    if (e.key === 'ArrowRight' && index < 5) {
      e.preventDefault()
      inputRefs.current[index + 1]?.focus()
    }
  }

  // Handle focus to select content
  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select()
  }

  return (
    <div className="flex gap-2 justify-center">
      {Array.from({ length: 6 }).map((_, index) => (
        <input
          key={index}
          ref={el => { inputRefs.current[index] = el }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]"
          maxLength={1}
          value={digits[index] || ''}
          onChange={e => handleChange(index, e.target.value)}
          onKeyDown={e => handleKeyDown(index, e)}
          onPaste={handlePaste}
          onFocus={handleFocus}
          disabled={disabled}
          aria-label={`Digit ${index + 1} of 6`}
          className={`
            w-12 h-14 text-center text-2xl font-medium
            rounded-md border bg-background
            focus:outline-none focus:ring-2 focus:ring-primary
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors
            ${error ? 'border-error' : 'border-border'}
          `}
        />
      ))}
    </div>
  )
}

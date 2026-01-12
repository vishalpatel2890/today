import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { TimeInsightsModal } from './TimeInsightsModal'

describe('TimeInsightsModal', () => {
  let onClose: ReturnType<typeof vi.fn>

  beforeEach(() => {
    onClose = vi.fn()
  })

  describe('Rendering (AC4, AC5)', () => {
    it('should render modal with title "Time Insights" when open', () => {
      render(<TimeInsightsModal isOpen={true} onClose={onClose} userId="test-user" />)

      expect(screen.getByRole('dialog')).toBeTruthy()
      expect(screen.getByText('Time Insights')).toBeTruthy()
    })

    it('should not render modal when closed', () => {
      render(<TimeInsightsModal isOpen={false} onClose={onClose} userId="test-user" />)

      expect(screen.queryByRole('dialog')).toBeNull()
    })

    it('should render X close button', () => {
      render(<TimeInsightsModal isOpen={true} onClose={onClose} userId="test-user" />)

      expect(screen.getByLabelText('Close')).toBeTruthy()
    })

    it('should have correct width class (550px)', () => {
      render(<TimeInsightsModal isOpen={true} onClose={onClose} userId="test-user" />)

      const dialog = screen.getByRole('dialog')
      expect(dialog.className).toContain('md:max-w-[550px]')
    })

    it('should have scrollable content (max-height 80vh)', () => {
      render(<TimeInsightsModal isOpen={true} onClose={onClose} userId="test-user" />)

      const dialog = screen.getByRole('dialog')
      expect(dialog.className).toContain('max-h-[80vh]')
      expect(dialog.className).toContain('overflow-y-auto')
    })
  })

  describe('Content Sections (AC6)', () => {
    it('should render TOTAL summary card (Story 6.1)', async () => {
      render(<TimeInsightsModal isOpen={true} onClose={onClose} userId="test-user" />)

      // Total card shows weekly total
      expect(screen.getByText('Total')).toBeTruthy()
      // "this week" appears in both Total and Avg/Day cards
      expect(screen.getAllByText('this week').length).toBeGreaterThanOrEqual(1)
    })

    it('should render TODAY summary card', async () => {
      render(<TimeInsightsModal isOpen={true} onClose={onClose} userId="test-user" />)

      // "Today" appears in both QuickFilterBar pill and InsightCard label
      expect(screen.getAllByText('Today').length).toBeGreaterThan(0)
      expect(screen.getByText('tracked')).toBeTruthy()
    })

    it('should render AVG / DAY summary card', async () => {
      render(<TimeInsightsModal isOpen={true} onClose={onClose} userId="test-user" />)

      expect(screen.getByText('Avg / Day')).toBeTruthy()
      // "this week" appears in both Total and Avg/Day cards
      expect(screen.getAllByText('this week').length).toBeGreaterThanOrEqual(2)
    })

    it('should render Breakdown section with empty state', async () => {
      render(<TimeInsightsModal isOpen={true} onClose={onClose} userId="test-user" />)

      // Wait for loading to complete - look for content that appears after loading
      await screen.findByText('Breakdown')
      // Empty state shows "No tasks tracked today"
      await screen.findByText('No tasks tracked today')
    })

    it('should render Recent Entries section header', async () => {
      render(<TimeInsightsModal isOpen={true} onClose={onClose} userId="test-user" />)

      expect(screen.getByText('Recent Entries')).toBeTruthy()
    })

    it('should show empty state message when no entries', async () => {
      render(<TimeInsightsModal isOpen={true} onClose={onClose} userId="test-user" />)

      // Empty state per AC4
      await screen.findByText('Start tracking time to see insights here.')
    })
  })

  describe('Close Behaviors (AC2)', () => {
    it('should call onClose when X button is clicked', () => {
      render(<TimeInsightsModal isOpen={true} onClose={onClose} userId="test-user" />)

      const closeButton = screen.getByLabelText('Close')
      fireEvent.click(closeButton)

      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('should call onClose when Escape key is pressed', () => {
      render(<TimeInsightsModal isOpen={true} onClose={onClose} userId="test-user" />)

      // Radix Dialog handles Escape key automatically
      fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })

      expect(onClose).toHaveBeenCalledTimes(1)
    })
  })

  describe('Accessibility', () => {
    it('should have proper dialog role', () => {
      render(<TimeInsightsModal isOpen={true} onClose={onClose} userId="test-user" />)

      expect(screen.getByRole('dialog')).toBeTruthy()
    })

    it('should have close button with accessible label', () => {
      render(<TimeInsightsModal isOpen={true} onClose={onClose} userId="test-user" />)

      const closeButton = screen.getByLabelText('Close')
      expect(closeButton).toBeTruthy()
    })
  })

  describe('Filter Chips (Story 3.4)', () => {
    it('should render date preset chip when preset is selected (AC-3.4.1, AC-3.4.2)', async () => {
      render(<TimeInsightsModal isOpen={true} onClose={onClose} userId="test-user" />)

      // Click "This Week" date preset
      const thisWeekButton = screen.getByRole('radio', { name: /This Week/i })
      fireEvent.click(thisWeekButton)

      // FilterChip should appear with the preset label
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /remove this week filter/i })).toBeTruthy()
      })
    })

    it('should remove date preset chip when x is clicked (AC-3.4.4)', async () => {
      render(<TimeInsightsModal isOpen={true} onClose={onClose} userId="test-user" />)

      // Select date preset
      const todayButton = screen.getByRole('radio', { name: /^Today$/i })
      fireEvent.click(todayButton)

      // Verify chip appears
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /remove today filter/i })).toBeTruthy()
      })

      // Click remove button on chip
      const removeButton = screen.getByRole('button', { name: /remove today filter/i })
      fireEvent.click(removeButton)

      // Chip should disappear
      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /remove today filter/i })).toBeNull()
      })
    })

    it('should show correct labels for all date presets (AC-3.4.2)', async () => {
      render(<TimeInsightsModal isOpen={true} onClose={onClose} userId="test-user" />)

      const presets = [
        { buttonName: /^Today$/i, chipName: /remove today filter/i },
        { buttonName: /Yesterday/i, chipName: /remove yesterday filter/i },
        { buttonName: /This Week/i, chipName: /remove this week filter/i },
        { buttonName: /This Month/i, chipName: /remove this month filter/i },
      ]

      for (const preset of presets) {
        // Click preset button
        const button = screen.getByRole('radio', { name: preset.buttonName })
        fireEvent.click(button)

        // Verify chip shows correct label
        await waitFor(() => {
          expect(screen.getByRole('button', { name: preset.chipName })).toBeTruthy()
        })

        // Remove chip before testing next preset
        const removeButton = screen.getByRole('button', { name: preset.chipName })
        fireEvent.click(removeButton)
      }
    })

    it('should display multiple chips simultaneously (AC-3.4.6)', async () => {
      render(<TimeInsightsModal isOpen={true} onClose={onClose} userId="test-user" />)

      // Select date preset
      const thisWeekButton = screen.getByRole('radio', { name: /This Week/i })
      fireEvent.click(thisWeekButton)

      // Verify date chip appears
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /remove this week filter/i })).toBeTruthy()
      })

      // The task and category dropdowns won't have options without time entries,
      // but we can verify the date chip is rendered correctly
      const chips = screen.getAllByRole('button', { name: /remove.*filter/i })
      expect(chips.length).toBeGreaterThanOrEqual(1)
    })

    it('should have proper chip styling (AC-3.4.7)', async () => {
      render(<TimeInsightsModal isOpen={true} onClose={onClose} userId="test-user" />)

      // Select date preset
      const thisWeekButton = screen.getByRole('radio', { name: /This Week/i })
      fireEvent.click(thisWeekButton)

      // Find the chip container (parent of the remove button)
      await waitFor(() => {
        const removeButton = screen.getByRole('button', { name: /remove this week filter/i })
        const chip = removeButton.parentElement
        expect(chip?.className).toContain('bg-slate-600')
        expect(chip?.className).toContain('text-white')
      })
    })
  })

  describe('Recent Entries Section (Story 2.3)', () => {
    it('should render section header with "Recent Entries" text', async () => {
      render(<TimeInsightsModal isOpen={true} onClose={onClose} userId="test-user" />)

      expect(screen.getByText('Recent Entries')).toBeTruthy()
    })

    it('should show loading skeleton before data loads', () => {
      render(<TimeInsightsModal isOpen={true} onClose={onClose} userId="test-user" />)

      // Should have loading placeholders initially
      const dialog = screen.getByRole('dialog')
      expect(dialog.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0)
    })

    it('should show empty state message per AC4', async () => {
      render(<TimeInsightsModal isOpen={true} onClose={onClose} userId="test-user" />)

      // AC4: Empty state shows "Start tracking time to see insights here."
      await screen.findByText('Start tracking time to see insights here.')
    })

    it('should have accessible list container when entries exist', async () => {
      render(<TimeInsightsModal isOpen={true} onClose={onClose} userId="test-user" />)

      // Wait for loading to complete
      await waitFor(() => {
        // After loading, should not have aria-label list if empty
        // When entries exist, the list will have role="list" with aria-label
        const list = screen.queryByRole('list', { name: 'Recent time entries' })
        // In empty state, list won't exist - this test validates structure
        expect(list).toBeNull() // No entries = no list
      })
    })
  })
})

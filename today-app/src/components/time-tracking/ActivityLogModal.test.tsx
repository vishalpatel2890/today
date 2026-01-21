import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ActivityLogModal } from './ActivityLogModal'
import { ToastProvider } from '../../contexts/ToastContext'
import { ToastContainer } from '../Toast'
import { electronBridge } from '../../lib/electronBridge'
import * as platformModule from '../../lib/platform'

// Mock the electronBridge module
vi.mock('../../lib/electronBridge', () => ({
  electronBridge: {
    activity: {
      getLog: vi.fn().mockResolvedValue({ success: true, data: [] }),
      export: vi.fn().mockResolvedValue({ success: true, data: { filePath: '/path/to/file.json' } }),
    },
  },
}))

// Mock the platform module
vi.mock('../../lib/platform', () => ({
  isElectron: vi.fn().mockReturnValue(true),
}))

// Wrapper component to provide required context and render toasts
const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <ToastProvider>
      {ui}
      <ToastContainer />
    </ToastProvider>
  )
}

describe('ActivityLogModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    timeEntryId: 'test-entry-123',
    taskName: 'Fix login bug',
    startTime: '2026-01-20T09:00:00Z',
    endTime: '2026-01-20T10:30:00Z',
  }

  const mockEntries = [
    {
      id: '1',
      timeEntryId: 'test-entry-123',
      timestamp: '2026-01-20T09:00:15Z',
      appName: 'VS Code',
      windowTitle: 'index.ts - today-app',
    },
    {
      id: '2',
      timeEntryId: 'test-entry-123',
      timestamp: '2026-01-20T09:15:32Z',
      appName: 'Chrome',
      windowTitle: 'React Documentation - Google Chrome',
    },
    {
      id: '3',
      timeEntryId: 'test-entry-123',
      timestamp: '2026-01-20T09:30:00Z',
      appName: 'Slack',
      windowTitle: '#engineering - Slack',
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(platformModule.isElectron).mockReturnValue(true)
    vi.mocked(electronBridge.activity.getLog).mockResolvedValue({
      success: true,
      data: mockEntries,
    })
    vi.mocked(electronBridge.activity.export).mockResolvedValue({
      success: true,
      data: { filePath: '/path/to/exported-file.json' },
    })
  })

  it('renders modal with task name and session range', async () => {
    renderWithProviders(<ActivityLogModal {...defaultProps} />)

    expect(screen.getByText('Fix login bug')).toBeInTheDocument()
    // Check for date in header
    await waitFor(() => {
      expect(screen.getByText(/Jan 20, 2026/)).toBeInTheDocument()
    })
  })

  it('shows loading state while fetching activity', () => {
    renderWithProviders(<ActivityLogModal {...defaultProps} />)

    // Should show loading spinner initially
    expect(document.querySelector('.animate-spin')).toBeInTheDocument()
  })

  it('renders activity entries after loading', async () => {
    renderWithProviders(<ActivityLogModal {...defaultProps} />)

    // Wait for activity data to load - entries appear in both summary and chronological list
    await waitFor(() => {
      // Use getAllByText since the app name appears in both summary and list
      expect(screen.getAllByText('Slack').length).toBeGreaterThanOrEqual(1)
    })

    // Chrome should also be in the entries
    expect(screen.getAllByText('Chrome').length).toBeGreaterThanOrEqual(1)
  })

  // Story 4.4 - Export Button Tests
  describe('Export functionality (Story 4.4)', () => {
    it('shows export buttons in footer when in Electron and has entries (AC4.4.1)', async () => {
      renderWithProviders(<ActivityLogModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Export as JSON' })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Export as CSV' })).toBeInTheDocument()
      })
    })

    it('hides export buttons when not in Electron', async () => {
      vi.mocked(platformModule.isElectron).mockReturnValue(false)

      renderWithProviders(<ActivityLogModal {...defaultProps} />)

      // Wait for activity list to load - use getAllByText since entries appear in multiple places
      await waitFor(() => {
        expect(screen.getAllByText('Slack').length).toBeGreaterThanOrEqual(1)
      })

      expect(screen.queryByRole('button', { name: 'Export as JSON' })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Export as CSV' })).not.toBeInTheDocument()
    })

    it('hides export buttons when no entries exist', async () => {
      vi.mocked(electronBridge.activity.getLog).mockResolvedValue({
        success: true,
        data: [],
      })

      renderWithProviders(<ActivityLogModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('No activity recorded for this session')).toBeInTheDocument()
      })

      expect(screen.queryByRole('button', { name: 'Export as JSON' })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Export as CSV' })).not.toBeInTheDocument()
    })

    it('calls electronBridge.activity.export with correct params for JSON (AC4.4.2)', async () => {
      renderWithProviders(<ActivityLogModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Export as JSON' })).toBeInTheDocument()
      })

      fireEvent.click(screen.getByRole('button', { name: 'Export as JSON' }))

      await waitFor(() => {
        expect(electronBridge.activity.export).toHaveBeenCalledWith(
          expect.objectContaining({
            format: 'json',
            taskName: 'Fix login bug',
            entries: expect.arrayContaining([
              expect.objectContaining({
                appName: 'VS Code',
                windowTitle: 'index.ts - today-app',
              }),
            ]),
          })
        )
      })
    })

    it('calls electronBridge.activity.export with correct params for CSV (AC4.4.3)', async () => {
      renderWithProviders(<ActivityLogModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Export as CSV' })).toBeInTheDocument()
      })

      fireEvent.click(screen.getByRole('button', { name: 'Export as CSV' }))

      await waitFor(() => {
        expect(electronBridge.activity.export).toHaveBeenCalledWith(
          expect.objectContaining({
            format: 'csv',
            taskName: 'Fix login bug',
          })
        )
      })
    })

    it('shows success toast on successful export (AC4.4.5)', async () => {
      renderWithProviders(<ActivityLogModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Export as JSON' })).toBeInTheDocument()
      })

      fireEvent.click(screen.getByRole('button', { name: 'Export as JSON' }))

      await waitFor(() => {
        expect(screen.getByText('Activity exported successfully')).toBeInTheDocument()
      })
    })

    it('shows error toast on export failure (AC4.4.6)', async () => {
      vi.mocked(electronBridge.activity.export).mockResolvedValue({
        success: false,
        error: 'Permission denied',
      })

      renderWithProviders(<ActivityLogModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Export as JSON' })).toBeInTheDocument()
      })

      fireEvent.click(screen.getByRole('button', { name: 'Export as JSON' }))

      await waitFor(() => {
        expect(screen.getByText('Permission denied')).toBeInTheDocument()
      })
    })

    it('does not show error toast when user cancels export dialog', async () => {
      vi.mocked(electronBridge.activity.export).mockResolvedValue({
        success: false,
        error: 'Export cancelled',
      })

      renderWithProviders(<ActivityLogModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Export as JSON' })).toBeInTheDocument()
      })

      fireEvent.click(screen.getByRole('button', { name: 'Export as JSON' }))

      // Wait for potential toast
      await new Promise((resolve) => setTimeout(resolve, 100))

      // Should NOT show the cancelled error as a toast
      expect(screen.queryByText('Export cancelled')).not.toBeInTheDocument()
    })

    it('disables export buttons during export operation', async () => {
      // Make export take some time
      vi.mocked(electronBridge.activity.export).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ success: true, data: { filePath: '/test' } }), 100))
      )

      renderWithProviders(<ActivityLogModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Export as JSON' })).toBeInTheDocument()
      })

      fireEvent.click(screen.getByRole('button', { name: 'Export as JSON' }))

      // Buttons should be disabled during export
      expect(screen.getByRole('button', { name: 'Export as JSON' })).toBeDisabled()
      expect(screen.getByRole('button', { name: 'Export as CSV' })).toBeDisabled()

      // Wait for export to complete
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Export as JSON' })).not.toBeDisabled()
      })
    })

    it('shows entry count in footer', async () => {
      renderWithProviders(<ActivityLogModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('3 entries')).toBeInTheDocument()
      })
    })

    it('shows singular "entry" for single entry', async () => {
      vi.mocked(electronBridge.activity.getLog).mockResolvedValue({
        success: true,
        data: [mockEntries[0]],
      })

      renderWithProviders(<ActivityLogModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('1 entry')).toBeInTheDocument()
      })
    })
  })

  it('closes modal when onClose is called', async () => {
    const onClose = vi.fn()
    renderWithProviders(<ActivityLogModal {...defaultProps} onClose={onClose} />)

    await waitFor(() => {
      expect(screen.getByText('Fix login bug')).toBeInTheDocument()
    })

    // Click close button
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))

    expect(onClose).toHaveBeenCalled()
  })
})

import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useAutoSurface } from './useAutoSurface'
import { addDays, subDays, startOfDay } from 'date-fns'
import type { Task } from '../types'

// Helper to create a task with specific properties
const createTask = (overrides: Partial<Task> = {}): Task => ({
  id: crypto.randomUUID(),
  text: 'Test task',
  createdAt: new Date().toISOString(),
  deferredTo: null,
  category: null,
  completedAt: null,
  notes: null,
  sortOrder: Date.now(),
  ...overrides,
})

describe('useAutoSurface', () => {
  const today = startOfDay(new Date())
  const tomorrow = addDays(today, 1)
  const nextWeek = addDays(today, 7)
  const yesterday = subDays(today, 1)

  describe('Deferred view routing', () => {
    it('should route task with no date and no category to Deferred', () => {
      const task = createTask({ deferredTo: null, category: null })

      const { result } = renderHook(() => useAutoSurface([task]))

      expect(result.current.deferredTasks).toContain(task)
      expect(result.current.todayTasks).not.toContain(task)
      expect(result.current.tomorrowTasks).not.toContain(task)
    })

    it('should route task with no date but with category to Deferred', () => {
      const task = createTask({ deferredTo: null, category: 'Work' })

      const { result } = renderHook(() => useAutoSurface([task]))

      expect(result.current.deferredTasks).toContain(task)
      expect(result.current.todayTasks).not.toContain(task)
    })

    it('should route task with future date and no category to Deferred', () => {
      const task = createTask({
        deferredTo: nextWeek.toISOString(),
        category: null,
      })

      const { result } = renderHook(() => useAutoSurface([task]))

      expect(result.current.deferredTasks).toContain(task)
      expect(result.current.todayTasks).not.toContain(task)
    })

    it('should route task with future date and category to Deferred', () => {
      const task = createTask({
        deferredTo: nextWeek.toISOString(),
        category: 'Work',
      })

      const { result } = renderHook(() => useAutoSurface([task]))

      expect(result.current.deferredTasks).toContain(task)
      expect(result.current.todayTasks).not.toContain(task)
    })

    it('should route task with invalid date string to Deferred', () => {
      const task = createTask({
        deferredTo: 'invalid-date-string',
        category: null,
      })

      const { result } = renderHook(() => useAutoSurface([task]))

      expect(result.current.deferredTasks).toContain(task)
      expect(result.current.todayTasks).not.toContain(task)
    })

    it('should route task with empty string date to Deferred', () => {
      const task = createTask({
        deferredTo: '',
        category: null,
      })

      const { result } = renderHook(() => useAutoSurface([task]))

      expect(result.current.deferredTasks).toContain(task)
      expect(result.current.todayTasks).not.toContain(task)
    })
  })

  describe('Today view routing', () => {
    it('should route task with today date to Today', () => {
      const task = createTask({
        deferredTo: today.toISOString(),
        category: null,
      })

      const { result } = renderHook(() => useAutoSurface([task]))

      expect(result.current.todayTasks).toContain(task)
      expect(result.current.deferredTasks).not.toContain(task)
      expect(result.current.tomorrowTasks).not.toContain(task)
    })

    it('should route overdue task (past date) to Today', () => {
      const task = createTask({
        deferredTo: yesterday.toISOString(),
        category: null,
      })

      const { result } = renderHook(() => useAutoSurface([task]))

      expect(result.current.todayTasks).toContain(task)
      expect(result.current.deferredTasks).not.toContain(task)
    })
  })

  describe('Tomorrow view routing', () => {
    it('should route task with tomorrow date to Tomorrow', () => {
      const task = createTask({
        deferredTo: tomorrow.toISOString(),
        category: null,
      })

      const { result } = renderHook(() => useAutoSurface([task]))

      expect(result.current.tomorrowTasks).toContain(task)
      expect(result.current.todayTasks).not.toContain(task)
      expect(result.current.deferredTasks).not.toContain(task)
    })
  })

  describe('Completed tasks', () => {
    it('should exclude completed tasks from all views', () => {
      const task = createTask({
        deferredTo: today.toISOString(),
        completedAt: new Date().toISOString(),
      })

      const { result } = renderHook(() => useAutoSurface([task]))

      expect(result.current.todayTasks).not.toContain(task)
      expect(result.current.tomorrowTasks).not.toContain(task)
      expect(result.current.deferredTasks).not.toContain(task)
    })

    it('should exclude completed task with no date from all views', () => {
      const task = createTask({
        deferredTo: null,
        completedAt: new Date().toISOString(),
      })

      const { result } = renderHook(() => useAutoSurface([task]))

      expect(result.current.todayTasks).toHaveLength(0)
      expect(result.current.tomorrowTasks).toHaveLength(0)
      expect(result.current.deferredTasks).toHaveLength(0)
    })
  })

  describe('Multiple tasks', () => {
    it('should correctly categorize multiple tasks', () => {
      const tasks = [
        createTask({ id: '1', deferredTo: null, category: null }), // Deferred
        createTask({ id: '2', deferredTo: today.toISOString() }), // Today
        createTask({ id: '3', deferredTo: tomorrow.toISOString() }), // Tomorrow
        createTask({ id: '4', deferredTo: nextWeek.toISOString() }), // Deferred
        createTask({ id: '5', completedAt: new Date().toISOString() }), // Excluded
      ]

      const { result } = renderHook(() => useAutoSurface(tasks))

      expect(result.current.todayTasks).toHaveLength(1)
      expect(result.current.tomorrowTasks).toHaveLength(1)
      expect(result.current.deferredTasks).toHaveLength(2)
    })
  })

  describe('Category independence', () => {
    it('should not consider category when routing to Today', () => {
      const taskWithCategory = createTask({
        deferredTo: today.toISOString(),
        category: 'Work',
      })
      const taskWithoutCategory = createTask({
        deferredTo: today.toISOString(),
        category: null,
      })

      const { result } = renderHook(() =>
        useAutoSurface([taskWithCategory, taskWithoutCategory])
      )

      expect(result.current.todayTasks).toHaveLength(2)
    })

    it('should not consider category when routing to Deferred', () => {
      const taskWithCategory = createTask({
        deferredTo: nextWeek.toISOString(),
        category: 'Work',
      })
      const taskWithoutCategory = createTask({
        deferredTo: nextWeek.toISOString(),
        category: null,
      })

      const { result } = renderHook(() =>
        useAutoSurface([taskWithCategory, taskWithoutCategory])
      )

      expect(result.current.deferredTasks).toHaveLength(2)
    })
  })
})

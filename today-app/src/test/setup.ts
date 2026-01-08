import 'fake-indexeddb/auto'
import { beforeEach } from 'vitest'
import { db } from '../lib/db'

// Clear the database before each test
beforeEach(async () => {
  await db.tasks.clear()
  await db.syncQueue.clear()
})

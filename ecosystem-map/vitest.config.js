import { defineConfig } from 'vitest/config'

// Kept separate from frontend/vite.config.js, whose `root` is frontend/ and
// would hide the backend tests. Everything under test is plain logic, so the
// Node environment is enough — no DOM.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['frontend/src/**/*.test.{js,ts}', 'backend/**/*.test.js'],
  },
})

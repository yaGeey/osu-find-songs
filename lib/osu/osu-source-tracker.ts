'use server'

const sourceTracker = new Map<string, { failures: number; cooldownUntil: number }>()

const SOURCES_MAX_FAILURES = 2
const SOURCES_COOLDOWN_MS = 60 * 60 * 1000 * 10
const ALL_SOURCES_COOLDOWN_MS = 30 * 60 * 1000

export async function getSourcesHealth() {
   return Object.fromEntries(sourceTracker)
}

export async function reportSourceStatus(sourceName: string, status: 'success' | 'failure') {
   const state = sourceTracker.get(sourceName) || { failures: 0, cooldownUntil: 0 }
   if (status === 'success') {
      state.failures = 0
      state.cooldownUntil = 0
   } else {
      state.failures++
      if (state.failures >= SOURCES_MAX_FAILURES) {
         state.cooldownUntil = Date.now() + SOURCES_COOLDOWN_MS
      }
   }
   sourceTracker.set(sourceName, state)
}

export async function reportAllSourcesDown() {
   for (const [sourceName, state] of sourceTracker.entries()) {
      state.cooldownUntil = Date.now() + ALL_SOURCES_COOLDOWN_MS
      sourceTracker.set(sourceName, state)
   }
}

'use server'

type SourceStatus = {
   failedUsers: Set<string>
   cooldownUntil: number
}
const sourceTracker = new Map<string, SourceStatus>()

const SOURCES_MAX_FAILURES = 2
const SOURCES_COOLDOWN_MS = 60 * 60 * 1000 * 24

export async function getDeadMirrors() {
   const deadMirrors: string[] = []
   const now = Date.now()

   for (const [name, state] of sourceTracker.entries()) {
      if (state.cooldownUntil > now) {
         deadMirrors.push(name)
      }
   }
   return deadMirrors
}

export async function reportSourceStatus(sourceName: string, status: 'success' | 'failure', sessionId: string) {
   const state: SourceStatus = sourceTracker.get(sourceName) || { failedUsers: new Set(), cooldownUntil: 0 }
   if (status === 'success') {
      state.failedUsers.clear()
      state.cooldownUntil = 0
   } else {
      state.failedUsers.add(sessionId)
      if (state.failedUsers.size >= SOURCES_MAX_FAILURES) {
         state.cooldownUntil = Date.now() + SOURCES_COOLDOWN_MS
      }
   }
   sourceTracker.set(sourceName, state)
   console.log(sourceTracker)
}

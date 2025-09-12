// TODO подивись уроки по zustand
import { toast } from 'react-toastify'
import { create } from 'zustand'

type AudioStore = {
   currentUrl: string | null
   audio: HTMLAudioElement | null
   play: (url: string) => void
   stop: () => void
}

export const useAudioStore = create<AudioStore>((set, get) => ({
   currentUrl: null,
   audio: null,

   play: (url) => {
      const { audio, currentUrl } = get()
      if (currentUrl === url) return
      if (audio) audio.pause()

      const newAudio = new Audio(url)
      newAudio.play().catch((error) => {
         toast.error('Playback failed:', error)
         set({ currentUrl: null, audio: null })
      })
      newAudio.onended = () => set({ currentUrl: null, audio: null })

      set({ currentUrl: url, audio: newAudio })
   },

   stop: () => {
      const { audio } = get()
      if (audio) {
         audio.pause()
         audio.currentTime = 0
      }
      set({ currentUrl: null, audio: null })
   },
}))

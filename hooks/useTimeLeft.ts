import { useMemo, useState } from 'react'

export default function useTimeLeft(leftLoading: number) {
   const [timePerOneAcc, setTimePerOneAcc] = useState<number[]>([])

   const msLeft = useMemo(() => {
      const diffs = timePerOneAcc.map((item, i) => item - timePerOneAcc[i - 1]).slice(1)
      if (diffs.length === 0) return 0
      return (diffs.reduce((a, b) => a + b, 0) / diffs.length) * leftLoading
   }, [timePerOneAcc, leftLoading])

   const timeLeft = msLeft ? new Date(msLeft).toISOString().slice(14, 19) : '00:00'

   const addTimeLeft = (time: number) => setTimePerOneAcc((prev) => [...prev, time])
   const resetTimeLeft = () => setTimePerOneAcc([])

   return { timeLeft, msLeft, addTimeLeft, resetTimeLeft }
}

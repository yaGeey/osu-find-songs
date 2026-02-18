import useProgressVariant from '@/hooks/useProgressVariant'
import { LinearProgress } from '@mui/material'

export default function ProgressInline({ value }: { value: number }) {
   const variant = useProgressVariant(value)
   return <LinearProgress variant={variant} value={value} color="inherit" />
}

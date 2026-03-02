import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SpinnerProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const sizeMap = {
  sm: 'size-4',
  md: 'size-5',
  lg: 'size-8',
}

export function Spinner({ className, size = 'md' }: SpinnerProps) {
  return <Loader2 className={cn('animate-spin text-blue-500', sizeMap[size], className)} />
}

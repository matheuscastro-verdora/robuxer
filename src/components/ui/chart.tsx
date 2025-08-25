import * as React from 'react'
import { cn } from '../../lib/utils'

export type ChartConfig = Record<string, { label?: string; color?: string }>

export function ChartContainer({ config, className, children, ...props }: { config: ChartConfig } & React.HTMLAttributes<HTMLDivElement>) {
  const style: React.CSSProperties = {}
  let i = 1
  for (const key of Object.keys(config)) {
    const cssVar = `--chart-${i}`
    const color = config[key]?.color
    if (color) (style as any)[cssVar as any] = color
    i++
  }
  return (
    <div className={cn('text-sm', className)} style={style} {...props}>
      {children}
    </div>
  )
}

export function ChartTooltip({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

export function ChartTooltipContent({ className, label, payload }: { className?: string; label?: string; payload?: any[] }) {
  if (!payload?.length) return null
  return (
    <div className={cn('rounded-md border bg-background p-2 shadow-sm', className)}>
      {label && <div className="font-medium mb-1">{label}</div>}
      <div className="grid gap-1">
        {payload.map((p, idx) => (
          <div key={idx} className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">{p.name}</span>
            <span className="font-mono">{p.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}



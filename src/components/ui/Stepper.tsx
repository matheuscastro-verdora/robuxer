import * as React from 'react'
import { cn } from '../../lib/utils'
import { AnimatePresence, motion } from 'framer-motion'

type StepperContextValue = {
	active: number
	orientation: 'vertical' | 'horizontal'
}

const StepperContext = React.createContext<StepperContextValue | null>(null)

export function Stepper({
	defaultValue = 1,
	value,
	orientation = 'vertical',
	className,
	children,
}: React.HTMLAttributes<HTMLDivElement> & { defaultValue?: number; value?: number; orientation?: 'vertical' | 'horizontal' }) {
	const active = typeof value === 'number' ? value : defaultValue
	return (
		<div className={cn('group/stepper', className)} data-orientation={orientation}>
			<StepperContext.Provider value={{ active, orientation }}>{children}</StepperContext.Provider>
		</div>
	)
}

export function StepperItem({ step, className, children }: React.HTMLAttributes<HTMLDivElement> & { step: number }) {
	const ctx = React.useContext(StepperContext)!
	const state: 'completed' | 'active' | 'pending' = step < ctx.active ? 'completed' : step === ctx.active ? 'active' : 'pending'
	return (
		<div className={cn('group/item relative flex w-full', className)} data-state={state}>
			{children}
		</div>
	)
}

export function StepperTrigger({ className, children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
	return (
		<button type="button" className={cn('group/trigger flex w-full items-center gap-3 rounded-md px-1 py-2', className)} {...props}>
			{children}
		</button>
	)
}

export function StepperIndicator({ step, className, children, ...props }: React.HTMLAttributes<HTMLDivElement> & { step?: number }) {
	const ctx = React.useContext(StepperContext)!
	const isCompleted = typeof step === 'number' ? step < ctx.active : false
	const isActive = typeof step === 'number' ? step === ctx.active : false
	return (
		<div
			className={cn(
				'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs',
				isCompleted ? 'bg-[#8BF65B] text-black border-[#8BF65B]' : isActive ? 'border-[#8BF65B] text-[#8BF65B]' : 'border',
				className,
			)}
			data-orientation={ctx.orientation}
			{...props}
		>
			<AnimatePresence mode="wait" initial={false}>
				{isCompleted ? (
					<motion.span
						key="check"
						initial={{ opacity: 0, y: 4 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -4 }}
						transition={{ duration: 0.18 }}
						aria-hidden
					>
						<svg viewBox="0 0 20 20" width="12" height="12" fill="currentColor">
							<path d="M7.629 14.933a1 1 0 0 1-1.415.001l-3.147-3.13a1 1 0 1 1 1.41-1.418l2.44 2.429 7.28-7.27a1 1 0 1 1 1.414 1.414l-8.982 8.974z"/>
						</svg>
					</motion.span>
				) : (
					<motion.span
						key="num"
						initial={{ opacity: 0, y: 4 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -4 }}
						transition={{ duration: 0.18 }}
					>
						{children}
					</motion.span>
				)}
			</AnimatePresence>
		</div>
	)
}

export function StepperTitle({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
	return <div className={cn('text-sm font-medium', className)} {...props} />
}

export function StepperDescription({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
	return <div className={cn('text-xs text-muted-foreground', className)} {...props} />
}

export function StepperSeparator({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
	const ctx = React.useContext(StepperContext)!
	const isVertical = ctx.orientation === 'vertical'
	return (
		<div
			className={cn(
				isVertical ? 'ml-3 w-px bg-border' : 'mt-3 h-px bg-border',
				className,
			)}
			{...props}
		/>
	)
}



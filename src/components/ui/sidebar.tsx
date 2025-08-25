import * as React from 'react'
import { NavLink } from 'react-router-dom'
import { cn } from '../../lib/utils'

// Sidebar context
type SidebarContextValue = { open: boolean; setOpen: (v: boolean | ((p: boolean) => boolean)) => void }
const SidebarContext = React.createContext<SidebarContextValue | null>(null)

export function SidebarProvider({ children, defaultOpen = true }: { children: React.ReactNode; defaultOpen?: boolean }) {
	const [open, setOpen] = React.useState<boolean>(defaultOpen)
	return <SidebarContext.Provider value={{ open, setOpen }}>{children}</SidebarContext.Provider>
}

export function useSidebar() {
	const ctx = React.useContext(SidebarContext)
	if (!ctx) throw new Error('useSidebar must be used within a SidebarProvider')
	return ctx
}

export function Sidebar({ children, className }: React.HTMLAttributes<HTMLDivElement>) {
	const { open } = useSidebar()
	return (
		<aside
			className={cn(
				'fixed inset-y-0 left-0 z-30 transition-[width] duration-200 ease-out',
				open ? 'w-60' : 'w-[6rem]',
				className,
			)}
		>
			<div
				className={cn(
					'group/sidebar h-full m-2 rounded-xl flex flex-col',
					'group-data-[open=false]/sidebar:m-1',
					'bg-[hsl(var(--sidebar))] text-[hsl(var(--sidebar-foreground))]'
				)}
				data-open={open ? 'true' : 'false'}
			>
				{children}
			</div>
		</aside>
	)
}

export function SidebarHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
	return <div className={cn('h-14 flex items-center px-3', 'group-data-[open=false]/sidebar:h-24 group-data-[open=false]/sidebar:justify-center group-data-[open=false]/sidebar:mb-2', className)} {...props} />
}
export function SidebarFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
	return <div className={cn('mt-auto px-2 pt-2 pb-4', className)} {...props} />
}
export function SidebarContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
	return <div className={cn('p-2 space-y-2 overflow-y-auto', 'group-data-[open=false]/sidebar:pt-1', className)} {...props} />
}

export function SidebarGroup({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
	return <div className={cn('space-y-1', className)} {...props} />
}
export function SidebarGroupLabel({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
	return <div className={cn('px-3 py-1 text-[11px] uppercase tracking-wide', 'text-[hsl(var(--sidebar-accent-foreground))]/70', className)} {...props} />
}
export function SidebarGroupContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
	return <div className={cn('space-y-1', className)} {...props} />
}

export function SidebarMenu({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
	return <nav className={cn('space-y-1', className)} {...props} />
}
export function SidebarMenuItem({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
	return <div className={cn('', className)} {...props} />
}
export function SidebarMenuButton({ className, children, asChild, ...props }: React.HTMLAttributes<HTMLButtonElement> & { asChild?: boolean }) {
	return (
		<button className={cn('w-full text-left rounded-lg px-4 py-3 text-sm transition-colors flex items-center gap-2 mx-2', 'hover:bg-[hsl(var(--sidebar-accent))] hover:text-[hsl(var(--sidebar-accent-foreground))]', 'group-data-[open=false]/sidebar:justify-center group-data-[open=false]/sidebar:px-0 group-data-[open=false]/sidebar:mx-0', className)} {...props}>
			{children}
		</button>
	)
}

export function SidebarTrigger({ className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
	const { open, setOpen } = useSidebar()
	return (
		<button
			type="button"
			onClick={() => setOpen((p) => !p)}
			className={cn('inline-flex h-8 w-8 items-center justify-center rounded-md border hover:bg-[hsl(var(--sidebar-accent))] transition-colors', className)}
			aria-label={open ? 'Fechar menu' : 'Abrir menu'}
			{...props}
		>
			<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
				<rect x="3" y="4" width="18" height="16" rx="2"/>
				{open ? <line x1="10" y1="4" x2="10" y2="20"/> : <line x1="14" y1="4" x2="14" y2="20"/>}
			</svg>
		</button>
	)
}

export function SidebarLink({ to, icon: Icon, label }: { to: string; icon?: React.ComponentType<any>; label: string }) {
	return (
		<NavLink
			to={to}
			className={({ isActive }) =>
				cn(
					'group/link flex items-center gap-2 rounded-lg px-4 py-3 text-sm mx-2',
					'hover:bg-[hsl(var(--sidebar-accent))] hover:text-[hsl(var(--sidebar-accent-foreground))] transition-colors',
					'group-data-[open=false]/sidebar:justify-center group-data-[open=false]/sidebar:px-0 group-data-[open=false]/sidebar:mx-0',
					isActive && 'bg-[hsl(var(--sidebar-accent))] text-[hsl(var(--sidebar-accent-foreground))]',
				)
			}
		>
			{({ isActive }) => (
				<>
					{Icon && <Icon className={cn('h-4 w-4', isActive && 'text-[#8BF65B]')} />}
					<span className="truncate group-data-[open=false]/sidebar:hidden">{label}</span>
				</>
			)}
		</NavLink>
	)
}

import { NavLink } from 'react-router-dom'
import { cn } from '../lib/utils'
import { Home, ShoppingCart, User, Shield } from 'lucide-react'

const items = [
	{ to: '/start', label: 'Início', icon: Home },
	{ to: '/buy-pass', label: 'Comprar', icon: ShoppingCart },
	{ to: '/account', label: 'Minha conta', icon: User },
	{ to: '/admin', label: 'Admin', icon: Shield },
]

export function Sidebar() {
	return (
		<aside className="fixed inset-y-0 left-0 w-60 border-r bg-background">
			<div className="h-14 border-b flex items-center px-4 font-semibold">Robuxer</div>
			<nav className="p-2 space-y-1">
				{items.map(({ to, label, icon: Icon }) => (
					<NavLink
						key={to}
						to={to}
						className={({ isActive }) => cn(
							'flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground',
							isActive && 'bg-accent text-accent-foreground'
						)}
					>
						<Icon className="h-4 w-4" />
						<span>{label}</span>
					</NavLink>
				))}
			</nav>
		</aside>
	)
}

import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useProfile } from '../hooks/useProfile'
import { supabase } from '../lib/supabase'
import { ThemeToggle } from './ThemeToggle'
import { Footer } from './Footer'
import { Home, ShoppingCart, Shield, ChevronsUpDown, LogOut, Bell, CreditCard, User as UserIcon } from 'lucide-react'
import { SidebarProvider, Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarLink, SidebarTrigger, useSidebar, SidebarFooter } from './ui/sidebar'
import logoFull from '../assets/8.svg'
import logoIcon from '../assets/18.svg'
import { cn, getInitials } from '../lib/utils'
import { Avatar, AvatarFallback } from './ui/avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu'

export function Layout({ children }: { children: React.ReactNode }) {
	const { user } = useAuth()
	const { profile } = useProfile()
	const navigate = useNavigate()
	
	// Função para fazer logout e limpar dados locais
	const handleSignOut = async () => {
		// Limpar localStorage específico do usuário
		if (user?.id) {
			localStorage.removeItem('userId')
		}
		// Fazer logout
		await supabase.auth.signOut()
	}
	
	return (
		<SidebarProvider>
			<Sidebar>
				<SidebarHeader>
					<div className="flex items-center gap-2">
						<img src={logoFull} alt="Logo" className="w-28 h-auto group-data-[open=false]/sidebar:hidden" />
						<img src={logoIcon} alt="Ícone" className="hidden group-data-[open=false]/sidebar:block h-[72px] w-[72px]" />
					</div>
				</SidebarHeader>
				<SidebarContent>
					<SidebarMenu>
						<SidebarMenuItem><SidebarLink to="/start" icon={Home} label="Início" /></SidebarMenuItem>
						<SidebarMenuItem><SidebarLink to="/buy-pass" icon={ShoppingCart} label="Comprar" /></SidebarMenuItem>
						{profile?.is_admin && (
							<SidebarMenuItem><SidebarLink to="/admin" icon={Shield} label="Admin" /></SidebarMenuItem>
						)}
					</SidebarMenu>
				</SidebarContent>
				<SidebarFooter>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<button className="mt-3 mb-1 w-full rounded-md px-3 py-2 flex items-center justify-between hover:bg-[hsl(var(--sidebar-accent))]">
								<div className="flex items-center gap-2 min-w-0">
									<Avatar className="h-8 w-8">

										<AvatarFallback>{getInitials(user?.email || 'Usuário')}</AvatarFallback>
									</Avatar>
									<div className="text-xs leading-tight group-data-[open=false]/sidebar:hidden min-w-0">
										<div className="font-medium truncate">{user?.email ? String(user.email).split('@')[0] : 'Usuário'}</div>
										<div className="text-muted-foreground truncate max-w-[12rem]">{user?.email || 'email@example.com'}</div>
									</div>
								</div>
								<span className="h-6 w-6 rounded-md inline-flex items-center justify-center group-data-[open=false]/sidebar:hidden">
									<ChevronsUpDown className="h-4 w-4" />
								</span>
							</button>
						</DropdownMenuTrigger>
						<DropdownMenuContent className="w-60" align="start">
							<DropdownMenuLabel>
								<div className="flex items-center gap-2">
									<Avatar className="h-8 w-8">

										<AvatarFallback>{getInitials(user?.email || 'Usuário')}</AvatarFallback>
									</Avatar>
									<div className="min-w-0">
										<div className="text-sm font-semibold truncate">{user?.email ? String(user.email).split('@')[0] : 'Usuário'}</div>
										<div className="text-xs text-muted-foreground truncate">{user?.email || 'email@example.com'}</div>
									</div>
								</div>
							</DropdownMenuLabel>
							<DropdownMenuSeparator />
							<DropdownMenuGroup>
								<DropdownMenuItem onClick={() => navigate('/account')}>
									<UserIcon className="mr-2 h-4 w-4" />
									Conta
								</DropdownMenuItem>
								<DropdownMenuItem onClick={() => navigate('/billing')}>
									<CreditCard className="mr-2 h-4 w-4" />
									Compras
								</DropdownMenuItem>
								<DropdownMenuItem onClick={() => navigate('/notifications')}>
									<Bell className="mr-2 h-4 w-4" />
									Notificações
								</DropdownMenuItem>
							</DropdownMenuGroup>
							<DropdownMenuSeparator />
							<DropdownMenuItem onClick={handleSignOut}>
								<LogOut className="mr-2 h-4 w-4" />
								Sair
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</SidebarFooter>
			</Sidebar>
			<ContentShell onSignOut={handleSignOut}>{children}</ContentShell>
		</SidebarProvider>
	)
}

function ContentShell({ children, onSignOut }: { children: React.ReactNode; onSignOut: () => void }) {
	const { open } = useSidebar()
	const { user } = useAuth()
	
	return (
		<div className={cn('transition-all duration-200 ease-out min-h-screen', open ? 'ml-[16rem]' : 'ml-[6rem]')}>
			<div className={cn('my-0 rounded-none border bg-white shadow-sm overflow-hidden', open ? 'mx-2' : 'mx-1')}>
				<header className="h-14 flex items-center justify-between px-6 border-b">
					<div className="flex items-center gap-2">
						<SidebarTrigger />
						<Link to="/" className="font-medium">Dashboard</Link>
					</div>
					<nav className="flex items-center gap-3 text-sm">
						<ThemeToggle />
						{user ? (
							<button className="border rounded px-2 py-1" onClick={onSignOut}>Sair</button>
						) : (
							<Link to="/auth">Entrar</Link>
						)}
					</nav>
				</header>
				<main className="px-6 md:px-8 py-6">{children}</main>
				<Footer />
			</div>
		</div>
	)
}

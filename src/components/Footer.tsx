export function Footer() {
	return (
		<footer className="border-t mt-8">
			<div className="max-w-6xl mx-auto px-4 py-6 text-sm text-muted-foreground flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
				<div>© {new Date().getFullYear()} Robuxer. Todos os direitos reservados.</div>
				<nav className="flex items-center gap-4">
					<a className="underline-offset-4 hover:underline" href="#" target="_blank" rel="noreferrer">Termos de uso</a>
					<a className="underline-offset-4 hover:underline" href="#" target="_blank" rel="noreferrer">Privacidade</a>
					<a className="underline-offset-4 hover:underline" href="mailto:suporte@robuxer.app">Suporte</a>
				</nav>
			</div>
		</footer>
	)
}

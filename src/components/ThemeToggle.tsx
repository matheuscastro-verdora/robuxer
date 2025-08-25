import { useTheme } from '../contexts/ThemeProvider'

export function ThemeToggle() {
	const { theme, toggle } = useTheme()
	return (
		<button className="border rounded px-2 py-1 text-sm" onClick={toggle}>
			{theme === 'dark' ? 'Tema: Dark' : 'Tema: Light'}
		</button>
	)
}

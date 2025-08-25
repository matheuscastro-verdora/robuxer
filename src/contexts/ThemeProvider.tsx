import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark'

interface ThemeContextValue {
	theme: Theme
	toggle: () => void
}

const ThemeContext = createContext<ThemeContextValue>({ theme: 'light', toggle: () => {} })

export function ThemeProvider({ children }: { children: React.ReactNode }) {
	const [theme, setTheme] = useState<Theme>('light')

	useEffect(() => {
		const stored = (localStorage.getItem('theme') as Theme | null) ?? 'light'
		setTheme(stored)
	}, [])

	useEffect(() => {
		const root = document.documentElement
		if (theme === 'dark') root.classList.add('dark')
		else root.classList.remove('dark')
		localStorage.setItem('theme', theme)
	}, [theme])

	function toggle() {
		setTheme((t) => (t === 'dark' ? 'light' : 'dark'))
	}

	return <ThemeContext.Provider value={{ theme, toggle }}>{children}</ThemeContext.Provider>
}

export function useTheme() {
	return useContext(ThemeContext)
}

import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import { AuthProvider } from './contexts/AuthProvider'
import { ThemeProvider } from './contexts/ThemeProvider'

import { Toaster } from 'sonner'

const queryClient = new QueryClient()

export default function App() {
	console.log('[robuxer] App mounted')
	return (
		<QueryClientProvider client={queryClient}>
			<ThemeProvider>
				<AuthProvider>
					<RouterProvider router={router} future={{ v7_startTransition: true }} />
					<Toaster richColors position="top-right" />
				</AuthProvider>
			</ThemeProvider>
		</QueryClientProvider>
	)
}

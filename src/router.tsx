import { createBrowserRouter } from 'react-router-dom'
// import Home from './routes/Home'
import Landing from './routes/Landing'
import Start from './routes/Start'
// import Buy from './routes/Buy' // removido (group payout)
import Status from './routes/Status'
import BuyPass from './routes/BuyPass'
import SelectPass from './routes/SelectPass'
import Account from './routes/Account'
import Billing from './routes/Billing'
import Notifications from './routes/Notifications'
import Admin from './routes/Admin'
import Auth from './routes/Auth'
import { ProtectedRoute } from './components/ProtectedRoute'

export const router = createBrowserRouter([
	{ path: '/', element: <Landing /> },
	{ path: '/auth', element: <Auth /> },
	{ path: '/start', element: (
		<ProtectedRoute>
			<Start />
		</ProtectedRoute>
	)},
	{ path: '/buy-pass', element: (
		<ProtectedRoute>
			<BuyPass />
		</ProtectedRoute>
	)},
	{ path: '/select-pass', element: (
		<ProtectedRoute>
			<SelectPass />
		</ProtectedRoute>
	)},
	{ path: '/status/:orderId', element: <Status /> },
	{ path: '/account', element: (
		<ProtectedRoute>
			<Account />
		</ProtectedRoute>
	)},
	{ path: '/billing', element: (
		<ProtectedRoute>
			<Billing />
		</ProtectedRoute>
	)},
	{ path: '/notifications', element: (
		<ProtectedRoute>
			<Notifications />
		</ProtectedRoute>
	)},
	{ path: '/admin', element: <Admin /> },
])

import { createContext, useContext, useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface AuthContextValue {
	user: User | null
	loading: boolean
}

const AuthContext = createContext<AuthContextValue>({ user: null, loading: true })

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [user, setUser] = useState<User | null>(null)
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		let mounted = true
		supabase.auth.getUser().then(({ data }) => {
			if (!mounted) return
			setUser(data.user ?? null)
			setLoading(false)
		})
		const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
			setUser(session?.user ?? null)
		})
		return () => {
			mounted = false
			sub.subscription.unsubscribe()
		}
	}, [])

	return <AuthContext.Provider value={{ user, loading }}>{children}</AuthContext.Provider>
}

export function useAuthContext() {
	return useContext(AuthContext)
}

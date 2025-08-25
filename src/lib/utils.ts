import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: any[]) {
	return twMerge(clsx(inputs))
}

export function getInitials(nameOrEmail: string) {
	const base = (nameOrEmail || '').trim()
	if (!base) return 'US'
	const name = base.includes('@') ? base.split('@')[0] : base
	const parts = name.replace(/[^a-zA-Z0-9]+/g, ' ').trim().split(' ').filter(Boolean)
	const first = parts[0]?.[0] || name[0]
	const second = parts.length > 1 ? parts[1][0] : (name[1] || '')
	return (first + (second || '')).toUpperCase()
}

export function defaultAvatarUrl(seed: string) {
	const s = encodeURIComponent(seed || 'user')
	return `https://api.dicebear.com/7.x/thumbs/svg?seed=${s}`
}
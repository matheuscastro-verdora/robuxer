import { useEffect, useState } from 'react'

function formatRemaining(ms: number) {
	const totalSec = Math.max(0, Math.floor(ms / 1000))
	const d = Math.floor(totalSec / 86400)
	const h = Math.floor((totalSec % 86400) / 3600)
	const m = Math.floor((totalSec % 3600) / 60)
	const s = totalSec % 60
	if (d > 0) return `${d}d ${h}h`
	if (h > 0) return `${h}h ${m}m`
	if (m > 0) return `${m}m ${s}s`
	return `${s}s`
}

export function Countdown({ to }: { to: string }) {
	const target = new Date(to).getTime()
	const [now, setNow] = useState(Date.now())
	useEffect(() => {
		const id = setInterval(() => setNow(Date.now()), 1000)
		return () => clearInterval(id)
	}, [])
	const remaining = target - now
	if (remaining <= 0) return <span>agora</span>
	return <span>{formatRemaining(remaining)}</span>
}

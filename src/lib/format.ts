export function formatBRL(cents: number) {
	try {
		return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
	} catch {
		return `R$ ${(cents / 100).toFixed(2)}`
	}
}

export function formatDateTime(iso?: string | null) {
	if (!iso) return '-'
	try {
		return new Date(iso).toLocaleString('pt-BR')
	} catch {
		return iso
	}
}

export function formatRelative(date: Date) {
	const diff = Date.now() - date.getTime()
	const sec = Math.round(diff / 1000)
	if (sec < 60) return `há ${sec}s`
	const min = Math.round(sec / 60)
	if (min < 60) return `há ${min}m`
	const hr = Math.round(min / 60)
	if (hr < 24) return `há ${hr}h`
	const d = Math.round(hr / 24)
	return `há ${d}d`
}

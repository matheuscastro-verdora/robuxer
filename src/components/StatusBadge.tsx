import { Badge } from './ui/badge'

export function StatusBadge({ status }: { status: string }) {
	const norm = status.toLowerCase()
	let cls = ''
	if (['paid','ok','sent','elegivel','elegível'].includes(norm)) cls = 'bg-green-600 text-white border-none'
	else if (['pending','queued','aguardando'].includes(norm)) cls = 'bg-yellow-500 text-white border-none'
	else if (['failed','error','retry'].includes(norm)) cls = 'bg-red-600 text-white border-none'
	return <Badge className={cls}>{status}</Badge>
}

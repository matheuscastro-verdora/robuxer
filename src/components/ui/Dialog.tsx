import { cn } from '../../lib/utils'

export function Dialog({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
	if (!open) return null
	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center">
			<div className="absolute inset-0 bg-black/50" onClick={onClose} />
			<div className={cn('relative z-10 w-full max-w-md rounded-lg border bg-background p-4 shadow-lg')}>
				{children}
			</div>
		</div>
	)
}

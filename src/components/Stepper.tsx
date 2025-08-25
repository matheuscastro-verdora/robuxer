export function Stepper({ steps, activeIndex }: { steps: string[]; activeIndex: number }) {
	return (
		<ol className="flex items-center gap-3">
			{steps.map((s, i) => (
				<li key={s} className="flex items-center gap-2">
					<div className={`h-6 w-6 rounded-full text-xs flex items-center justify-center ${i <= activeIndex ? 'bg-primary text-primary-foreground' : 'border'}`}>{i+1}</div>
					<span className={`text-sm ${i <= activeIndex ? 'font-medium' : 'text-muted-foreground'}`}>{s}</span>
					{i < steps.length - 1 && <div className={`w-10 h-px ${i < activeIndex ? 'bg-primary' : 'bg-border'}`} />}
				</li>
			))}
		</ol>
	)
}

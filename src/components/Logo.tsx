type Props = { size?: number; withWordmark?: boolean }

export function Logo({ size = 40, withWordmark = true }: Props) {
	const color = '#000000'
	const radius = 10
	// retângulo vertical, não quadrado
	const rectWidth = 28
	const rectHeight = 40
	const rectX = (48 - rectWidth) / 2
	const rectY = (48 - rectHeight) / 2
	return (
		<div className="flex items-center gap-2" aria-label="Robuxer logo">
			<svg width={size} height={size} viewBox="0 0 48 48" role="img" aria-hidden="true">
				<rect x={rectX} y={rectY} width={rectWidth} height={rectHeight} rx={radius} fill={color} />
				<text x="24" y="30" textAnchor="middle" fontFamily="Inter, system-ui, sans-serif" fontSize="20" fontWeight="700" fill="#ffffff">R</text>
			</svg>
			{withWordmark && (
				<span className="text-xl font-semibold" style={{ color }}>Robuxer</span>
			)}
		</div>
	)
}

export function RobuxMark({ size = 28 }: { size?: number }) {
	// marca do Robux (hex + quadrado central) estilizada em preto
	const color = '#000000'
	return (
		<svg width={size} height={size} viewBox="0 0 100 100" role="img" aria-hidden="true">
			<path d="M50 5c4.9 0 9.7 1.3 14 3.8l31 18c8.6 5 14 14.2 14 24.2v36c0 10-5.4 19.2-14 24.2l-31 18c-8.6 5-19.4 5-28 0l-31-18C5.4 106.2 0 97 0 87V51c0-10 5.4-19.2 14-24.2l31-18C40.3 6.3 45.1 5 50 5z" fill={color} opacity="0.85" />
			<rect x="35" y="35" width="30" height="30" fill={color} />
		</svg>
	)
}




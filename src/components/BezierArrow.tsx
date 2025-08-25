import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

type Props = {
	originRef: React.RefObject<HTMLElement>
	destRef: React.RefObject<HTMLElement>
	onCross?: () => void
	onCycleEnd?: () => void
	triggerKey: number
}

const DUR = { in: 0.12, travel: 0.56, out: 0.12 }

export function BezierArrow({ originRef, destRef, onCross, onCycleEnd, triggerKey }: Props) {
	const prefersReduced = useReducedMotion()
	const [geom, setGeom] = useState<{
		vertical: boolean
		y: number
		xStart: number
		xEnd: number
		yStart: number
		yEnd: number
		crossAt: number // posição (x ou y) do centro do card destino
	} | null>(null)

	useEffect(() => {
		function measure() {
			const a = originRef.current?.getBoundingClientRect()
			const b = destRef.current?.getBoundingClientRect()
			if (!a || !b) return
			const aCenter = { x: a.left + a.width / 2, y: a.top + a.height / 2 }
			const bCenter = { x: b.left + b.width / 2, y: b.top + b.height / 2 }
			const dx = Math.abs(bCenter.x - aCenter.x)
			const dy = Math.abs(bCenter.y - aCenter.y)
			if (dx >= dy) {
				// horizontal: seta percorre a viewport inteira
				const y = aCenter.y
				const xStart = 8
				const xEnd = Math.max(0, window.innerWidth - 8)
				setGeom({ vertical: false, y, xStart, xEnd, yStart: 0, yEnd: 0, crossAt: bCenter.x })
			} else {
				// vertical (mobile): seta do topo ao rodapé
				const x = aCenter.x
				const yStart = 8
				const yEnd = Math.max(0, window.innerHeight - 8)
				setGeom({ vertical: true, y: x, xStart: 0, xEnd: 0, yStart, yEnd, crossAt: bCenter.y })
			}
		}
		measure()
		const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null
		if (originRef.current && ro) ro.observe(originRef.current)
		if (destRef.current && ro) ro.observe(destRef.current)
		window.addEventListener('resize', measure)
		return () => { window.removeEventListener('resize', measure); ro?.disconnect() }
	}, [originRef, destRef, triggerKey])

	useEffect(() => {
		if (!geom || prefersReduced) return
		// calcular o instante (em ms) em que a ponta cruza o centro do card destino
		let msToCross = 0
		if (!geom.vertical) {
			const total = Math.max(1, geom.xEnd - geom.xStart)
			const done = Math.min(total, Math.max(0, geom.crossAt - geom.xStart))
			const p = done / total
			msToCross = (DUR.in + DUR.travel * p) * 1000
		} else {
			const total = Math.max(1, geom.yEnd - geom.yStart)
			const done = Math.min(total, Math.max(0, geom.crossAt - geom.yStart))
			const p = done / total
			msToCross = (DUR.in + DUR.travel * p) * 1000
		}
		const t1 = window.setTimeout(() => onCross?.(), msToCross)
		const t2 = window.setTimeout(() => onCycleEnd?.(), (DUR.in + DUR.travel + DUR.out) * 1000)
		return () => { window.clearTimeout(t1); window.clearTimeout(t2) }
	}, [geom, prefersReduced, onCross, onCycleEnd])

	if (!geom) return null
	const color = 'rgba(107,114,128,0.88)'
	const baseStroke = 'rgba(0,0,0,0.18)'

	return prefersReduced ? null : (
		<motion.svg key={triggerKey} className="pointer-events-none fixed left-0 top-0 z-10" style={{ width: '100vw', height: '100vh' }}
			initial={{ opacity: 0, filter: 'blur(1px)' }}
			animate={{ opacity: [0, 1, 1, 0], filter: ['blur(1px)', 'blur(0px)', 'blur(0px)', 'blur(1px)'] }}
			transition={{ duration: DUR.in + DUR.travel + DUR.out, ease: [0.4, 0.0, 0.2, 1] }}
		>
			{!geom.vertical ? (
				<>
					<line x1={0} y1={geom.y} x2={window.innerWidth} y2={geom.y} stroke={baseStroke} strokeWidth={2} strokeLinecap="round" />
					<motion.g initial={{ x: geom.xStart, y: geom.y }} animate={{ x: [geom.xStart, geom.xEnd], y: geom.y }} transition={{ duration: DUR.in + DUR.travel, ease: [0.4, 0.0, 0.2, 1] }}>
						<defs>
							<marker id="arrowHeadH" markerWidth="10" markerHeight="10" refX="6" refY="3" orient="auto">
								<path d="M0,0 L0,6 L6,3 z" fill={color} />
							</marker>
						</defs>
						<line x1={0} y1={0} x2={Math.max(12, (geom.xEnd - geom.xStart) * 0.06)} y2={0} stroke={color} strokeWidth={2} strokeLinecap="round" markerEnd="url(#arrowHeadH)" />
					</motion.g>
				</>
			) : (
				<>
					<line x1={geom.y} y1={0} x2={geom.y} y2={window.innerHeight} stroke={baseStroke} strokeWidth={2} strokeLinecap="round" />
					<motion.g initial={{ x: geom.y, y: geom.yStart }} animate={{ x: geom.y, y: [geom.yStart, geom.yEnd] }} transition={{ duration: DUR.in + DUR.travel, ease: [0.4, 0.0, 0.2, 1] }}>
						<defs>
							<marker id="arrowHeadV" markerWidth="10" markerHeight="10" refX="6" refY="3" orient="auto">
								<path d="M0,0 L0,6 L6,3 z" fill={color} />
							</marker>
						</defs>
						<line x1={0} y1={0} x2={0} y2={Math.max(12, (geom.yEnd - geom.yStart) * 0.06)} stroke={color} strokeWidth={2} strokeLinecap="round" markerEnd="url(#arrowHeadV)" />
					</motion.g>
				</>
			)}
		</motion.svg>
	)
}



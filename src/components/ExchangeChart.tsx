import { useEffect, useRef } from 'react'
import { RobuxMark } from './Logo'

// Substituído: spinner do logo Robux, 180° contínuo com easing
export function ExchangeChart() {
	const ref = useRef<HTMLDivElement | null>(null)
	useEffect(() => {
		if (!ref.current) return
		const el = ref.current
		let raf = 0
		let angle = 0
		let direction = 1 // alterna a cada 180°
		let last = performance.now()
		function loop(now: number) {
			const dt = Math.min(32, now - last)
			last = now
			const target = 180
			const speed = 60 // deg/s base
			const step = speed * (dt / 1000)
			// easing in-out senoidal
			const t = (angle % target) / target
			const ease = 0.5 - 0.5 * Math.cos(Math.PI * 2 * t)
			angle += step * (0.6 + 0.4 * ease) * direction
			if (angle >= target || angle <= 0) {
				// inverte a direção mantendo continuidade
				direction *= -1
				angle = Math.max(0, Math.min(target, angle))
			}
			el.style.transform = `rotate(${angle * (direction === 1 ? 1 : -1)}deg)`
			raf = requestAnimationFrame(loop)
		}
		raw:
		raf = requestAnimationFrame(loop)
		return () => cancelAnimationFrame(raf)
	}, [])

	return (
		<div className="w-full h-[300px] md:h-[320px] flex items-center justify-center">
			<div ref={ref} className="transition-transform duration-300 ease-in-out">
				<RobuxMark size={160} />
			</div>
		</div>
	)
}



import { useEffect, useRef, useState } from 'react'

type Props = {
	value: number
}

const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

export function RobuxTicker({ value }: Props) {
	const prefersReduced = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
	const [display, setDisplay] = useState<number>(value)
	const prevRef = useRef<number>(value)
	const [animating, setAnimating] = useState(false)
	const [duration, setDuration] = useState(300)

	useEffect(() => {
		if (prefersReduced) {
			setDisplay(value)
			prevRef.current = value
			setAnimating(false)
			return
		}
		const from = prevRef.current
		const to = value
		const delta = Math.abs(to - from)
		// duração proporcional ao delta, mantendo constância e legibilidade
		const dur = Math.max(300, Math.min(650, 300 + delta * 8))
		setDuration(dur)
		setAnimating(true)
		let raf = 0
		const start = performance.now()
		function tick(now: number) {
			const t = Math.min(1, (now - start) / dur)
			const eased = easeInOutCubic(t)
			const v = Math.round(from + (to - from) * eased)
			setDisplay(v)
			if (t < 1) raf = requestAnimationFrame(tick)
			else setAnimating(false)
		}
		raf = requestAnimationFrame(tick)
		prevRef.current = value
		return () => cancelAnimationFrame(raf)
	}, [value, prefersReduced])

	const style = prefersReduced
		? undefined
		: { transitionDuration: `${duration}ms` }

	return (
		<span
			aria-live="polite"
			className={`transition-[opacity,filter,transform] ease-in-out ${animating ? 'opacity-90 blur-[1px] scale-[0.99]' : 'opacity-100 blur-0 scale-100'}`}
			style={style}
		>
			{display}
		</span>
	)
}



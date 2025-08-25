import { motion } from 'framer-motion'

export function PixIcon({ size = 18, pulseKey }: { size?: number; pulseKey?: number }) {
	const circle = Math.round(size * 1.6)
	return (
		<motion.div
			key={pulseKey}
			initial={{ scale: 1 }}
			animate={{ scale: [1, 1.05, 1] }}
			transition={{ duration: 0.2, ease: [0.4, 0.0, 0.2, 1] }}
			className="h-9 w-9 rounded-full bg-neutral-200 flex items-center justify-center"
			style={{ width: circle, height: circle }}
			aria-hidden
		>
			{/* Símbolo simplificado de cédula */}
			<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
				<rect x="3" y="7" width="18" height="10" rx="2" fill="currentColor" opacity="0.9" />
				<circle cx="12" cy="12" r="2.5" fill="#fff" />
			</svg>
		</motion.div>
	)
}

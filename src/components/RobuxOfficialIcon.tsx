import { motion } from 'framer-motion'
import robuxLogo from '../assets/Robux_2019_Logo_Black (1).svg'

export function RobuxOfficialIcon({ size = 24, pulseKey }: { size?: number; pulseKey?: number }) {
	const circle = Math.round(size * 1.6)
	return (
		<motion.div
			key={pulseKey}
			initial={{ scale: 1 }}
			animate={{ scale: [1, 1.05, 1] }}
			transition={{ duration: 0.2, ease: [0.4, 0.0, 0.2, 1] }}
			className="rounded-full bg-neutral-200 flex items-center justify-center"
			style={{ width: circle, height: circle }}
			aria-hidden
		>
			<img src={robuxLogo} width={size} height={size} alt="Robux" style={{ display: 'block' }} />
		</motion.div>
	)
}



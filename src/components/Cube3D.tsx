import * as React from 'react'
import { motion } from 'framer-motion'

type Cube3DProps = {
	size?: number // em px
	src?: string
	className?: string
}

export function Cube3D({ size = 256, src = '/18.svg', className }: Cube3DProps) {
	const faceStyle: React.CSSProperties = {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		backgroundImage: `url(${src})`,
		backgroundSize: 'cover',
		backgroundPosition: 'center',
		backfaceVisibility: 'hidden',
	}
	const half = size / 2
	return (
		<div
			className={className}
			style={{
				width: size,
				height: size,
				perspective: 900,
				overflow: 'visible',
			}}
		>
			<motion.div
				style={{ position:'relative', width:'100%', height:'100%', transformStyle:'preserve-3d' }}
				animate={{ rotateX: 360, rotateY: 360 }} // ambos os eixos
				transition={{ type:'tween', ease:'linear', repeat: Infinity, duration: 10 }}
			>
				{/* front */}
				<div style={{ ...faceStyle, transform: `translateZ(${half}px)` }} />
				{/* back */}
				<div style={{ ...faceStyle, transform: `rotateY(180deg) translateZ(${half}px)` }} />
				{/* right */}
				<div style={{ ...faceStyle, transform: `rotateY(90deg) translateZ(${half}px)` }} />
				{/* left */}
				<div style={{ ...faceStyle, transform: `rotateY(-90deg) translateZ(${half}px)` }} />
				{/* top */}
				<div style={{ ...faceStyle, transform: `rotateX(90deg) translateZ(${half}px)` }} />
				{/* bottom */}
				<div style={{ ...faceStyle, transform: `rotateX(-90deg) translateZ(${half}px)` }} />
			</motion.div>
		</div>
	)
}

'use client';

import { useRef, type ReactNode } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { cn } from '@/lib/utils/cn';

interface MagneticButtonProps {
	children: ReactNode;
	className?: string;
	/** Strength of the magnetic pull (0-1). */
	strength?: number;
}

/** Wraps content so it leans toward the cursor on hover (disabled on touch / reduced motion). */
export function MagneticButton({ children, className, strength = 0.35 }: MagneticButtonProps) {
	const ref = useRef<HTMLDivElement>(null);
	const x = useMotionValue(0);
	const y = useMotionValue(0);
	const springX = useSpring(x, { stiffness: 200, damping: 15, mass: 0.3 });
	const springY = useSpring(y, { stiffness: 200, damping: 15, mass: 0.3 });

	function handleMove(e: React.MouseEvent<HTMLDivElement>) {
		const el = ref.current;
		if (!el) return;
		if (window.matchMedia('(pointer: coarse), (prefers-reduced-motion: reduce)').matches) return;
		const rect = el.getBoundingClientRect();
		const relX = e.clientX - (rect.left + rect.width / 2);
		const relY = e.clientY - (rect.top + rect.height / 2);
		x.set(relX * strength);
		y.set(relY * strength);
	}

	function handleLeave() {
		x.set(0);
		y.set(0);
	}

	return (
		<motion.div
			ref={ref}
			onMouseMove={handleMove}
			onMouseLeave={handleLeave}
			style={{ x: springX, y: springY }}
			className={cn('inline-flex', className)}
		>
			{children}
		</motion.div>
	);
}

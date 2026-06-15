'use client';

import { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

/** Dot + trailing ring cursor that grows over interactive elements. Desktop / fine-pointer only. */
export function CustomCursor() {
	const [enabled, setEnabled] = useState(false);
	const [hovering, setHovering] = useState(false);

	const x = useMotionValue(-100);
	const y = useMotionValue(-100);
	const ringX = useSpring(x, { stiffness: 350, damping: 28, mass: 0.5 });
	const ringY = useSpring(y, { stiffness: 350, damping: 28, mass: 0.5 });

	useEffect(() => {
		const fine = window.matchMedia('(pointer: fine)').matches;
		const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		if (!fine || reduced) return;

		setEnabled(true);
		document.documentElement.classList.add('custom-cursor-active');

		const move = (e: MouseEvent) => {
			x.set(e.clientX);
			y.set(e.clientY);
			const target = e.target as HTMLElement;
			setHovering(!!target.closest('a, button, input, textarea, [data-cursor="hover"]'));
		};

		window.addEventListener('mousemove', move);
		return () => {
			window.removeEventListener('mousemove', move);
			document.documentElement.classList.remove('custom-cursor-active');
		};
	}, [x, y]);

	if (!enabled) return null;

	return (
		<>
			<motion.div
				aria-hidden
				className="pointer-events-none fixed left-0 top-0 z-[9998] h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-aura-accent"
				style={{ x, y }}
			/>
			<motion.div
				aria-hidden
				className="pointer-events-none fixed left-0 top-0 z-[9998] -translate-x-1/2 -translate-y-1/2 rounded-full border border-aura-accent/60"
				style={{ x: ringX, y: ringY }}
				animate={{
					width: hovering ? 56 : 32,
					height: hovering ? 56 : 32,
					opacity: hovering ? 1 : 0.5
				}}
				transition={{ type: 'spring', stiffness: 300, damping: 20 }}
			/>
		</>
	);
}

'use client';

import { useCallback, useEffect, useState } from 'react';

interface Spark {
	id: number;
	x: number;
	y: number;
	color: string;
}

const DEFAULT_COLOR = '#6FF0D3'; // aura-accent
const CONTRAST_COLOR = '#0F1A18'; // aura-bg
const SPARK_SIZE = 10;
const SPARK_RADIUS = 15;
const SPARK_COUNT = 8;
const DURATION = 400;

let uid = 0;

/** Radial spark burst on every click. Color flips to dark over accent-colored surfaces. */
export function ClickSpark() {
	const [sparks, setSparks] = useState<Spark[]>([]);

	const handleClick = useCallback((e: MouseEvent) => {
		let color = DEFAULT_COLOR;

		if (e.target instanceof HTMLElement) {
			let el: HTMLElement | null = e.target;
			while (el && el !== document.body) {
				const style = window.getComputedStyle(el);
				const bg = style.backgroundColor;
				if (bg === 'rgb(111, 240, 211)') {
					color = CONTRAST_COLOR;
					break;
				}
				if (bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent' && style.opacity !== '0') break;
				el = el.parentElement;
			}
		}

		const id = uid++;
		setSparks((prev) => [...prev, { id, x: e.clientX, y: e.clientY, color }]);
		window.setTimeout(() => setSparks((prev) => prev.filter((s) => s.id !== id)), DURATION);
	}, []);

	useEffect(() => {
		window.addEventListener('click', handleClick);
		return () => window.removeEventListener('click', handleClick);
	}, [handleClick]);

	return (
		<div
			className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden"
			aria-hidden="true"
		>
			{sparks.map((spark) => (
				<div key={spark.id} className="absolute" style={{ left: spark.x, top: spark.y }}>
					{Array.from({ length: SPARK_COUNT }).map((_, i) => (
						<div
							key={i}
							className="absolute origin-center rounded-full animate-spark"
							style={
								{
									backgroundColor: spark.color,
									width: SPARK_SIZE,
									height: 2,
									left: -SPARK_SIZE / 2,
									top: -1,
									'--angle': `${(360 / SPARK_COUNT) * i}deg`,
									'--radius': `${SPARK_RADIUS}px`
								} as React.CSSProperties
							}
						/>
					))}
				</div>
			))}
		</div>
	);
}

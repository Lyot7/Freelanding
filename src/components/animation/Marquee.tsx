'use client';

import { type ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

interface MarqueeProps {
	children: ReactNode;
	/** Seconds for one full loop. */
	speed?: number;
	className?: string;
	reverse?: boolean;
}

/** Seamless infinite horizontal marquee (CSS-driven, pauses on hover). */
export function Marquee({ children, speed = 30, className, reverse = false }: MarqueeProps) {
	return (
		<div className={cn('group relative flex w-full overflow-hidden', className)}>
			<div
				className="flex shrink-0 items-center gap-6 pr-6 group-hover:[animation-play-state:paused] motion-reduce:animate-none"
				style={{
					animation: `marquee-scroll ${speed}s linear infinite`,
					animationDirection: reverse ? 'reverse' : 'normal'
				}}
			>
				{children}
				{/* duplicate for seamless loop */}
				<span className="flex items-center gap-6 pr-6" aria-hidden="true">
					{children}
				</span>
			</div>
		</div>
	);
}

'use client';

import { createElement, useRef, type ElementType, type ReactNode } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { useGSAP } from '@gsap/react';
import { cn } from '@/lib/utils/cn';

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);

interface AnimatedTextProps {
	children: ReactNode;
	/** HTML tag to render. */
	as?: ElementType;
	className?: string;
	/** Split granularity. */
	splitType?: 'lines' | 'words' | 'chars' | 'words,chars';
	/** Stagger between revealed parts (s). */
	stagger?: number;
	/** Delay before the reveal starts (s). */
	delay?: number;
	/** Trigger when scrolled into view (default) or immediately on mount. */
	trigger?: 'scroll' | 'mount';
}

/**
 * chkstepan-style masked text reveal using the (now free) GSAP SplitText.
 * Falls back to plain text when reduced motion is requested.
 */
export function AnimatedText({
	children,
	as: Tag = 'div',
	className,
	splitType = 'lines',
	stagger = 0.08,
	delay = 0,
	trigger = 'scroll'
}: AnimatedTextProps) {
	const ref = useRef<HTMLElement>(null);

	useGSAP(
		() => {
			const el = ref.current;
			if (!el) return;
			if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

			const split = new SplitText(el, {
				type: splitType,
				linesClass: 'split-line',
				mask: splitType.includes('lines') ? 'lines' : undefined
			});

			const targets = splitType.includes('chars')
				? split.chars
				: splitType.includes('words')
					? split.words
					: split.lines;

			gsap.set(targets, { yPercent: 110 });
			gsap.to(targets, {
				yPercent: 0,
				duration: 0.9,
				ease: 'power4.out',
				stagger,
				delay,
				scrollTrigger:
					trigger === 'scroll'
						? { trigger: el, start: 'top 85%', once: true }
						: undefined
			});

			return () => split.revert();
		},
		{ scope: ref, dependencies: [splitType, stagger, delay, trigger] }
	);

	return createElement(Tag, { ref, className: cn(className) }, children);
}

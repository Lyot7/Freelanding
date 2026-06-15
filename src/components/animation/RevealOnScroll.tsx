'use client';

import { createElement, useRef, type ElementType, type ReactNode } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { cn } from '@/lib/utils/cn';

gsap.registerPlugin(useGSAP, ScrollTrigger);

interface RevealOnScrollProps {
	children: ReactNode;
	as?: ElementType;
	className?: string;
	/** Delay in ms (kept compatible with the old `use:reveal={{ delay }}` API). */
	delay?: number;
	y?: number;
}

/** Generic fade + rise-in on scroll. Replaces the old Svelte `reveal` action. */
export function RevealOnScroll({
	children,
	as: Tag = 'div',
	className,
	delay = 0,
	y = 24
}: RevealOnScrollProps) {
	const ref = useRef<HTMLElement>(null);

	useGSAP(
		() => {
			const el = ref.current;
			if (!el) return;
			if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
				gsap.set(el, { opacity: 1, y: 0 });
				return;
			}
			gsap.fromTo(
				el,
				{ opacity: 0, y },
				{
					opacity: 1,
					y: 0,
					duration: 0.8,
					delay: delay / 1000,
					ease: 'power3.out',
					scrollTrigger: { trigger: el, start: 'top 88%', once: true }
				}
			);
		},
		{ scope: ref, dependencies: [delay, y] }
	);

	return createElement(Tag, { ref, className: cn(className) }, children);
}

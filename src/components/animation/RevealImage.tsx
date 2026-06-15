'use client';

import { useRef } from 'react';
import Image, { type ImageProps } from 'next/image';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { cn } from '@/lib/utils/cn';

gsap.registerPlugin(useGSAP, ScrollTrigger);

type RevealImageProps = ImageProps & {
	wrapperClassName?: string;
};

/** Image that reveals with a clip-path wipe + subtle scale on scroll. */
export function RevealImage({ wrapperClassName, className, alt, ...imageProps }: RevealImageProps) {
	const ref = useRef<HTMLDivElement>(null);

	useGSAP(
		() => {
			const el = ref.current;
			if (!el) return;
			const img = el.querySelector('img');
			if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

			gsap.fromTo(
				el,
				{ clipPath: 'inset(100% 0% 0% 0%)' },
				{
					clipPath: 'inset(0% 0% 0% 0%)',
					duration: 1.1,
					ease: 'power4.out',
					scrollTrigger: { trigger: el, start: 'top 85%', once: true }
				}
			);
			if (img) {
				gsap.fromTo(
					img,
					{ scale: 1.25 },
					{
						scale: 1,
						duration: 1.3,
						ease: 'power4.out',
						scrollTrigger: { trigger: el, start: 'top 85%', once: true }
					}
				);
			}
		},
		{ scope: ref }
	);

	return (
		<div ref={ref} className={cn('relative overflow-hidden', wrapperClassName)}>
			<Image alt={alt} className={cn(className)} {...imageProps} />
		</div>
	);
}

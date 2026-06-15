'use client';

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

interface LenisContextValue {
	lenis: Lenis | null;
	/** Smoothly scroll to an element/anchor/offset. Falls back to native scroll. */
	scrollTo: (target: string | number | HTMLElement, options?: { offset?: number; immediate?: boolean }) => void;
}

const LenisContext = createContext<LenisContextValue>({
	lenis: null,
	scrollTo: () => {}
});

export function useLenis() {
	return useContext(LenisContext);
}

export function SmoothScrollProvider({ children }: { children: ReactNode }) {
	const lenisRef = useRef<Lenis | null>(null);
	const [ready, setReady] = useState(false);
	const pathname = usePathname();

	useEffect(() => {
		const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

		gsap.registerPlugin(ScrollTrigger);

		if (prefersReduced) {
			// No smooth scroll; ScrollTrigger still works on native scroll.
			setReady(true);
			return;
		}

		const lenis = new Lenis({
			lerp: 0.1,
			smoothWheel: true,
			wheelMultiplier: 1,
			touchMultiplier: 1.5
		});
		lenisRef.current = lenis;

		// Lenis drives ScrollTrigger updates...
		lenis.on('scroll', ScrollTrigger.update);

		// ...and a single GSAP ticker drives Lenis (one rAF, no double loop).
		const raf = (time: number) => lenis.raf(time * 1000);
		gsap.ticker.add(raf);
		gsap.ticker.lagSmoothing(0);

		setReady(true);

		return () => {
			gsap.ticker.remove(raf);
			lenis.destroy();
			lenisRef.current = null;
		};
	}, []);

	// Reset scroll + refresh ScrollTrigger on route change.
	useEffect(() => {
		if (!ready) return;
		const lenis = lenisRef.current;
		if (lenis) {
			lenis.scrollTo(0, { immediate: true });
		} else {
			window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
		}
		// Allow layout to settle before recomputing trigger positions.
		const id = window.setTimeout(() => ScrollTrigger.refresh(), 200);
		return () => window.clearTimeout(id);
	}, [pathname, ready]);

	const scrollTo: LenisContextValue['scrollTo'] = (target, options) => {
		const lenis = lenisRef.current;
		if (lenis) {
			lenis.scrollTo(target, { offset: options?.offset ?? 0, immediate: options?.immediate });
			return;
		}
		// Fallback: native behaviour
		if (typeof target === 'number') {
			window.scrollTo({ top: target, behavior: options?.immediate ? 'instant' : ('smooth' as ScrollBehavior) });
		} else if (typeof target === 'string') {
			const el = document.querySelector(target);
			el?.scrollIntoView({ behavior: 'smooth' });
		} else {
			target.scrollIntoView({ behavior: 'smooth' });
		}
	};

	return (
		<LenisContext.Provider value={{ lenis: lenisRef.current, scrollTo }}>
			{children}
		</LenisContext.Provider>
	);
}

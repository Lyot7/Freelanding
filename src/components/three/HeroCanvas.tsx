'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

// WebGL never enters the SSR / initial server bundle.
const HeroScene = dynamic(() => import('./HeroScene'), {
	ssr: false,
	loading: () => <Poster />
});

/** CSS gradient poster shown before/instead of WebGL (LCP-safe, reduced-motion fallback). */
function Poster() {
	return (
		<div className="absolute inset-0">
			<div className="absolute left-1/2 top-1/2 h-[70%] w-[70%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-aura-accent/20 blur-[90px]" />
			<div className="absolute left-1/3 top-1/3 h-[40%] w-[40%] rounded-full bg-aura-gold/10 blur-[70px]" />
		</div>
	);
}

export function HeroCanvas() {
	const [mode, setMode] = useState<'loading' | 'webgl' | 'poster'>('loading');
	const [isMobile, setIsMobile] = useState(false);

	useEffect(() => {
		const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		const mobile = window.matchMedia('(max-width: 768px)').matches;
		setIsMobile(mobile);
		setMode(reduced ? 'poster' : 'webgl');
	}, []);

	if (mode !== 'webgl') return <Poster />;

	return (
		<div className="absolute inset-0">
			<HeroScene isMobile={isMobile} />
		</div>
	);
}

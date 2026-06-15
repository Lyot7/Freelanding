'use client';

import { type ReactNode } from 'react';
import { SmoothScrollProvider } from '@/components/animation/SmoothScrollProvider';
import { CustomCursor } from '@/components/animation/CustomCursor';
import { ClickSpark } from '@/components/animation/ClickSpark';
import { PageTransition } from '@/components/animation/PageTransition';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { CookieBanner } from '@/components/consent/CookieBanner';
import { PostHogProvider } from '@/components/consent/PostHogProvider';

export function Providers({ children }: { children: ReactNode }) {
	return (
		<SmoothScrollProvider>
			<ClickSpark />
			<CustomCursor />
			<Navbar />

			<div className="relative min-h-screen">
				<div className="noise-bg" />
				<main>
					<PageTransition>{children}</PageTransition>
				</main>
				<Footer />
			</div>

			<CookieBanner />
			<PostHogProvider />
		</SmoothScrollProvider>
	);
}

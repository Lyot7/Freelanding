'use client';

import { useEffect } from 'react';
import { useFooterStore, type FooterConfig } from '@/store/footer';

/** Drop into any page to override the footer CTA; resets on unmount. */
export function FooterConfigurator({ config }: { config: FooterConfig }) {
	useEffect(() => {
		useFooterStore.getState().configure(config);
		return () => useFooterStore.getState().reset();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);
	return null;
}

'use client';

import { useEffect } from 'react';
import posthog from 'posthog-js';
import { useConsentStore } from '@/store/consent';

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

let initialized = false;

/** Consent-aware PostHog initialization (RGPD: opt-in only). */
export function PostHogProvider() {
	const consent = useConsentStore((s) => s.consent);

	useEffect(() => {
		if (!POSTHOG_KEY) return; // not configured
		if (consent === 'pending') return;

		if (!initialized) {
			posthog.init(POSTHOG_KEY, {
				api_host: POSTHOG_HOST,
				persistence: consent === 'accepted' ? 'localStorage+cookie' : 'memory',
				autocapture: consent === 'accepted',
				capture_pageview: consent === 'accepted',
				capture_pageleave: consent === 'accepted',
				opt_out_capturing_by_default: consent !== 'accepted',
				disable_session_recording: consent !== 'accepted'
			});
			initialized = true;
		}

		if (consent === 'accepted') {
			posthog.opt_in_capturing();
		} else {
			posthog.opt_out_capturing();
		}
	}, [consent]);

	return null;
}

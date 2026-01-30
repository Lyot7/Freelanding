<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { cookieConsent, type CookieConsent } from '$lib/stores/cookies';

	// Replace with your PostHog Project API Key
	const POSTHOG_KEY = 'YOUR_POSTHOG_PROJECT_API_KEY';
	const POSTHOG_HOST = 'https://us.i.posthog.com'; // US region

	let initialized = false;

	function initPostHog(consent: CookieConsent) {
		if (!browser || initialized) return;

		// Only initialize when we have a decision (not pending)
		if (consent === 'pending') return;

		// @ts-expect-error - PostHog is loaded via script
		if (typeof window.posthog !== 'undefined') {
			// PostHog already loaded, just update consent
			if (consent === 'accepted') {
				// @ts-expect-error - PostHog global
				window.posthog.opt_in_capturing();
			} else {
				// @ts-expect-error - PostHog global
				window.posthog.opt_out_capturing();
			}
			return;
		}

		// Load PostHog script
		const script = document.createElement('script');
		script.src = 'https://us-assets.i.posthog.com/static/array.js';
		script.async = true;
		script.onload = () => {
			// @ts-expect-error - PostHog global
			window.posthog.init(POSTHOG_KEY, {
				api_host: POSTHOG_HOST,
				persistence: consent === 'accepted' ? 'localStorage+cookie' : 'memory',
				autocapture: consent === 'accepted',
				capture_pageview: consent === 'accepted',
				capture_pageleave: consent === 'accepted',
				// Respect user choice
				opt_out_capturing_by_default: consent !== 'accepted',
				// Privacy settings
				disable_session_recording: consent !== 'accepted',
				mask_all_text: false,
				mask_all_element_attributes: false
			});

			initialized = true;
		};
		document.head.appendChild(script);
	}

	onMount(() => {
		// Subscribe to consent changes
		const unsubscribe = cookieConsent.subscribe((consent) => {
			initPostHog(consent);
		});

		return unsubscribe;
	});
</script>

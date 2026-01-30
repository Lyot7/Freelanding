import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export type CookieConsent = 'pending' | 'accepted' | 'rejected';

const STORAGE_KEY = 'cookie-consent';

function getInitialConsent(): CookieConsent {
	if (!browser) return 'pending';

	const stored = localStorage.getItem(STORAGE_KEY);
	if (stored === 'accepted' || stored === 'rejected') {
		return stored;
	}
	return 'pending';
}

function createCookieConsentStore() {
	const { subscribe, set } = writable<CookieConsent>(getInitialConsent());

	return {
		subscribe,
		accept: () => {
			if (browser) {
				localStorage.setItem(STORAGE_KEY, 'accepted');
			}
			set('accepted');
		},
		reject: () => {
			if (browser) {
				localStorage.setItem(STORAGE_KEY, 'rejected');
			}
			set('rejected');
		},
		reset: () => {
			if (browser) {
				localStorage.removeItem(STORAGE_KEY);
			}
			set('pending');
		}
	};
}

export const cookieConsent = createCookieConsentStore();

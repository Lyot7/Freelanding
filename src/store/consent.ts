import { create } from 'zustand';

export type CookieConsent = 'pending' | 'accepted' | 'rejected';

const STORAGE_KEY = 'cookie-consent';

function getInitialConsent(): CookieConsent {
	if (typeof window === 'undefined') return 'pending';
	const stored = window.localStorage.getItem(STORAGE_KEY);
	if (stored === 'accepted' || stored === 'rejected') return stored;
	return 'pending';
}

interface ConsentStore {
	consent: CookieConsent;
	/** Re-read from localStorage (call once on mount to avoid hydration mismatch). */
	hydrate: () => void;
	accept: () => void;
	reject: () => void;
	reset: () => void;
}

export const useConsentStore = create<ConsentStore>((set) => ({
	// Always start as 'pending' on the server AND first client render to keep markup identical.
	consent: 'pending',
	hydrate: () => set({ consent: getInitialConsent() }),
	accept: () => {
		if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEY, 'accepted');
		set({ consent: 'accepted' });
	},
	reject: () => {
		if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEY, 'rejected');
		set({ consent: 'rejected' });
	},
	reset: () => {
		if (typeof window !== 'undefined') window.localStorage.removeItem(STORAGE_KEY);
		set({ consent: 'pending' });
	}
}));

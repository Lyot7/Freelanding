'use client';

import { useConsentStore } from '@/store/consent';

export function CookieResetButton() {
	const reset = useConsentStore((s) => s.reset);

	return (
		<button onClick={() => reset()} className="text-aura-accent hover:underline">
			cliquer ici
		</button>
	);
}

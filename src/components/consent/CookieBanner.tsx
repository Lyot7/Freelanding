'use client';

import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import { useConsentStore } from '@/store/consent';

export function CookieBanner() {
	const consent = useConsentStore((s) => s.consent);
	const hydrate = useConsentStore((s) => s.hydrate);
	const accept = useConsentStore((s) => s.accept);
	const reject = useConsentStore((s) => s.reject);

	// Read persisted choice after mount (keeps SSR markup stable).
	useEffect(() => {
		hydrate();
	}, [hydrate]);

	return (
		<AnimatePresence>
			{consent === 'pending' && (
				<motion.div
					initial={{ y: 100, opacity: 0 }}
					animate={{ y: 0, opacity: 1 }}
					exit={{ opacity: 0 }}
					transition={{ duration: 0.4, delay: 0.5 }}
					className="fixed bottom-0 left-0 right-0 z-[100] p-4 md:p-6"
				>
					<div className="mx-auto max-w-3xl rounded-[24px] border border-aura-surface bg-aura-card/95 backdrop-blur-xl p-4 md:p-5 shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.5)]">
						{/* Desktop */}
						<div className="hidden md:flex items-center gap-6">
							<div className="flex items-start gap-4 flex-1">
								<span className="text-3xl mt-0.5" aria-hidden="true">
									🍪
								</span>
								<div>
									<h3 className="font-serif text-lg text-white mb-1">Cookies &amp; Confidentialité</h3>
									<p className="text-aura-muted text-sm leading-relaxed">
										Ce site utilise des cookies d&apos;analyse pour améliorer votre expérience.{' '}
										<Link href="/mentions-legales#cookies" className="text-aura-accent hover:underline">
											En savoir plus
										</Link>
									</p>
								</div>
							</div>
							<div className="flex items-center gap-3 shrink-0">
								<button
									onClick={reject}
									className="px-6 py-3 rounded-full border border-aura-surface text-white hover:bg-aura-surface transition-all duration-300 text-sm font-medium"
								>
									Refuser
								</button>
								<button
									onClick={accept}
									className="px-6 py-3 rounded-full bg-aura-accent text-aura-bg hover:bg-white transition-all duration-300 text-sm font-bold shadow-[0_0_20px_rgba(111,240,211,0.2)] hover:shadow-[0_0_30px_rgba(111,240,211,0.4)]"
								>
									Accepter
								</button>
							</div>
						</div>

						{/* Mobile */}
						<div className="md:hidden">
							<div className="flex items-center gap-3 mb-3">
								<span className="text-2xl" aria-hidden="true">
									🍪
								</span>
								<h3 className="font-serif text-lg text-white">Cookies</h3>
							</div>
							<p className="text-aura-muted text-sm leading-relaxed mb-4">
								Ce site utilise des cookies d&apos;analyse pour améliorer votre expérience.{' '}
								<Link href="/mentions-legales#cookies" className="text-aura-accent hover:underline">
									En savoir plus
								</Link>
							</p>
							<div className="flex gap-3">
								<button
									onClick={reject}
									className="flex-1 px-4 py-3 rounded-full border border-aura-surface text-white hover:bg-aura-surface transition-all duration-300 text-sm font-medium"
								>
									Refuser
								</button>
								<button
									onClick={accept}
									className="flex-1 px-4 py-3 rounded-full bg-aura-accent text-aura-bg hover:bg-white transition-all duration-300 text-sm font-bold shadow-[0_0_20px_rgba(111,240,211,0.2)]"
								>
									Accepter
								</button>
							</div>
						</div>
					</div>
				</motion.div>
			)}
		</AnimatePresence>
	);
}

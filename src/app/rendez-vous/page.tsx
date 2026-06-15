'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BookingCalendar } from '@/components/booking/BookingCalendar';
import { ContactForm } from '@/components/forms/ContactForm';

type ContactMode = 'calendar' | 'form';

export default function RendezVousPage() {
	const [mode, setMode] = useState<ContactMode>('calendar');

	return (
		<div className="relative w-full flex flex-col items-center pt-32 pb-0 px-4 md:px-6 min-h-screen">
			<div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-aura-accent/5 rounded-full blur-[120px] pointer-events-none z-0" />
			<div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-aura-gold/5 rounded-full blur-[100px] pointer-events-none z-0" />

			<div className="w-full max-w-3xl mx-auto text-center mb-10 relative z-10">
				<div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-aura-surface bg-aura-card/50 mb-6">
					<span className="w-1.5 h-1.5 rounded-full bg-aura-accent animate-pulse" />
					<span className="text-xs uppercase tracking-widest text-aura-muted">
						Premier échange gratuit
					</span>
				</div>

				<h1 className="font-serif text-4xl md:text-5xl lg:text-5xl font-medium leading-tight mb-6">
					Discutons de <br />
					<span className="font-serif italic text-aura-accent">votre projet</span>
				</h1>

				<p className="text-lg text-aura-muted leading-relaxed max-w-xl mx-auto">
					30 minutes pour faire le point sur vos besoins et identifier les leviers de croissance pour
					votre activité.
				</p>
			</div>

			<div id="contact" className="relative z-10 w-full max-w-md mx-auto mb-10">
				<div className="flex rounded-xl border border-aura-surface bg-aura-card/30 p-1">
					<button
						onClick={() => setMode('calendar')}
						className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-300 ${
							mode === 'calendar' ? 'bg-aura-accent text-aura-bg' : 'text-aura-muted hover:text-aura-text'
						}`}
					>
						<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
							/>
						</svg>
						Rendez-vous
					</button>
					<button
						onClick={() => setMode('form')}
						className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-300 ${
							mode === 'form' ? 'bg-aura-accent text-aura-bg' : 'text-aura-muted hover:text-aura-text'
						}`}
					>
						<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
							/>
						</svg>
						Message
					</button>
				</div>
			</div>

			<div className="relative z-10 w-full max-w-4xl mb-16">
				<AnimatePresence mode="wait">
					{mode === 'calendar' ? (
						<motion.div
							key="calendar"
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							transition={{ duration: 0.3 }}
						>
							<BookingCalendar />
						</motion.div>
					) : (
						<motion.div
							key="form"
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							transition={{ duration: 0.3 }}
							className="flex justify-center"
						>
							<ContactForm />
						</motion.div>
					)}
				</AnimatePresence>
			</div>
		</div>
	);
}

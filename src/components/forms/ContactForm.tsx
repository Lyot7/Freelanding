'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

export function ContactForm() {
	const [name, setName] = useState('');
	const [email, setEmail] = useState('');
	const [message, setMessage] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [success, setSuccess] = useState(false);
	const [error, setError] = useState('');

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError('');
		setIsLoading(true);
		try {
			const response = await fetch('/api/contact', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name, email, message })
			});
			const data = await response.json();
			if (!response.ok) {
				setError(data.error || "Une erreur s'est produite");
				return;
			}
			setSuccess(true);
			setName('');
			setEmail('');
			setMessage('');
		} catch {
			setError("Impossible d'envoyer le message. Veuillez réessayer.");
		} finally {
			setIsLoading(false);
		}
	}

	return (
		<div className="w-full max-w-md mx-auto">
			{success ? (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ duration: 0.3 }}
					className="text-center p-8 rounded-2xl border border-aura-accent/30 bg-aura-card/50"
				>
					<div className="w-12 h-12 mx-auto mb-4 rounded-full bg-aura-accent/20 flex items-center justify-center">
						<svg className="w-6 h-6 text-aura-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
						</svg>
					</div>
					<h3 className="text-xl font-medium text-aura-text mb-2">Message envoyé</h3>
					<p className="text-aura-muted mb-6">Je vous répondrai dans les plus brefs délais.</p>
					<button
						onClick={() => {
							setSuccess(false);
							setError('');
						}}
						className="text-sm text-aura-accent hover:text-aura-accent/80 transition-colors"
					>
						Envoyer un autre message
					</button>
				</motion.div>
			) : (
				<motion.form
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ duration: 0.3 }}
					onSubmit={handleSubmit}
					className="space-y-5"
				>
					{error && (
						<div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-sm">
							{error}
						</div>
					)}

					<div>
						<label htmlFor="name" className="block text-sm text-aura-muted mb-2">
							Nom
						</label>
						<input
							type="text"
							id="name"
							value={name}
							onChange={(e) => setName(e.target.value)}
							required
							minLength={2}
							disabled={isLoading}
							className="w-full px-4 py-3 rounded-xl border border-aura-surface bg-aura-card/50 text-aura-text placeholder-aura-muted/50 focus:outline-none focus:border-aura-accent/50 transition-colors disabled:opacity-50"
							placeholder="Votre nom"
						/>
					</div>

					<div>
						<label htmlFor="email" className="block text-sm text-aura-muted mb-2">
							Email
						</label>
						<input
							type="email"
							id="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							required
							disabled={isLoading}
							className="w-full px-4 py-3 rounded-xl border border-aura-surface bg-aura-card/50 text-aura-text placeholder-aura-muted/50 focus:outline-none focus:border-aura-accent/50 transition-colors disabled:opacity-50"
							placeholder="votre@email.com"
						/>
					</div>

					<div>
						<label htmlFor="message" className="block text-sm text-aura-muted mb-2">
							Message
						</label>
						<textarea
							id="message"
							value={message}
							onChange={(e) => setMessage(e.target.value)}
							required
							minLength={10}
							rows={4}
							disabled={isLoading}
							className="w-full px-4 py-3 rounded-xl border border-aura-surface bg-aura-card/50 text-aura-text placeholder-aura-muted/50 focus:outline-none focus:border-aura-accent/50 transition-colors resize-none disabled:opacity-50"
							placeholder="Décrivez votre projet..."
						/>
					</div>

					<button
						type="submit"
						disabled={isLoading}
						className="w-full px-6 py-3 rounded-xl bg-aura-accent text-aura-bg font-medium hover:bg-aura-accent/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
					>
						{isLoading ? (
							<>
								<svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
									<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
									<path
										className="opacity-75"
										fill="currentColor"
										d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
									/>
								</svg>
								Envoi en cours...
							</>
						) : (
							<>
								<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
									/>
								</svg>
								Envoyer le message
							</>
						)}
					</button>
				</motion.form>
			)}
		</div>
	);
}

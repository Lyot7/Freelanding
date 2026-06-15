'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { HeroCanvas } from '@/components/three/HeroCanvas';
import { AnimatedText } from '@/components/animation/AnimatedText';
import { Button } from '@/components/ui/Button';

export function Hero() {
	return (
		<header
			id="top"
			className="relative min-h-screen pt-32 pb-12 md:pt-32 md:pb-20 flex flex-col justify-center px-6 overflow-hidden"
		>
			{/* 3D background */}
			<div className="pointer-events-none absolute inset-0 z-0 opacity-90">
				<HeroCanvas />
			</div>

			{/* Abstract Background Glows */}
			<div className="absolute top-0 right-0 w-[600px] h-[600px] bg-aura-accent/5 rounded-full blur-[120px] pointer-events-none" />
			<div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-aura-gold/5 rounded-full blur-[100px] pointer-events-none" />

			<div className="max-w-7xl mx-auto w-full grid lg:grid-cols-12 gap-10 lg:gap-16 items-center z-10">
				{/* Left Content */}
				<div className="lg:col-span-7 space-y-8 md:space-y-10">
					<motion.div
						initial={{ opacity: 0, y: 12 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6 }}
						className="hidden lg:inline-flex items-center gap-2 px-3 py-1 rounded-full border border-aura-surface bg-aura-card/50 backdrop-blur-sm"
					>
						<span className="material-symbols-outlined text-[16px] text-aura-accent shrink-0">
							verified
						</span>
						<span className="text-xs uppercase tracking-widest text-aura-muted truncate">
							Développeur &amp; Manager de projet Web
						</span>
					</motion.div>

					<AnimatedText
						as="h1"
						className="text-4xl md:text-6xl font-serif leading-[1.05]"
						splitType="lines"
						trigger="mount"
						stagger={0.12}
					>
						<>
							Automatisez ce qui ralentit,{' '}
							<span className="text-aura-accent italic">accélérez ce qui rapporte</span>.
						</>
					</AnimatedText>

					<motion.p
						initial={{ opacity: 0, y: 12 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6, delay: 0.5 }}
						className="text-lg md:text-xl text-aura-muted font-light max-w-2xl leading-relaxed"
					>
						Vos équipes perdent des heures sur des tâches répétitives. Je crée des solutions web et
						IA qui les font à leur place, plus vite et sans erreur. Résultat : vos équipes se
						concentrent sur ce qui fait vraiment grandir votre business.
					</motion.p>

					<motion.div
						initial={{ opacity: 0, y: 12 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6, delay: 0.7 }}
						className="flex flex-col sm:flex-row gap-4 md:gap-5 pt-4"
					>
						<Button href="#simulator" variant="primary" magnetic>
							Simuler mes gains
							<span className="material-symbols-outlined ml-2 text-sm transition-transform group-hover:translate-x-1">
								payments
							</span>
						</Button>
						<Button href="/rendez-vous" variant="secondary" magnetic>
							Prendre rendez-vous
							<span className="material-symbols-outlined text-sm">calendar_today</span>
						</Button>
					</motion.div>
				</div>

				{/* Right Visual (Hero Image) */}
				<motion.div
					initial={{ opacity: 0, scale: 0.96 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ duration: 0.8, delay: 0.3 }}
					className="lg:col-span-5 relative max-w-xs md:max-w-md mx-auto lg:max-w-none w-full"
				>
					<div className="relative w-full aspect-[3/4] rounded-t-[100px] rounded-b-[30px] overflow-hidden border border-aura-surface bg-aura-card/40 backdrop-blur-sm">
						<Image
							src="/images/my-pic.png"
							alt="Eliott Bouquerel"
							fill
							sizes="(max-width: 1024px) 90vw, 40vw"
							className="object-cover"
							priority
						/>

						{/* Title Badge (Mobile/Tablet only) */}
						<div className="lg:hidden absolute bottom-6 left-1/2 -translate-x-1/2 inline-flex items-center gap-3 px-5 py-3 rounded-2xl border border-aura-surface bg-aura-card/80 backdrop-blur-xl shadow-2xl w-[calc(100%-3rem)]">
							<span className="material-symbols-outlined text-[20px] text-aura-accent shrink-0">
								verified
							</span>
							<span className="text-xs sm:text-sm uppercase tracking-widest text-aura-muted text-center">
								Développeur &amp; Manager de projet Web
							</span>
						</div>

						{/* Floating Card (Desktop only) */}
						<div className="hidden lg:block absolute bottom-8 left-8 right-8 bg-aura-bg/80 backdrop-blur-xl border border-aura-surface p-5 rounded-2xl shadow-2xl">
							<div className="flex justify-between items-start">
								<div>
									<p className="text-xs text-aura-accent uppercase tracking-wider mb-1">
										Dernière Mission
									</p>
									<p className="font-serif text-lg leading-tight">Infrastructure E-commerce</p>
								</div>
								<span className="bg-aura-surface p-2 rounded-full text-aura-accent">
									<span className="material-symbols-outlined">store</span>
								</span>
							</div>
							<div className="mt-3 flex items-center gap-2 text-sm text-aura-muted">
								<span className="flex items-center text-aura-accent">
									<span className="material-symbols-outlined text-[16px] mr-1">speed</span> -80% Temps
									gestion
								</span>
								<span className="w-1 h-1 rounded-full bg-aura-surface" />
								<span>Refonte Totale</span>
							</div>
						</div>
					</div>
				</motion.div>
			</div>
		</header>
	);
}

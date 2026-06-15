'use client';

import { useMemo, useState } from 'react';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { RevealOnScroll } from '@/components/animation/RevealOnScroll';

function formatCurrency(value: number): string {
	return new Intl.NumberFormat('fr-FR', {
		style: 'currency',
		currency: 'EUR',
		maximumFractionDigits: 0
	}).format(value);
}

function formatNumber(value: number): string {
	return new Intl.NumberFormat('fr-FR').format(value);
}

export function RoiSimulator() {
	const [employees, setEmployees] = useState(10);
	const [salary, setSalary] = useState(4000);
	const [hours, setHours] = useState(5);

	const annualHours = useMemo(() => Math.round(hours * 47 * employees), [hours, employees]);
	const annualSaving = useMemo(() => {
		const hourlyCost = salary / 151.67;
		return Math.round(hourlyCost * hours * 47 * employees);
	}, [salary, hours, employees]);
	const fullTimeEquivalent = useMemo(() => (annualHours / 1607).toFixed(1), [annualHours]);

	function setPreset(type: 'startup' | 'pme') {
		if (type === 'startup') {
			setEmployees(10);
			setSalary(3500);
			setHours(8);
		} else {
			setEmployees(50);
			setSalary(4000);
			setHours(4);
		}
	}

	return (
		<section className="py-14 md:py-24 bg-[#121E1C] relative overflow-hidden scroll-mt-32" id="simulator">
			<div className="max-w-6xl mx-auto px-6 relative z-10">
				<div className="grid lg:grid-cols-12 gap-12 items-center">
					{/* Text Area */}
					<RevealOnScroll className="lg:col-span-4">
						<span className="text-aura-accent text-sm font-semibold tracking-widest uppercase mb-2 block">
							Projection Réelle
						</span>
						<SectionTitle title="Combien vous coûte" subtitle="l'immobilisme ?" align="left" />
						<p className="text-aura-muted mb-8 text-sm leading-relaxed">
							Ce simulateur n&apos;est pas un gadget. Il se base sur les métriques moyennes observées
							chez mes clients post-transition IA. Visualisez le capital que vous pourriez réinvestir.
						</p>
						<div className="space-y-3">
							<p className="text-xs text-aura-muted uppercase tracking-wider">Scénarios types :</p>
							<div className="flex gap-2 flex-wrap">
								<button
									onClick={() => setPreset('startup')}
									className="px-4 py-2 rounded-lg bg-aura-surface hover:bg-aura-accent hover:text-aura-bg transition-colors text-xs font-medium border border-transparent hover:border-aura-accent"
								>
									Startup (10 pers)
								</button>
								<button
									onClick={() => setPreset('pme')}
									className="px-4 py-2 rounded-lg bg-aura-surface hover:bg-aura-accent hover:text-aura-bg transition-colors text-xs font-medium border border-transparent hover:border-aura-accent"
								>
									PME (50 pers)
								</button>
							</div>
						</div>
					</RevealOnScroll>

					{/* Calculator */}
					<RevealOnScroll className="lg:col-span-8" delay={200}>
						<div className="bg-aura-card border border-aura-surface p-8 md:p-12 rounded-[40px] shadow-2xl backdrop-blur-sm">
							<div className="grid md:grid-cols-2 gap-x-12 gap-y-10 mb-12">
								<div className="space-y-4">
									<div className="flex justify-between items-baseline gap-2">
										<label htmlFor="employees-slider" className="text-sm font-medium text-aura-muted">
											Effectif concerné
										</label>
										<span className="text-2xl font-serif text-white shrink-0">{employees}</span>
									</div>
									<div
										className="slider-wrapper"
										style={{ ['--progress' as string]: `${((employees - 1) / 99) * 100}%` }}
									>
										<input
											id="employees-slider"
											type="range"
											value={employees}
											onChange={(e) => setEmployees(Number(e.target.value))}
											min={1}
											max={100}
											step={1}
											className="w-full"
											aria-label="Effectif concerné"
										/>
									</div>
								</div>

								<div className="space-y-4">
									<div className="flex justify-between items-baseline gap-2">
										<label htmlFor="salary-slider" className="text-sm font-medium text-aura-muted">
											Salaire moyen chargé /mois
										</label>
										<span className="text-2xl font-serif text-white shrink-0">{salary} €</span>
									</div>
									<div
										className="slider-wrapper"
										style={{ ['--progress' as string]: `${((salary - 2000) / 8000) * 100}%` }}
									>
										<input
											id="salary-slider"
											type="range"
											value={salary}
											onChange={(e) => setSalary(Number(e.target.value))}
											min={2000}
											max={10000}
											step={100}
											className="w-full"
											aria-label="Salaire moyen chargé par mois"
										/>
									</div>
								</div>

								<div className="space-y-4 md:col-span-2">
									<div className="flex justify-between items-baseline gap-3">
										<label htmlFor="hours-slider" className="text-sm font-medium text-aura-muted">
											<span className="hidden md:inline">Heures automatisables /semaine /pers</span>
											<span className="md:hidden">Heures auto. /sem. /pers</span>
										</label>
										<span className="text-2xl font-serif text-white shrink-0">{hours} h</span>
									</div>
									<div
										className="slider-wrapper"
										style={{ ['--progress' as string]: `${((hours - 1) / 19) * 100}%` }}
									>
										<input
											id="hours-slider"
											type="range"
											value={hours}
											onChange={(e) => setHours(Number(e.target.value))}
											min={1}
											max={20}
											step={0.5}
											className="w-full"
											aria-label="Heures automatisables par semaine par personne"
										/>
									</div>
									<p className="text-xs text-aura-muted mt-1">
										Saisie, reporting, tri d&apos;emails, recherche documentaire...
									</p>
								</div>
							</div>

							{/* Results */}
							<div className="bg-[#0A110F] rounded-3xl -mx-8 md:mx-0 -mb-8 md:mb-0 p-6 md:p-8 border-t md:border border-aura-surface/50 space-y-6 md:space-y-0 md:grid md:grid-cols-2 md:gap-8 md:items-center relative overflow-hidden rounded-b-[40px] md:rounded-b-3xl">
								<div className="absolute top-0 right-0 w-32 h-32 bg-aura-accent/10 blur-[50px] rounded-full pointer-events-none" />

								<div className="pb-6 border-b border-aura-surface/50 md:border-b-0 md:pb-0 text-center md:text-left">
									<p className="text-sm md:text-xs text-aura-muted uppercase tracking-widest mb-3">
										Gain Annuel Estimé
									</p>
									<div className="text-5xl md:text-6xl font-serif text-transparent bg-clip-text bg-gradient-to-r from-white to-aura-accent">
										{formatCurrency(annualSaving)}
									</div>
								</div>

								<div className="text-center md:text-right space-y-4">
									<div className="inline-block bg-aura-surface/50 px-6 py-4 rounded-xl border border-aura-surface">
										<span className="block text-3xl md:text-2xl font-bold text-white">
											{formatNumber(annualHours)} h
										</span>
										<span className="text-sm md:text-xs text-aura-muted">regagnées / an</span>
									</div>
									<p className="text-base md:text-xs text-aura-accent italic">
										Soit l&apos;équivalent de{' '}
										<span className="font-bold text-white">{fullTimeEquivalent}</span> ETP
										&quot;gagnés&quot;.
									</p>
								</div>
							</div>
						</div>
					</RevealOnScroll>
				</div>
			</div>
		</section>
	);
}

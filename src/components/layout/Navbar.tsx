'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useLenis } from '@/components/animation/SmoothScrollProvider';
import { cn } from '@/lib/utils/cn';

const NAV_LINKS = [
	{ anchor: '#expertise', label: 'Expertise' },
	{ anchor: '#simulator', label: 'Calculateur ROI' },
	{ anchor: '#projects', label: 'Projets' },
	{ anchor: '#skills', label: 'Compétences' },
	{ anchor: '#faq', label: 'FAQ' }
];

export function Navbar() {
	const pathname = usePathname();
	const { scrollTo } = useLenis();

	const [scrolled, setScrolled] = useState(false);
	const [hidden, setHidden] = useState(false);
	const [menuOpen, setMenuOpen] = useState(false);

	useEffect(() => {
		let lastScrollY = 0;
		const handleScroll = () => {
			const y = window.scrollY;
			setScrolled(y > 50);
			if (window.innerWidth < 1024) {
				if (y > lastScrollY && y > 100) {
					setHidden(true);
					setMenuOpen(false);
				} else {
					setHidden(false);
				}
			} else {
				setHidden(false);
			}
			lastScrollY = y;
		};
		window.addEventListener('scroll', handleScroll, { passive: true });
		return () => window.removeEventListener('scroll', handleScroll);
	}, []);

	useEffect(() => {
		document.body.style.overflow = menuOpen ? 'hidden' : '';
		return () => {
			document.body.style.overflow = '';
		};
	}, [menuOpen]);

	function handleAnchor(e: React.MouseEvent, anchor: string) {
		setMenuOpen(false);
		if (pathname === '/') {
			e.preventDefault();
			scrollTo(anchor, { offset: -80 });
			history.replaceState(null, '', `/${anchor}`);
		}
		// otherwise let the Link navigate to /#anchor
	}

	function handleLogo(e: React.MouseEvent) {
		if (pathname === '/') {
			e.preventDefault();
			scrollTo(0);
			history.replaceState(null, '', '/');
		}
	}

	const linkHref = (anchor: string) => (pathname === '/' ? anchor : `/${anchor}`);

	return (
		<>
			<nav
				id="navbar"
				className={cn(
					'fixed top-0 left-0 right-0 w-full z-50 transition-all duration-500 px-6 md:px-12',
					!scrolled ? 'pt-4 md:pt-8' : 'py-4',
					hidden && '-translate-y-full'
				)}
			>
				<div className="max-w-7xl mx-auto flex justify-between items-center bg-aura-bg/80 backdrop-blur-md rounded-full px-4 md:px-6 py-2.5 md:py-3 border border-aura-surface/50">
					<Link
						href="/"
						onClick={handleLogo}
						className="text-lg md:text-xl font-serif font-semibold tracking-tight text-white flex items-center gap-2 md:gap-3 hover:opacity-80 transition-opacity whitespace-nowrap"
					>
						<Image
							src="/logo.svg"
							alt="Eliott Bouquerel"
							className="h-4 md:h-6 w-auto object-contain"
							width={41}
							height={24}
							priority
						/>
						<span className="hidden md:inline">
							<span className="font-serif italic">Eliott</span>{' '}
							<span className="italic-accent">BOUQUEREL</span>
						</span>
					</Link>

					<div className="hidden lg:flex items-center space-x-6 text-sm font-medium text-aura-muted">
						{NAV_LINKS.map((link) => (
							<a
								key={link.anchor}
								href={linkHref(link.anchor)}
								onClick={(e) => handleAnchor(e, link.anchor)}
								className="hover:text-white transition-colors px-3 py-1.5 rounded-full hover:bg-aura-surface/30"
							>
								{link.label}
							</a>
						))}
					</div>

					<div className="flex items-center gap-3">
						<Link
							href="/rendez-vous"
							className="bg-aura-accent text-aura-bg px-4 md:px-6 py-2 rounded-full font-semibold text-xs md:text-sm hover:bg-white transition-colors whitespace-nowrap"
						>
							Prendre RDV
						</Link>

						<button
							className="lg:hidden flex flex-col justify-center items-center w-8 h-8 gap-[5px]"
							onClick={() => setMenuOpen((v) => !v)}
							aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
							aria-expanded={menuOpen}
						>
							<span
								className={cn(
									'block w-5 h-[2px] bg-white rounded-full transition-all duration-300',
									menuOpen && 'rotate-45 translate-y-[7px]'
								)}
							/>
							<span
								className={cn(
									'block w-5 h-[2px] bg-white rounded-full transition-all duration-300',
									menuOpen && 'opacity-0'
								)}
							/>
							<span
								className={cn(
									'block w-5 h-[2px] bg-white rounded-full transition-all duration-300',
									menuOpen && '-rotate-45 -translate-y-[7px]'
								)}
							/>
						</button>
					</div>
				</div>
			</nav>

			{menuOpen && (
				<div className="fixed inset-0 z-40 bg-aura-bg/95 backdrop-blur-xl flex flex-col items-center justify-center gap-8 lg:hidden">
					{NAV_LINKS.map((link) => (
						<a
							key={link.anchor}
							href={linkHref(link.anchor)}
							onClick={(e) => handleAnchor(e, link.anchor)}
							className="text-2xl font-serif text-aura-muted hover:text-white transition-colors"
						>
							{link.label}
						</a>
					))}
				</div>
			)}
		</>
	);
}

import { create } from 'zustand';

export interface FooterButton {
	label: string;
	href: string;
	icon?: string; // Material Symbols icon name
}

export interface FooterConfig {
	title?: string;
	titleAccent?: string;
	description?: string;
	primaryButton?: FooterButton;
	secondaryButton?: FooterButton;
}

export const defaultFooterConfig: FooterConfig = {
	title: 'Votre transformation',
	titleAccent: 'ici',
	description:
		"Mon accompagnement est conçu pour garantir un niveau d'excellence absolu dans chaque projet. Vérifions ensemble si nous sommes faits pour collaborer.",
	primaryButton: {
		label: 'Réserver un audit gratuit',
		href: '/rendez-vous'
	},
	secondaryButton: {
		label: 'Me contacter',
		href: '/rendez-vous#contact'
	}
};

interface FooterStore {
	config: FooterConfig;
	configure: (config: FooterConfig) => void;
	reset: () => void;
}

export const useFooterStore = create<FooterStore>((set) => ({
	config: defaultFooterConfig,
	configure: (config) => set({ config: { ...defaultFooterConfig, ...config } }),
	reset: () => set({ config: defaultFooterConfig })
}));

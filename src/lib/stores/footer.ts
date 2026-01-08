import { writable } from 'svelte/store';

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

// Default values
const defaultConfig: FooterConfig = {
	title: 'Votre transformation',
	titleAccent: 'ici',
	description:
		"Mon accompagnement est conçu pour garantir un niveau d'excellence absolu dans chaque projet. Vérifions ensemble si nous sommes faits pour collaborer.",
	primaryButton: {
		label: 'Réserver un audit gratuit',
		href: '/rendez-vous'
	},
	secondaryButton: {
		label: 'Me contacter par email',
		href: 'mailto:eliott.bouquerel@gmail.com'
	}
};

function createFooterStore() {
	const { subscribe, set } = writable<FooterConfig>(defaultConfig);

	return {
		subscribe,
		configure: (config: FooterConfig) => set({ ...defaultConfig, ...config }),
		reset: () => set(defaultConfig)
	};
}

export const footerConfig = createFooterStore();

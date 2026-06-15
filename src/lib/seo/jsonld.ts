import type { Project } from '@/lib/data/projects';

const SITE_URL = 'https://eliottbouquerel.fr';

export const personJsonLd = {
	'@context': 'https://schema.org',
	'@type': 'Person',
	name: 'Eliott Bouquerel',
	jobTitle: 'Developpeur & Manager de Projet Web Freelance',
	url: SITE_URL,
	image: `${SITE_URL}/my-pic.png`,
	description:
		'Automatisez ce qui ralentit, accelerez ce qui rapporte. Solutions web et IA sur mesure pour PME et startups. Architecture moderne, agents autonomes, audit de productivite.',
	address: {
		'@type': 'PostalAddress',
		addressLocality: 'Caen',
		addressRegion: 'Normandie',
		addressCountry: 'FR'
	},
	alumniOf: [
		{ '@type': 'EducationalOrganization', name: 'Master Developpeur & Manager de Projet Web' },
		{ '@type': 'EducationalOrganization', name: "Bachelor Metiers du Multimedia et d'Internet" }
	],
	knowsAbout: [
		'Architecture Web',
		'SvelteKit',
		'Next.js',
		'React',
		'TypeScript',
		'TailwindCSS',
		'PostgreSQL',
		'Docker',
		'Intelligence Artificielle',
		'Automatisation',
		'N8N',
		'E-commerce'
	],
	sameAs: ['https://github.com/Eliott-B']
};

export const websiteJsonLd = {
	'@context': 'https://schema.org',
	'@type': 'WebSite',
	name: 'Eliott Bouquerel - Automatisation Web & IA',
	url: SITE_URL,
	description:
		'Automatisez ce qui ralentit, accelerez ce qui rapporte. Solutions web et IA sur mesure pour PME et startups.',
	inLanguage: 'fr',
	author: { '@type': 'Person', name: 'Eliott Bouquerel' }
};

export const professionalServiceJsonLd = {
	'@context': 'https://schema.org',
	'@type': 'ProfessionalService',
	name: 'Eliott Bouquerel - Automatisation Web & IA',
	image: `${SITE_URL}/my-pic.png`,
	url: SITE_URL,
	address: {
		'@type': 'PostalAddress',
		addressLocality: 'Caen',
		addressRegion: 'Normandie',
		addressCountry: 'FR'
	},
	geo: { '@type': 'GeoCoordinates', latitude: 49.1829, longitude: -0.3707 },
	openingHoursSpecification: {
		'@type': 'OpeningHoursSpecification',
		dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
		opens: '09:00',
		closes: '18:00'
	},
	hasOfferCatalog: {
		'@type': 'OfferCatalog',
		name: 'Services Freelance Web & IA',
		itemListElement: [
			{
				'@type': 'Offer',
				itemOffered: {
					'@type': 'Service',
					name: 'Architecture & Refonte Web',
					description:
						"Modernisation d'infrastructures web legacy vers des architectures modernes, performantes et scalables. Migration vers des architectures headless."
				}
			},
			{
				'@type': 'Offer',
				itemOffered: {
					'@type': 'Service',
					name: 'Integration IA & Agents Autonomes',
					description:
						"Deploiement d'agents IA personnalises pour automatiser les taches repetitives : support client, analyse, redaction. Utilisation de N8N, Claude, Gemini."
				}
			},
			{
				'@type': 'Offer',
				itemOffered: {
					'@type': 'Service',
					name: 'Audit de Productivite',
					description:
						"Analyse approfondie des processus metier pour identifier les opportunites d'automatisation. Livraison d'une roadmap ROI chiffree."
				}
			}
		]
	},
	sameAs: ['https://github.com/Eliott-B']
};

export const faqJsonLd = {
	'@context': 'https://schema.org',
	'@type': 'FAQPage',
	mainEntity: [
		{
			'@type': 'Question',
			name: 'Quels types de projets acceptez-vous ?',
			acceptedAnswer: {
				'@type': 'Answer',
				text: "Je travaille principalement sur des projets d'architecture web complexe, des refontes d'applications existantes, et des integrations IA pour automatiser les processus metier des PME et startups. Mon expertise couvre le frontend (SvelteKit, Next.js, React), le backend (Node.js, PostgreSQL) et l'infrastructure (Docker, CI/CD)."
			}
		},
		{
			'@type': 'Question',
			name: 'Quelle est votre approche pour un nouveau projet ?',
			acceptedAnswer: {
				'@type': 'Answer',
				text: "Je commence toujours par un audit de productivite pour comprendre vos processus actuels, identifier les opportunites d'automatisation et etablir une roadmap ROI chiffree. Ensuite, je concois l'architecture technique avant d'ecrire la moindre ligne de code."
			}
		},
		{
			'@type': 'Question',
			name: "Comment l'IA peut-elle aider mon entreprise concretement ?",
			acceptedAnswer: {
				'@type': 'Answer',
				text: "L'IA peut automatiser les taches repetitives qui consomment le temps de vos equipes : tri et reponse aux emails, generation de rapports, analyse de donnees, support client de premier niveau, redaction de contenus. En moyenne, mes clients recuperent entre 5 et 15 heures par semaine par personne concernee."
			}
		},
		{
			'@type': 'Question',
			name: 'Travaillez-vous en remote ou sur site ?',
			acceptedAnswer: {
				'@type': 'Answer',
				text: 'Base en Normandie (Caen), je travaille principalement en remote avec des outils collaboratifs modernes (Discord, Notion, visio). Je peux me deplacer en Normandie et en region parisienne pour les reunions strategiques ou les ateliers de cadrage.'
			}
		},
		{
			'@type': 'Question',
			name: 'Quel est le delai pour demarrer un projet ?',
			acceptedAnswer: {
				'@type': 'Answer',
				text: "Apres un premier echange de 30 minutes (gratuit), j'envoie une proposition sous 48h. Le demarrage effectif depend de ma disponibilite actuelle. Prenez rendez-vous sur le calendrier pour connaitre les creneaux disponibles."
			}
		}
	]
};

export function breadcrumbJsonLd(project: Project) {
	return {
		'@context': 'https://schema.org',
		'@type': 'BreadcrumbList',
		itemListElement: [
			{ '@type': 'ListItem', position: 1, name: 'Accueil', item: SITE_URL },
			{
				'@type': 'ListItem',
				position: 2,
				name: project.title,
				item: `${SITE_URL}/projets/${project.slug}`
			}
		]
	};
}

/** Renders a JSON-LD <script> tag payload as a string for dangerouslySetInnerHTML. */
export function jsonLdScript(data: unknown) {
	return { __html: JSON.stringify(data) };
}

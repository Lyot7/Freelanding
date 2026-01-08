export interface Project {
    slug: string;
    title: string;
    subtitle: string;
    tags: string[];
    thumbnail: string;
    description: string;
    // Case Study Details
    heroImage: string;
    context: string;
    challenge: string;
    solution: string;
    results: {
        label: string;
        value: string;
        icon: string;
    }[];
    stack: {
        name: string;
        icon: string; // URL or icon name
    }[];
    testimonial?: {
        quote: string;
        author: string;
        role: string;
    };
}

export const projects: Project[] = [
    {
        slug: 'meca-services',
        title: 'MECA SERVICES',
        subtitle: 'Infrastructure E-commerce & Intégration ERP',
        tags: ['Infrastructure', 'Refonte Totale', 'E-commerce'],
        thumbnail: '/mockup-mecaservices.png',
        heroImage: '/mockup-mecaservices.png', // Ideally a wider hero shot
        description:
            "Migration d'une boutique e-commerce vieillissante vers une solution moderne et évolutive. Transformation complète de l'expérience client et des outils de gestion.",
        context:
            "MECA SERVICES, acteur majeur dans la distribution de pièces détachées, disposait d'un site e-commerce historique difficile à maintenir et non connecté à ses outils de gestion de stocks.",
        challenge:
            "Le défi principal était la **synchronisation temps réel** avec l'ERP existant et la gestion d'un catalogue de plusieurs milliers de références, tout en améliorant drastiquement la vitesse de chargement pour le SEO.",
        solution:
            "J'ai conçu une architecture **Headless** séparant le frontend (SvelteKit) du backend. Mise en place d'un pipeline de synchronisation automatisé pour les stocks. Refonte totale de l'UX pour simplifier le tunnel de commande B2B.",
        results: [
            { label: 'Temps de gestion', value: '-80%', icon: 'speed' },
            { label: 'Satisfaction client', value: 'x3', icon: 'thumb_up' },
            { label: 'Vitesse de chargement', value: '0.8s', icon: 'timer' }
        ],
        stack: [
            { name: 'SvelteKit', icon: 'https://cdn.simpleicons.org/svelte/white' },
            { name: 'Node.js', icon: 'https://cdn.simpleicons.org/nodedotjs/white' },
            { name: 'PostgreSQL', icon: 'https://cdn.simpleicons.org/postgresql/white' },
            { name: 'Docker', icon: 'https://cdn.simpleicons.org/docker/white' }
        ],
        testimonial: {
            quote:
                "Eliott a repensé notre infrastructure e-commerce et nos outils internes. En seulement un an d'alternance, il a transformé notre dette technique en une infrastructure scalable et performante, posant les bases d'une croissance durable.",
            author: 'Jérôme DAVY',
            role: 'PDG de MECA SERVICES'
        }
    },
    {
        slug: 'kpsull',
        title: 'KPSULL',
        subtitle: 'Marketplace Mode & Créateurs',
        tags: ['Marketplace', 'Cofondateur', 'Start-up'],
        thumbnail: '/mockup-kpsull.png',
        heroImage: '/mockup-kpsull.png',
        description:
            "Création d'une marketplace dédiée aux créateurs de mode. Plateforme complète permettant aux créateurs de gérer leurs collections, leurs ventes et leur visibilité.",
        context:
            "Le marché de la mode indépendante manque d'outils centralisés. KPSULL visait à offrir une vitrine professionnelle aux jeunes créateurs sans les coûts exorbitants des agences.",
        challenge:
            "Développer une plateforme **multi-vendeurs** sécurisée (paiements Split Stripe), avec un dashboard de gestion intuitif pour des utilisateurs non tech.",
        solution:
            "J'ai développé la plateforme de A à Z. Intégration profonde de **Stripe Connect** pour la répartition financière. Architecture scalable pour supporter des pics de trafic lors des 'drops' de collections.",
        results: [
            { label: 'Autonomie Créateurs', value: '100%', icon: 'verified_user' },
            { label: 'Frais cachés', value: '0€', icon: 'payments' },
            { label: 'Temps de mise en ligne', value: '< 5min', icon: 'rocket_launch' }
        ],
        stack: [
            { name: 'Next.js', icon: 'https://cdn.simpleicons.org/nextdotjs/white' },
            { name: 'Stripe', icon: 'https://cdn.simpleicons.org/stripe/white' },
            { name: 'Supabase', icon: 'https://cdn.simpleicons.org/supabase/white' }
        ]
    }
];

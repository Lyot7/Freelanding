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
        slug: 'kpsull',
        title: 'KPSULL',
        subtitle: 'Marketplace Mode & Créateurs',
        tags: ['Cofondateur', 'Marketplace'],
        thumbnail: '/mockup-kpsull.png',
        heroImage: '/mockup-kpsull.png',
        description:
            "Marketplace dédiée aux créateurs de mode indépendants. Parce qu'ils perdent 50% de leur temps à vendre plutôt qu'à créer, KPSULL centralise vitrine, paiements et gestion pour qu'ils se concentrent sur leur métier.",
        context:
            "Les créateurs indépendants passent la moitié de leur temps sur la vente et la logistique au lieu de créer. KPSULL visait à leur redonner ce temps en centralisant la vitrine, les paiements et la gestion sur une seule plateforme.",
        challenge:
            "Développer une plateforme **multi-vendeurs** sécurisée (paiements Split Stripe), avec un dashboard de gestion intuitif pour des utilisateurs non tech.",
        solution:
            "J'ai développé la plateforme de A à Z. Intégration profonde de **Stripe Connect** pour la répartition financière. Architecture scalable pour supporter des pics de trafic lors des 'drops' de collections.",
        results: [
            { label: 'Temps créatif récupéré', value: '+50%', icon: 'brush' },
            { label: 'Taux de conversion', value: 'x3', icon: 'trending_up' }
        ],
        stack: [
            { name: 'Next.js', icon: 'https://cdn.simpleicons.org/nextdotjs/white' },
            { name: 'PostgreSQL', icon: 'https://cdn.simpleicons.org/postgresql/white' },
            { name: 'Tailwind', icon: 'https://cdn.simpleicons.org/tailwindcss/white' },
            { name: 'Stripe', icon: 'https://cdn.simpleicons.org/stripe/white' }
        ]
    }
];

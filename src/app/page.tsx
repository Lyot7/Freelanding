import { Hero } from '@/components/sections/Hero';
import { Expertise } from '@/components/sections/Expertise';
import { RoiSimulator } from '@/components/sections/RoiSimulator';
import { Projects } from '@/components/sections/Projects';
import { Skills } from '@/components/sections/Skills';
import { Faq } from '@/components/sections/Faq';
import { faqJsonLd, jsonLdScript } from '@/lib/seo/jsonld';

export default function HomePage() {
	return (
		<>
			<script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(faqJsonLd)} />
			<Hero />
			<Expertise />
			<RoiSimulator />
			<Projects />
			<Skills />
			<Faq />
		</>
	);
}

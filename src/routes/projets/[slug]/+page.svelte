<script lang="ts">
	import { page } from '$app/state';
	import { projects } from '$lib/data/projects';
	import { error } from '@sveltejs/kit';
	import Button from '$lib/components/Button.svelte';
	import SectionTitle from '$lib/components/SectionTitle.svelte';
	import { reveal } from '$lib/actions/reveal';

	// Retrieve project slug from URL
    // Accessing page state in Svelte 5 is different, usually $page.params.slug
    // Assuming SvelteKit 2 context
    import { page as pageStore } from '$app/stores';
    
    // We can use $pageStore.params.slug
    // But since this is Svelte 5 runes mode, let's stick to standard kit load or just derived.
    // For simplicity in this edit, i'll use the store. 
    
    let { data } = $props(); 
    // Ideally we should have a +page.server.ts or +page.ts to load data, but we can find it here for static export
    // Let's implement basic finding logic in script for now or expect data passed from load.
    // Actually, let's just use the store for client side find, or better: 
    // Implementing a proper load function in +page.ts is cleaner, but let's do it inline for speed if static adapter allows.
    
    // Let's rely on +page.ts to pass the 'project' object to avoid logic here.
    // I will write the +page.ts next.
    let project = $derived(data.project);

</script>

<svelte:head>
	<title>{project.title} - Case Study | Eliott B.</title>
	<meta name="description" content="Découvrez comment {project.title} a transformé son activité : {project.description}" />
	<link rel="canonical" href="https://eliott-bouquerel.fr/projets/{project.slug}" />

    <!-- OG Tags for this specific project -->
    <meta property="og:title" content="{project.title} - Case Study | Eliott B." />
    <meta property="og:description" content="{project.description}" />
    <meta property="og:image" content="https://eliott-bouquerel.fr{project.heroImage}" />
	<meta property="og:url" content="https://eliott-bouquerel.fr/projets/{project.slug}" />

	<!-- Twitter Tags -->
	<meta name="twitter:title" content="{project.title} - Case Study | Eliott B." />
	<meta name="twitter:description" content="{project.description}" />
	<meta name="twitter:image" content="https://eliott-bouquerel.fr{project.heroImage}" />

	<!-- Structured Data (JSON-LD) -->
	<script type="application/ld+json">
		{
			"@context": "https://schema.org",
			"@type": "BreadcrumbList",
			"itemListElement": [
				{
					"@type": "ListItem",
					"position": 1,
					"name": "Accueil",
					"item": "https://eliott-bouquerel.fr"
				},
				{
					"@type": "ListItem",
					"position": 2,
					"name": "{project.title}",
					"item": "https://eliott-bouquerel.fr/projets/{project.slug}"
				}
			]
		}
	</script>
</svelte:head>

<div class="pt-32 pb-20">
    <!-- Hero Project -->
    <section class="max-w-7xl mx-auto px-6 mb-20">
        <div class="mb-8">
            <a href="/#projects" class="text-aura-muted hover:text-aura-accent text-sm flex items-center gap-2 mb-6 transition-colors inline-block">
                <span class="material-symbols-outlined text-sm">arrow_back</span>
                Retour aux projets
            </a>
            <div class="flex flex-wrap gap-3 mb-6 reveal-on-scroll" use:reveal>
                {#each project.tags as tag}
                    <span class="px-3 py-1 rounded-full border border-aura-surface text-xs text-aura-accent uppercase tracking-wider">
                        {tag}
                    </span>
                {/each}
            </div>
            <h1 class="text-5xl md:text-7xl font-serif mb-6 reveal-on-scroll text-white" use:reveal={{ delay: 100 }}>
                {project.title}
            </h1>
            <p class="text-xl text-aura-muted max-w-2xl reveal-on-scroll" use:reveal={{ delay: 200 }}>
                {project.subtitle}
            </p>
        </div>

        <div class="aspect-video w-full rounded-[32px] overflow-hidden border border-aura-surface reveal-on-scroll" use:reveal={{ delay: 300 }}>
            <img src={project.heroImage} alt={project.title} class="w-full h-full object-cover" />
        </div>
    </section>

    <!-- Content Grid -->
    <section class="max-w-7xl mx-auto px-6 grid md:grid-cols-12 gap-12">
        
        <!-- Main Content -->
        <div class="md:col-span-12 lg:col-span-8 space-y-16">
            
            <!-- Context & Challenge -->
            <div class="reveal-on-scroll" use:reveal>
                <h2 class="text-3xl font-serif mb-6 text-white">Le Défi</h2>
                <div class="prose prose-invert prose-lg text-aura-muted">
                    <p class="mb-6">{project.context}</p>
                    <p class="border-l-4 border-aura-accent pl-6 italic text-white/90">
                        {project.challenge}
                    </p>
                </div>
            </div>

            <!-- Solution -->
            <div class="reveal-on-scroll" use:reveal>
                <h2 class="text-3xl font-serif mb-6 text-white">La Solution</h2>
                <p class="text-lg text-aura-muted leading-relaxed">
                    {project.solution}
                </p>
            </div>

            <!-- Stack -->
            <div class="reveal-on-scroll" use:reveal>
                <h3 class="text-xl font-serif mb-4 text-white">Technologies Clés</h3>
                <div class="flex flex-wrap gap-4">
                    {#each project.stack as tech}
                        <div class="flex items-center gap-3 px-4 py-3 bg-aura-card rounded-xl border border-aura-surface">
                            <img src={tech.icon} alt={tech.name} class="w-6 h-6" />
                            <span class="font-medium text-sm">{tech.name}</span>
                        </div>
                    {/each}
                </div>
            </div>

        </div>

        <!-- Sidebar / KPI -->
        <div class="md:col-span-12 lg:col-span-4 rounded-[32px]">
            <div class="sticky top-32 space-y-8">
                <div class="bg-aura-card p-8 rounded-[32px] border border-aura-surface reveal-on-scroll" use:reveal={{ delay: 200 }}>
                    <h3 class="text-xl font-serif mb-8 text-white flex items-center gap-2">
                        <span class="material-symbols-outlined text-aura-accent">monitoring</span>
                        Impact Business
                    </h3>
                    
                    <div class="space-y-8">
                        {#each project.results as res}
                            <div>
                                <div class="flex items-center gap-2 text-aura-muted text-sm mb-1">
                                    <span class="material-symbols-outlined text-sm">{res.icon}</span>
                                    {res.label}
                                </div>
                                <div class="text-3xl font-serif text-white">{res.value}</div>
                            </div>
                        {/each}
                    </div>

                    <div class="mt-10 pt-8 border-t border-aura-surface">
                        <Button href="/rendez-vous" variant="primary" fullWidth>
                            Lancer un projet similaire
                        </Button>
                    </div>
                </div>
                
                {#if project.testimonial}
                    <div class="bg-aura-accent/5 p-8 rounded-[32px] border border-aura-accent/20 reveal-on-scroll" use:reveal={{ delay: 400 }}>
                        <span class="material-symbols-outlined text-4xl text-aura-accent mb-4 opacity-50">format_quote</span>
                        <p class="text-lg italic text-white mb-6">"{project.testimonial.quote}"</p>
                        <div>
                            <div class="font-bold text-white">{project.testimonial.author}</div>
                            <div class="text-sm text-aura-accent">{project.testimonial.role}</div>
                        </div>
                    </div>
                {/if}
            </div>
        </div>

    </section>
</div>

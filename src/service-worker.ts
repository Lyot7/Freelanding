/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />
/// <reference types="@sveltejs/kit" />

import { build, files, version } from '$service-worker';

const sw = self as unknown as ServiceWorkerGlobalScope;

// Cache unique par déploiement
const CACHE_NAME = `freelanding-${version}`;

// Assets à précacher (bundles JS/CSS + fichiers statiques)
const PRECACHE_ASSETS = [...build, ...files];

// Assets critiques pour l'expérience offline-first
const CRITICAL_ASSETS = [
	'/fonts/instrument-sans/instrument-sans-variable.woff2',
	'/fonts/playfair-display/playfair-display-variable.woff2',
	'/fonts/material-symbols/material-symbols-subset.woff2',
	'/logo.svg'
];

// Install: Précacher tous les assets critiques
sw.addEventListener('install', (event) => {
	event.waitUntil(
		caches.open(CACHE_NAME).then((cache) => {
			return Promise.all([cache.addAll(CRITICAL_ASSETS), cache.addAll(PRECACHE_ASSETS)]);
		})
	);
	// Activer immédiatement sans attendre
	sw.skipWaiting();
});

// Activate: Nettoyer les anciens caches
sw.addEventListener('activate', (event) => {
	event.waitUntil(
		caches.keys().then((keys) => {
			return Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)));
		})
	);
	// Prendre le contrôle de toutes les pages immédiatement
	sw.clients.claim();
});

// Fetch: Appliquer les stratégies de cache
sw.addEventListener('fetch', (event) => {
	const { request } = event;
	const url = new URL(request.url);

	// Ignorer les requêtes non-GET
	if (request.method !== 'GET') return;

	// Ignorer les protocoles non-HTTP
	if (!url.protocol.startsWith('http')) return;

	// Sélection de la stratégie selon le type d'asset
	if (isCacheFirstAsset(url)) {
		event.respondWith(cacheFirst(request));
	} else if (isStaleWhileRevalidate(url)) {
		event.respondWith(staleWhileRevalidate(request));
	} else {
		event.respondWith(networkFirst(request));
	}
});

/**
 * Détermine si l'asset doit utiliser Cache-First
 * Pour les assets immutables/versionnés
 */
function isCacheFirstAsset(url: URL): boolean {
	const path = url.pathname;
	return (
		// Bundles Vite avec hash
		path.includes('/_app/immutable/') ||
		// Fonts
		path.startsWith('/fonts/') ||
		// Assets statiques
		path.startsWith('/avatars/') ||
		path.startsWith('/diagrams/') ||
		path.startsWith('/favicon/') ||
		path === '/logo.svg'
	);
}

/**
 * Détermine si l'asset doit utiliser Stale-While-Revalidate
 * Pour le contenu semi-statique (CDN externes)
 */
function isStaleWhileRevalidate(url: URL): boolean {
	// Icônes SimpleIcons depuis CDN
	return url.hostname === 'cdn.simpleicons.org';
}

/**
 * Stratégie Cache-First
 * Retourne le cache si disponible, sinon fetch et cache
 */
async function cacheFirst(request: Request): Promise<Response> {
	const cache = await caches.open(CACHE_NAME);
	const cached = await cache.match(request);

	if (cached) {
		return cached;
	}

	try {
		const response = await fetch(request);
		if (response.ok) {
			cache.put(request, response.clone());
		}
		return response;
	} catch {
		return new Response('Offline', { status: 503 });
	}
}

/**
 * Stratégie Stale-While-Revalidate
 * Retourne le cache immédiatement, met à jour en arrière-plan
 */
async function staleWhileRevalidate(request: Request): Promise<Response> {
	const cache = await caches.open(CACHE_NAME);
	const cached = await cache.match(request);

	const fetchPromise = fetch(request).then((response) => {
		if (response.ok) {
			cache.put(request, response.clone());
		}
		return response;
	});

	return cached || fetchPromise;
}

/**
 * Stratégie Network-First
 * Tente le réseau d'abord, fallback sur cache
 */
async function networkFirst(request: Request): Promise<Response> {
	const cache = await caches.open(CACHE_NAME);

	try {
		const response = await fetch(request);
		// Cacher uniquement les réponses de notre domaine
		if (response.ok && request.url.startsWith(sw.location.origin)) {
			cache.put(request, response.clone());
		}
		return response;
	} catch {
		const cached = await cache.match(request);
		if (cached) {
			return cached;
		}

		// Fallback offline pour les navigations
		if (request.mode === 'navigate') {
			const offlinePage = await cache.match('/');
			if (offlinePage) return offlinePage;
		}

		return new Response('Offline', { status: 503 });
	}
}

import { json } from '@sveltejs/kit';
import { Resend } from 'resend';
import { RESEND_API_KEY, CONTACT_EMAIL } from '$env/static/private';
import type { RequestHandler } from './$types';

const resend = new Resend(RESEND_API_KEY);

interface ContactRequest {
	name: string;
	email: string;
	message: string;
}

function isValidEmail(email: string): boolean {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email);
}

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = (await request.json()) as ContactRequest;
		const { name, email, message } = body;

		// Validation
		if (!name || name.trim().length < 2) {
			return json({ error: 'Le nom doit contenir au moins 2 caractères' }, { status: 400 });
		}

		if (!email || !isValidEmail(email)) {
			return json({ error: 'Email invalide' }, { status: 400 });
		}

		if (!message || message.trim().length < 10) {
			return json({ error: 'Le message doit contenir au moins 10 caractères' }, { status: 400 });
		}

		// Envoi via Resend
		const { error } = await resend.emails.send({
			from: 'Formulaire Contact <onboarding@resend.dev>',
			to: CONTACT_EMAIL,
			replyTo: email,
			subject: `Nouveau message de ${name.trim()}`,
			text: `Nom: ${name.trim()}\nEmail: ${email}\n\nMessage:\n${message.trim()}`
		});

		if (error) {
			console.error('Resend error:', error);
			return json({ error: "Erreur lors de l'envoi du message" }, { status: 500 });
		}

		return json({ success: true });
	} catch {
		return json({ error: 'Requête invalide' }, { status: 400 });
	}
};

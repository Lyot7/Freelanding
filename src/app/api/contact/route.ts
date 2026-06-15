import { NextResponse } from 'next/server';
import { Resend } from 'resend';

// Avoid running on the edge / static analysis at build time.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface ContactRequest {
	name: string;
	email: string;
	message: string;
}

function isValidEmail(email: string): boolean {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email);
}

export async function POST(request: Request) {
	try {
		const body = (await request.json()) as ContactRequest;
		const { name, email, message } = body;

		if (!name || name.trim().length < 2) {
			return NextResponse.json(
				{ error: 'Le nom doit contenir au moins 2 caractères' },
				{ status: 400 }
			);
		}
		if (!email || !isValidEmail(email)) {
			return NextResponse.json({ error: 'Email invalide' }, { status: 400 });
		}
		if (!message || message.trim().length < 10) {
			return NextResponse.json(
				{ error: 'Le message doit contenir au moins 10 caractères' },
				{ status: 400 }
			);
		}

		const resend = new Resend(process.env.RESEND_API_KEY);
		const { error } = await resend.emails.send({
			from: 'Formulaire Contact <onboarding@resend.dev>',
			to: process.env.CONTACT_EMAIL ?? '',
			replyTo: email,
			subject: `Nouveau message de ${name.trim()}`,
			text: `Nom: ${name.trim()}\nEmail: ${email}\n\nMessage:\n${message.trim()}`
		});

		if (error) {
			console.error('Resend error:', error);
			return NextResponse.json({ error: "Erreur lors de l'envoi du message" }, { status: 500 });
		}

		return NextResponse.json({ success: true });
	} catch {
		return NextResponse.json({ error: 'Requête invalide' }, { status: 400 });
	}
}

'use client';

import Link from 'next/link';
import { type ReactNode } from 'react';
import { MagneticButton } from '@/components/animation/MagneticButton';
import { cn } from '@/lib/utils/cn';

interface ButtonProps {
	href?: string;
	type?: 'submit' | 'button' | 'reset';
	variant?: 'primary' | 'secondary' | 'link';
	className?: string;
	children?: ReactNode;
	target?: string;
	onClick?: () => void;
	fullWidth?: boolean;
	magnetic?: boolean;
}

const baseClasses =
	'group transition-all duration-300 font-medium rounded-full inline-flex items-center justify-center gap-2';

const variantClasses: Record<NonNullable<ButtonProps['variant']>, string> = {
	primary:
		'bg-aura-accent text-aura-bg hover:bg-white px-8 py-4 font-bold shadow-[0_0_20px_rgba(111,240,211,0.2)] hover:shadow-[0_0_30px_rgba(111,240,211,0.4)] hover:scale-[1.02]',
	secondary: 'border border-aura-surface text-white hover:bg-aura-surface px-8 py-4',
	link: 'text-aura-muted hover:text-white text-sm tracking-wide px-2 py-1'
};

export function Button({
	href,
	type = 'button',
	variant = 'primary',
	className = '',
	children,
	target,
	onClick,
	fullWidth = false,
	magnetic = false
}: ButtonProps) {
	const classes = cn(baseClasses, variantClasses[variant], fullWidth && 'w-full', className);

	const inner = href ? (
		href.startsWith('#') || href.startsWith('http') ? (
			<a href={href} className={classes} target={target} onClick={onClick}>
				{children}
			</a>
		) : (
			<Link href={href} className={classes} target={target} onClick={onClick}>
				{children}
			</Link>
		)
	) : (
		<button type={type} className={classes} onClick={onClick}>
			{children}
		</button>
	);

	if (magnetic) {
		return <MagneticButton className={fullWidth ? 'w-full' : ''}>{inner}</MagneticButton>;
	}
	return inner;
}

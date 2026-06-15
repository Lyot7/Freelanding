import { RevealOnScroll } from '@/components/animation/RevealOnScroll';
import { cn } from '@/lib/utils/cn';

interface SectionTitleProps {
	title: string;
	subtitle?: string; // The italic colored part
	align?: 'center' | 'left';
}

export function SectionTitle({ title, subtitle, align = 'center' }: SectionTitleProps) {
	return (
		<RevealOnScroll className={cn('mb-16', align === 'center' ? 'text-center' : 'text-left')}>
			<h2 className="text-4xl md:text-5xl font-serif mb-6">
				{title} {subtitle && <span className="italic-accent">{subtitle}</span>}
			</h2>
			<div
				className={cn(
					'w-24 h-1 bg-aura-accent rounded-full opacity-50',
					align === 'center' && 'mx-auto'
				)}
			/>
		</RevealOnScroll>
	);
}

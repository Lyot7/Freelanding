import { cn } from '@/lib/utils/cn';

interface SkeletonProps {
	width?: string;
	height?: string;
	variant?: 'text' | 'circular' | 'rectangular';
	className?: string;
}

const variantClasses = {
	text: 'rounded',
	circular: 'rounded-full',
	rectangular: 'rounded-lg'
} as const;

export function Skeleton({
	width = '100%',
	height = '1rem',
	variant = 'text',
	className = ''
}: SkeletonProps) {
	return (
		<div className={cn('skeleton', variantClasses[variant], className)} style={{ width, height }} />
	);
}

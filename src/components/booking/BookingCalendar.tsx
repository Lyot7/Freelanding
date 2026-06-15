'use client';

import { useEffect } from 'react';
import Cal, { getCalApi } from '@calcom/embed-react';

interface BookingCalendarProps {
	calLink?: string;
	namespace?: string;
}

export function BookingCalendar({
	calLink = process.env.NEXT_PUBLIC_CAL_LINK || 'eliott-bouquerel/30min',
	namespace = '30min'
}: BookingCalendarProps) {
	useEffect(() => {
		(async () => {
			const cal = await getCalApi({ namespace });
			cal('ui', {
				theme: 'dark',
				hideEventTypeDetails: false,
				layout: 'month_view'
			});
		})();
	}, [namespace]);

	return (
		<div className="calendar-container w-full min-h-[600px]">
			<Cal
				namespace={namespace}
				calLink={calLink}
				style={{ width: '100%', height: '100%', minHeight: '600px', overflow: 'scroll' }}
				config={{ layout: 'month_view', theme: 'dark' }}
			/>
		</div>
	);
}

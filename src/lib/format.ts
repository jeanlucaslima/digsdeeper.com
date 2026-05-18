export function formatDate(d: Date | undefined, opts: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: '2-digit' }): string {
	if (!d) return '—';
	return new Intl.DateTimeFormat('en-US', opts).format(d);
}

export function formatYearMonth(d: Date | undefined): string {
	if (!d) return '—';
	return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short' }).format(d);
}

export function isoDate(d: Date): string {
	return d.toISOString().slice(0, 10);
}

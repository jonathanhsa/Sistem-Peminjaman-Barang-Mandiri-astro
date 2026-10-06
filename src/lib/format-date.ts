export function formatDate(input: string | Date | null | undefined): string {
  if (!input) return '-';
  const date = typeof input === 'string' ? new Date(input) : input;
  if (isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export function formatDateTime(input: string | Date | null | undefined): string {
  if (!input) return '-';
  const date = typeof input === 'string' ? new Date(input) : input;
  if (isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function getDaysDifference(targetDate: string | Date, fromDate: Date = new Date()): number {
  const target = typeof targetDate === 'string' ? new Date(targetDate) : targetDate;
  const diffMs = target.getTime() - fromDate.getTime();
  return diffMs / (1000 * 60 * 60 * 24);
}

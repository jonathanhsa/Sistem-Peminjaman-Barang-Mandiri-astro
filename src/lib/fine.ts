export function calculateFine(
  dueDate: string | Date,
  compareDateInput: string | Date = new Date()
): { fineAmount: number; daysLate: number; isOverdue: boolean } {
  const due = typeof dueDate === 'string' ? new Date(dueDate) : dueDate;
  const compare = typeof compareDateInput === 'string' ? new Date(compareDateInput) : compareDateInput;

  const diffMs = compare.getTime() - due.getTime();
  if (diffMs <= 0) {
    return { fineAmount: 0, daysLate: 0, isOverdue: false };
  }

  // Ceil of days late
  const daysLate = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const fineAmount = Math.max(0, daysLate * 1000);

  return {
    fineAmount,
    daysLate,
    isOverdue: true,
  };
}

export function getDayOfWeek(dateString: string): string {
  /**
   * Compute the name of the day of the week for a given date string.
   *
   * @param dateString - The date in string format (e.g., '2025-04-08').
   * @returns The name of the day of the week (e.g., 'Tuesday').
   */
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    throw new Error('Invalid date format');
  }

  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return daysOfWeek[date.getDay()];
}
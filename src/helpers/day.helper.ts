export function getDayOfWeek(date: Date): string {
  const daysOfWeek = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  return daysOfWeek[date.getUTCDay()];
}

export function isReasonableWeight(kg: number, heightCm: number): boolean {
  const min = 40;
  const max = Math.max(200, heightCm * 1.5);
  return kg >= min && kg <= max;
}

export function weightWarning(kg: number, heightCm: number): string | null {
  if (kg < 40) return 'وزن واردشده بسیار کم به نظر می\u200cرسد.';
  if (kg > heightCm * 1.5) return 'وزن واردشده برای قد شما غیرمعمول است.';
  return null;
}

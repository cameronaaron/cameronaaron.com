const monthMap: Record<string, number> = {
  jan: 0,
  january: 0,
  feb: 1,
  february: 1,
  mar: 2,
  march: 2,
  apr: 3,
  april: 3,
  may: 4,
  jun: 5,
  june: 5,
  jul: 6,
  july: 6,
  aug: 7,
  august: 7,
  sep: 8,
  sept: 8,
  september: 8,
  oct: 9,
  october: 9,
  nov: 10,
  november: 10,
  dec: 11,
  december: 11,
  spring: 2,
  summer: 5,
  fall: 8,
  autumn: 8,
  winter: 11,
};

function toMonthKey(year: number, month: number): number {
  return year * 12 + month;
}

function parseSingleDateToken(token: string, useRangeEndMonth: boolean): number {
  const normalized = token.trim().toLowerCase();

  const monthYearMatch = normalized.match(
    /^(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t|tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?|spring|summer|fall|autumn|winter)\s+(\d{4})$/
  );

  if (monthYearMatch) {
    const month = monthMap[monthYearMatch[1]];
    const year = Number(monthYearMatch[2]);
    return toMonthKey(year, month);
  }

  const yearOnlyMatch = normalized.match(/^(\d{4})$/);
  if (yearOnlyMatch) {
    const year = Number(yearOnlyMatch[1]);
    return toMonthKey(year, useRangeEndMonth ? 11 : 0);
  }

  return Number.NEGATIVE_INFINITY;
}

function parseDateText(rawValue?: string | null): number {
  if (typeof rawValue !== 'string') return Number.NEGATIVE_INFINITY;

  const value = rawValue.trim();

  if (!value) return Number.NEGATIVE_INFINITY;

  // Prefer range end dates for chronology like "May 2023 - Jun 2026".
  if (value.includes(' - ')) {
    const parts = value.split(' - ');
    const end = parts[parts.length - 1];
    const endKey = parseSingleDateToken(end, true);
    if (endKey !== Number.NEGATIVE_INFINITY) return endKey;

    const start = parts[0];
    const startKey = parseSingleDateToken(start, false);
    if (startKey !== Number.NEGATIVE_INFINITY) return startKey;
  }

  const parenMatch = value.match(/\(([^)]+)\)/);
  if (parenMatch) {
    const parenText = parenMatch[1];
    const parenMonthYear = parenText.match(
      /(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t|tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?|spring|summer|fall|autumn|winter)\s+(\d{4})/i
    );
    if (parenMonthYear) {
      const month = monthMap[parenMonthYear[1].toLowerCase()];
      const year = Number(parenMonthYear[2]);
      return toMonthKey(year, month);
    }

    const parenYear = parenText.match(/(\d{4})/);
    if (parenYear) {
      return toMonthKey(Number(parenYear[1]), 11);
    }
  }

  const inlineMonthYear = value.match(
    /(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t|tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?|spring|summer|fall|autumn|winter)\s+(\d{4})/i
  );
  if (inlineMonthYear) {
    const month = monthMap[inlineMonthYear[1].toLowerCase()];
    const year = Number(inlineMonthYear[2]);
    return toMonthKey(year, month);
  }

  const inlineYear = value.match(/(\d{4})/);
  if (inlineYear) {
    return toMonthKey(Number(inlineYear[1]), 11);
  }

  return Number.NEGATIVE_INFINITY;
}

export function getDateSortKey(value?: string | null): number {
  return parseDateText(value);
}

export function sortByDateDesc<T>(items: T[], getValue: (item: T) => string | undefined | null): T[] {
  return [...items].sort((a, b) => getDateSortKey(getValue(b)) - getDateSortKey(getValue(a)));
}

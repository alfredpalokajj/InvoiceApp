// Albanian is formatted by hand: Chrome ships without Albanian locale data, so Intl silently
// falls back to en-US there ("€1,234.56", "10/28/2026"). The hand-written format matches the PDF.
// English uses Intl with en-GB, which every browser supports.

const NBSP = '\u00A0';
const CURRENCY_SYMBOLS: Record<string, string> = { EUR: '€', USD: '$', GBP: '£' };
const pad = (n: number) => String(n).padStart(2, '0');

export function formatMoney(amount: number, currency: string, lang: string) {
  if (lang === 'en') {
    try {
      return new Intl.NumberFormat('en-GB', { style: 'currency', currency }).format(amount);
    } catch {
      // Unknown currency code: fall through to the plain format.
    }
  }
  const [int, dec] = Math.abs(amount).toFixed(2).split('.');
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);
  return `${amount < 0 ? '-' : ''}${grouped},${dec}${NBSP}${CURRENCY_SYMBOLS[currency] ?? currency}`;
}

/** For yyyy-MM-dd dates: parsed as a local date so it never shifts a day across time zones. */
export function formatDate(isoDate: string, lang: string) {
  const [y, m, d] = isoDate.split('-').map(Number);
  if (lang === 'en') {
    return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(y, m - 1, d));
  }
  return `${pad(d)}.${pad(m)}.${y}`;
}

/** For UTC timestamps from the API (which may omit the trailing Z), shown in local time. */
export function formatDateTime(isoDateTime: string, lang: string) {
  const date = new Date(/[zZ]|[+-]\d\d:\d\d$/.test(isoDateTime) ? isoDateTime : `${isoDateTime}Z`);
  if (lang === 'en') {
    return new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
  }
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function todayIso(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Great-circle distance in kilometres. */
export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const rad = (x: number) => (x * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import type { GeocodeResult } from '../types';

export const OSM_TILES = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
export const OSM_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

// Inline SVG/HTML icons avoid Leaflet's default PNG markers, which don't resolve under Vite.
export const destinationIcon = L.divIcon({
  className: '',
  html: `<svg viewBox="0 0 24 32" width="30" height="40" style="filter:drop-shadow(0 2px 2px rgb(0 0 0 / .3))">
    <path d="M12 0C5.4 0 0 5.2 0 11.7 0 20.5 12 32 12 32s12-11.5 12-20.3C24 5.2 18.6 0 12 0z" fill="#e11d48"/>
    <circle cx="12" cy="11.5" r="4.5" fill="#fff"/></svg>`,
  iconSize: [30, 40],
  iconAnchor: [15, 40],
  popupAnchor: [0, -36],
});

export const courierIcon = L.divIcon({
  className: '',
  html: '<span class="courier-dot" style="display:block;width:18px;height:18px;border-radius:9999px;background:#2563eb;border:3px solid #fff"></span>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

/** Free OpenStreetMap geocoder. Fine for an MVP; heavy production use needs its own instance or a paid provider. */
export async function nominatimSearch(query: string, lang: string): Promise<GeocodeResult[]> {
  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('q', query);
  url.searchParams.set('limit', '5');
  url.searchParams.set('accept-language', lang);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Nominatim ${res.status}`);
  const data = (await res.json()) as { display_name: string; lat: string; lon: string }[];
  return data.map((d) => ({ label: d.display_name, position: { lat: Number(d.lat), lng: Number(d.lon) } }));
}

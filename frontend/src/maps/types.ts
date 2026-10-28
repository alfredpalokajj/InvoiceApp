export interface LatLng {
  lat: number;
  lng: number;
}

export interface GeocodeResult {
  label: string;
  position: LatLng;
}

/** Shared props so the Google and Leaflet implementations are interchangeable. */
export interface LocationPickerProps {
  value: LatLng | null;
  /** `address` is set when the location came from an address search. */
  onChange: (position: LatLng, address?: string) => void;
}

export interface DeliveryMapProps {
  destination: LatLng;
  destinationLabel: string;
  current: LatLng | null;
}

// Prishtina, used when nothing is selected yet.
export const DEFAULT_CENTER: LatLng = { lat: 42.6629, lng: 21.1655 };

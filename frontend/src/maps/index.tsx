import { lazy, Suspense } from 'react';
import { Loading } from '../components/ui';
import type { DeliveryMapProps, LocationPickerProps } from './types';

export type { LatLng } from './types';

/** Google Maps when a key is configured, otherwise OpenStreetMap via Leaflet. Only the chosen library is loaded. */
export const usingGoogleMaps = Boolean(import.meta.env.VITE_GOOGLE_MAPS_API_KEY);

const LazyLocationPicker = lazy(() =>
  usingGoogleMaps ? import('./google/GoogleLocationPicker') : import('./leaflet/LeafletLocationPicker'),
);
const LazyDeliveryMap = lazy(() =>
  usingGoogleMaps ? import('./google/GoogleDeliveryMap') : import('./leaflet/LeafletDeliveryMap'),
);

export function LocationPicker(props: LocationPickerProps) {
  return (
    <Suspense fallback={<Loading />}>
      <LazyLocationPicker {...props} />
    </Suspense>
  );
}

export function DeliveryMap(props: DeliveryMapProps) {
  return (
    <Suspense fallback={<Loading />}>
      <LazyDeliveryMap {...props} />
    </Suspense>
  );
}

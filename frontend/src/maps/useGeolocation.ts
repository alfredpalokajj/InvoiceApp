import { useEffect, useState } from 'react';
import type { LatLng } from './types';

export type GeoError = 'denied' | 'unavailable' | 'unsupported';

/** Watches the device position. Needs a secure context (https or localhost). */
export function useGeolocation() {
  const [position, setPosition] = useState<LatLng | null>(null);
  const [error, setError] = useState<GeoError | null>(() =>
    typeof navigator !== 'undefined' && !navigator.geolocation ? 'unsupported' : null,
  );

  useEffect(() => {
    if (!navigator.geolocation) return;
    const id = navigator.geolocation.watchPosition(
      (p) => {
        setPosition({ lat: p.coords.latitude, lng: p.coords.longitude });
        setError(null);
      },
      (e) => setError(e.code === e.PERMISSION_DENIED ? 'denied' : 'unavailable'),
      { enableHighAccuracy: true, maximumAge: 10_000, timeout: 20_000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  return { position, error };
}

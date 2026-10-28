import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AdvancedMarker,
  APIProvider,
  Map as GoogleMap,
  Pin,
  useMap,
  useMapsLibrary,
  type MapMouseEvent,
} from '@vis.gl/react-google-maps';
import { AddressSearch } from '../AddressSearch';
import { DEFAULT_CENTER, type GeocodeResult, type LocationPickerProps } from '../types';
import { GOOGLE_MAP_ID, GOOGLE_MAPS_KEY } from './shared';

function Picker({ value, onChange }: LocationPickerProps) {
  const map = useMap();
  const geocoding = useMapsLibrary('geocoding');

  const search = useCallback(
    async (query: string): Promise<GeocodeResult[]> => {
      if (!geocoding) return [];
      const { results } = await new geocoding.Geocoder().geocode({ address: query });
      return results.slice(0, 5).map((r) => ({
        label: r.formatted_address,
        position: { lat: r.geometry.location.lat(), lng: r.geometry.location.lng() },
      }));
    },
    [geocoding],
  );

  return (
    <div className="space-y-2">
      <AddressSearch
        search={search}
        onSelect={(r) => {
          onChange(r.position, r.label);
          map?.panTo(r.position);
          map?.setZoom(16);
        }}
      />
      <div className="h-72 overflow-hidden rounded-lg ring-1 ring-slate-200">
        <GoogleMap
          mapId={GOOGLE_MAP_ID}
          defaultCenter={value ?? DEFAULT_CENTER}
          defaultZoom={value ? 15 : 13}
          gestureHandling="greedy"
          streetViewControl={false}
          onClick={(e: MapMouseEvent) => {
            const p = e.detail.latLng;
            if (p) onChange({ lat: p.lat, lng: p.lng });
          }}
        >
          {value && (
            <AdvancedMarker
              position={value}
              draggable
              onDragEnd={(e) => {
                const p = e.latLng;
                if (p) onChange({ lat: p.lat(), lng: p.lng() });
              }}
            >
              <Pin background="#e11d48" borderColor="#9f1239" glyphColor="#fff" />
            </AdvancedMarker>
          )}
        </GoogleMap>
      </div>
    </div>
  );
}

export default function GoogleLocationPicker(props: LocationPickerProps) {
  const { i18n } = useTranslation();
  return (
    <APIProvider apiKey={GOOGLE_MAPS_KEY} language={i18n.language}>
      <Picker {...props} />
    </APIProvider>
  );
}

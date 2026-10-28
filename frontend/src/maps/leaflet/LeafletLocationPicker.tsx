import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { LeafletEvent, Marker as LeafletMarker } from 'leaflet';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import { AddressSearch } from '../AddressSearch';
import { DEFAULT_CENTER, type LatLng, type LocationPickerProps } from '../types';
import { destinationIcon, nominatimSearch, OSM_ATTRIBUTION, OSM_TILES } from './shared';

function ClickToPick({ onPick }: { onPick: (p: LatLng) => void }) {
  useMapEvents({ click: (e) => onPick({ lat: e.latlng.lat, lng: e.latlng.lng }) });
  return null;
}

/** Moves the map only when a search result is chosen, not on every click. */
function FlyTo({ target }: { target: LatLng | null }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo(target, Math.max(map.getZoom(), 16), { duration: 0.8 });
  }, [target, map]);
  return null;
}

export default function LeafletLocationPicker({ value, onChange }: LocationPickerProps) {
  const { i18n } = useTranslation();
  const [flyTarget, setFlyTarget] = useState<LatLng | null>(null);

  return (
    <div className="space-y-2">
      <AddressSearch
        search={(q) => nominatimSearch(q, i18n.language)}
        onSelect={(r) => {
          onChange(r.position, r.label);
          setFlyTarget(r.position);
        }}
      />
      <div className="h-72 overflow-hidden rounded-lg ring-1 ring-slate-200">
        <MapContainer center={value ?? DEFAULT_CENTER} zoom={value ? 15 : 13} className="size-full">
          <TileLayer url={OSM_TILES} attribution={OSM_ATTRIBUTION} />
          <ClickToPick onPick={(p) => onChange(p)} />
          <FlyTo target={flyTarget} />
          {value && (
            <Marker
              position={value}
              icon={destinationIcon}
              draggable
              eventHandlers={{
                dragend: (e: LeafletEvent) => {
                  const p = (e.target as LeafletMarker).getLatLng();
                  onChange({ lat: p.lat, lng: p.lng });
                },
              }}
            />
          )}
        </MapContainer>
      </div>
    </div>
  );
}

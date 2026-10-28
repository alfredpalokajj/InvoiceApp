import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { latLngBounds } from 'leaflet';
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet';
import type { DeliveryMapProps, LatLng } from '../types';
import { courierIcon, destinationIcon, OSM_ATTRIBUTION, OSM_TILES } from './shared';

/** Frames courier and destination together once, then leaves panning to the user. */
function FitOnce({ destination, current }: { destination: LatLng; current: LatLng | null }) {
  const map = useMap();
  const done = useRef(false);
  useEffect(() => {
    if (done.current || !current) return;
    map.fitBounds(latLngBounds([destination, current]), { padding: [48, 48], maxZoom: 16 });
    done.current = true;
  }, [map, destination, current]);
  return null;
}

export default function LeafletDeliveryMap({ destination, destinationLabel, current }: DeliveryMapProps) {
  const { t } = useTranslation();
  return (
    <div className="h-80 overflow-hidden rounded-lg ring-1 ring-slate-200 sm:h-96">
      <MapContainer center={destination} zoom={15} className="size-full">
        <TileLayer url={OSM_TILES} attribution={OSM_ATTRIBUTION} />
        <Marker position={destination} icon={destinationIcon}>
          <Popup>
            <strong>{t('courier.destination')}</strong>
            <br />
            {destinationLabel}
          </Popup>
        </Marker>
        {current && (
          <>
            <Marker position={current} icon={courierIcon}>
              <Popup>{t('courier.yourLocation')}</Popup>
            </Marker>
            <Polyline positions={[current, destination]} pathOptions={{ color: '#2563eb', weight: 3, dashArray: '6 8' }} />
          </>
        )}
        <FitOnce destination={destination} current={current} />
      </MapContainer>
    </div>
  );
}

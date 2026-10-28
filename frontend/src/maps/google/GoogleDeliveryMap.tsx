import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { AdvancedMarker, APIProvider, Map as GoogleMap, Pin, useMap } from '@vis.gl/react-google-maps';
import type { DeliveryMapProps, LatLng } from '../types';
import { GOOGLE_MAP_ID, GOOGLE_MAPS_KEY } from './shared';

/** Frames courier and destination together once, then leaves panning to the user. */
function FitOnce({ destination, current }: { destination: LatLng; current: LatLng | null }) {
  const map = useMap();
  const done = useRef(false);
  useEffect(() => {
    if (!map || !current || done.current) return;
    const bounds = new google.maps.LatLngBounds();
    bounds.extend(destination);
    bounds.extend(current);
    map.fitBounds(bounds, 60);
    done.current = true;
  }, [map, destination, current]);
  return null;
}

export default function GoogleDeliveryMap({ destination, destinationLabel, current }: DeliveryMapProps) {
  const { t, i18n } = useTranslation();
  return (
    <APIProvider apiKey={GOOGLE_MAPS_KEY} language={i18n.language}>
      <div className="h-80 overflow-hidden rounded-lg ring-1 ring-slate-200 sm:h-96">
        <GoogleMap
          mapId={GOOGLE_MAP_ID}
          defaultCenter={destination}
          defaultZoom={15}
          gestureHandling="greedy"
          streetViewControl={false}
        >
          <AdvancedMarker position={destination} title={`${t('courier.destination')}: ${destinationLabel}`}>
            <Pin background="#e11d48" borderColor="#9f1239" glyphColor="#fff" />
          </AdvancedMarker>
          {current && (
            <AdvancedMarker position={current} title={t('courier.yourLocation')}>
              <span className="courier-dot block size-[18px] rounded-full border-[3px] border-white bg-blue-600" />
            </AdvancedMarker>
          )}
          <FitOnce destination={destination} current={current} />
        </GoogleMap>
      </div>
    </APIProvider>
  );
}

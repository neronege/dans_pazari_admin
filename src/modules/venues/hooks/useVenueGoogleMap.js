'use client';

import { useEffect, useRef, useState } from 'react';

const GOOGLE_MAPS_SCRIPT_ID = 'dp-google-maps-script';
const DEFAULT_MAP_CENTER = { lat: 38.274631, lng: 27.343516 };

/** Boş string Number('')===0 olduğu için Afrika/deniz (0,0) sanılmasın. */
function parseCoordinate(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const trimmed = typeof value === 'string' ? value.trim() : value;
  if (trimmed === '') {
    return null;
  }

  const n = typeof trimmed === 'number' ? trimmed : Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

function loadGoogleMapsScript(apiKey) {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Google Maps sadece tarayıcıda yüklenebilir.'));
  }

  if (window.google?.maps) {
    return Promise.resolve(window.google.maps);
  }

  const existingScript = document.getElementById(GOOGLE_MAPS_SCRIPT_ID);
  if (existingScript) {
    return new Promise((resolve, reject) => {
      existingScript.addEventListener('load', () => resolve(window.google.maps), { once: true });
      existingScript.addEventListener('error', () => reject(new Error('Google Maps script yüklenemedi.')), { once: true });
    });
  }

  const callbackName = '__dpInitGoogleMaps';

  return new Promise((resolve, reject) => {
    window[callbackName] = () => {
      try {
        delete window[callbackName];
      } catch {
        window[callbackName] = undefined;
      }

      resolve(window.google.maps);
    };

    const script = document.createElement('script');
    script.id = GOOGLE_MAPS_SCRIPT_ID;
    script.async = true;
    script.defer = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&v=weekly&language=tr&region=TR&libraries=maps,marker&loading=async&callback=${callbackName}`;
    script.onerror = () => reject(new Error('Google Maps script yüklenemedi.'));
    document.head.appendChild(script);
  });
}

function getAddressPart(components, targets) {
  const found = components.find((component) => component.types.some((type) => targets.includes(type)));
  return found?.long_name || '';
}

function extractAddressFields(result) {
  const components = result?.address_components || [];

  return {
    city:
      getAddressPart(components, ['administrative_area_level_1']) ||
      getAddressPart(components, ['administrative_area_level_2']) ||
      getAddressPart(components, ['locality']),
    district:
      getAddressPart(components, ['administrative_area_level_2']) ||
      getAddressPart(components, ['sublocality_level_1']) ||
      getAddressPart(components, ['sublocality']),
    address: result?.formatted_address || ''
  };
}

export default function useVenueGoogleMap({ enabled, apiKey, latitude, longitude, mapId, onLocationChange }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const markerClassRef = useRef(null);
  const geocoderRef = useRef(null);
  const clickListenerRef = useRef(null);
  const latitudeRef = useRef(latitude);
  const longitudeRef = useRef(longitude);
  const onLocationChangeRef = useRef(onLocationChange);
  const [mapError, setMapError] = useState('');

  useEffect(() => {
    latitudeRef.current = latitude;
  }, [latitude]);

  useEffect(() => {
    longitudeRef.current = longitude;
  }, [longitude]);

  useEffect(() => {
    onLocationChangeRef.current = onLocationChange;
  }, [onLocationChange]);

  const emitLocationChange = (payload) => {
    if (typeof onLocationChangeRef.current === 'function') {
      onLocationChangeRef.current(payload);
    }
  };

  const setMarkerAt = (lat, lng) => {
    if (!mapRef.current || !window.google?.maps) {
      return;
    }

    const nextPosition = { lat, lng };

    if (!markerRef.current) {
      if (markerClassRef.current) {
        markerRef.current = new markerClassRef.current({
          map: mapRef.current,
          position: nextPosition
        });
      } else {
        markerRef.current = new window.google.maps.Marker({
          map: mapRef.current,
          position: nextPosition
        });
      }
    } else if (typeof markerRef.current.setPosition === 'function') {
      markerRef.current.setPosition(nextPosition);
    } else {
      markerRef.current.position = nextPosition;
    }

    mapRef.current.panTo(nextPosition);
  };

  const handleLocationPick = (lat, lng) => {
    setMapError('');
    emitLocationChange({
      latitude: lat.toFixed(6),
      longitude: lng.toFixed(6)
    });
    setMarkerAt(lat, lng);

    if (!geocoderRef.current) {
      return;
    }

    geocoderRef.current
      .geocode({ location: { lat, lng } })
      .then(({ results }) => {
        const selected = results?.[0];
        if (!selected) {
          return;
        }

        emitLocationChange({
          latitude: lat.toFixed(6),
          longitude: lng.toFixed(6),
          ...extractAddressFields(selected)
        });
      })
      .catch(() => {
        setMapError('Adres bilgisi alınamadı. Lütfen haritada farklı bir nokta seçin.');
      });
  };

  useEffect(() => {
    if (!enabled) {
      setMapError('');
      return () => {
        if (clickListenerRef.current?.remove) {
          clickListenerRef.current.remove();
        }
        clickListenerRef.current = null;
        markerRef.current = null;
        markerClassRef.current = null;
        mapRef.current = null;
        geocoderRef.current = null;
      };
    }

    if (!apiKey) {
      setMapError('Google Maps API anahtarı bulunamadı. NEXT_PUBLIC_GOOGLE_MAPS_API_KEY tanımlayın.');
      return undefined;
    }

    let cancelled = false;
    setMapError('');

    loadGoogleMapsScript(apiKey)
      .then(() => {
        if (cancelled || !mapContainerRef.current || mapRef.current) {
          return;
        }

        const googleMaps = window.google?.maps;
        const MapCtor = googleMaps?.Map;
        const GeocoderCtor = googleMaps?.Geocoder;
        const AdvancedMarkerCtor = googleMaps?.marker?.AdvancedMarkerElement || null;

        if (typeof MapCtor !== 'function') {
          throw new Error('Google Maps harita sınıfı yüklenemedi.');
        }

        markerClassRef.current = typeof AdvancedMarkerCtor === 'function' ? AdvancedMarkerCtor : null;
        geocoderRef.current = typeof GeocoderCtor === 'function' ? new GeocoderCtor() : null;

        const latitudeNumber = parseCoordinate(latitudeRef.current);
        const longitudeNumber = parseCoordinate(longitudeRef.current);
        const hasCoordinates = latitudeNumber !== null && longitudeNumber !== null;
        const center = hasCoordinates
          ? { lat: latitudeNumber, lng: longitudeNumber }
          : DEFAULT_MAP_CENTER;

        mapRef.current = new MapCtor(mapContainerRef.current, {
          center,
          zoom: hasCoordinates ? 14 : 11,
          mapId: mapId || undefined,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false
        });

        if (hasCoordinates) {
          setMarkerAt(latitudeNumber, longitudeNumber);
        }

        clickListenerRef.current = mapRef.current.addListener('click', (event) => {
          const lat = event.latLng?.lat();
          const lng = event.latLng?.lng();

          if (typeof lat !== 'number' || typeof lng !== 'number') {
            return;
          }

          handleLocationPick(lat, lng);
        });
      })
      .catch((scriptError) => {
        if (!cancelled) {
          setMapError(scriptError.message || 'Google Maps yüklenemedi.');
        }
      });

    return () => {
      cancelled = true;
      if (clickListenerRef.current?.remove) {
        clickListenerRef.current.remove();
      }
      clickListenerRef.current = null;
      markerRef.current = null;
      markerClassRef.current = null;
      mapRef.current = null;
      geocoderRef.current = null;
    };
  }, [enabled, apiKey, mapId]);

  return { mapContainerRef, mapError };
}
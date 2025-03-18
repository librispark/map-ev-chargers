"use client";

import React, { useRef, useState } from 'react';

import {Map, useControl} from 'react-map-gl/mapbox';
import {MapboxOverlay} from '@deck.gl/mapbox';
import {DeckProps} from '@deck.gl/core';
import {IconLayer, PathLayer, ScatterplotLayer} from '@deck.gl/layers';
import 'mapbox-gl/dist/mapbox-gl.css';

import { ChargingStation, EvRoute, ChargingWaypoint } from '@/services/mapbox';
import { MapMarkerIconDataUri } from './MapMarkerIcon';
import { MapChargerIconDataUri } from './MapChargerrIcon';

interface MapComponentProps {
  /** Center latitude of the map */
  centerLat?: number;
  /** Center longitude of the map */
  centerLng?: number;
  /** Zoom level of the map */
  zoom?: number;
  /** Map height in pixels or CSS value */
  height?: string | number;
  /** Map width in pixels or CSS value */
  width?: string | number;
  /** Optional array of charging station markers */
  chargingStations?: ChargingStation[];
  route?: EvRoute;
  startPoint?: [number, number];
  endPoint?: [number, number];
  /** Optional callback when a marker is clicked */
  onMarkerClick?: (stationId: string) => void;
  /** Optional callback when a charging stop is clicked */
  onChargingStopClick?: (stationId: string) => void;
  /** Optional callback when the map is moved */
  onMapMove?: (newCenter: { lat: number; lng: number }, newZoom: number) => void;
  /** Whether to show charging stations */
  showChargingStations?: boolean;
  /** Toggle charging stations visibility */
  onToggleChargingStations?: () => void;
}

function DeckGLOverlay(props: DeckProps) {
  const overlay = useControl<MapboxOverlay>(() => new MapboxOverlay(props));
  overlay.setProps(props);
  return null;
}

/**
 * MapComponent - A placeholder for the deck.gl map implementation
 * 
 * This component will be implemented using deck.gl to display
 * EV charging stations on an interactive map.
 */
const MapComponent: React.FC<MapComponentProps> = ({
  centerLat = 39.8283,  // Default to center of US
  centerLng = -98.5795,
  zoom = 4,
  height = 600,
  width = '100%',
  chargingStations = [],
  route,
  startPoint,
  endPoint,
  onMarkerClick,
  onChargingStopClick,
  onMapMove,
  showChargingStations = true,
  onToggleChargingStations,
}) => {
  // State to track if we should show charging stations based on zoom level
  const [showStationsBasedOnZoom, setShowStationsBasedOnZoom] = useState(zoom >= 12);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  
  // Convert height to string with px if it's a number
  const heightStyle = typeof height === 'number' ? `${height}px` : height;
  // Convert width to string with px if it's a number
  const widthStyle = typeof width === 'number' ? `${width}px` : width;

  // Route line layer
  const routeLayer = route ? new PathLayer({
    id: 'route-path',
    data: [{ 
      // Extract coordinates from route legs to create a path
      path: route.legs.flatMap(leg => 
        leg.steps.flatMap(step => {
          // Each step has a maneuver with a location
          return [step.maneuver.location];
        })
      )
    }],
    getPath: d => d.path,
    getWidth: 3,
    getColor: [0, 100, 255], // Blue
    widthUnits: 'pixels',
  }) : null;

  // Start point layer
  const startPointLayer = startPoint ? new IconLayer({
    id: 'start-point',
    data: [{ position: startPoint }],
    getIcon: d => ({
      url: MapMarkerIconDataUri(),
      width: 48,
      height: 48,
      anchorY: 48, // Bottom of the icon
    }),
    getPosition: d => d.position,
    getSize: 48,
    sizeScale: 1,
  }) : null;

  // End point layer
  const endPointLayer = endPoint ? new IconLayer({
    id: 'end-point',
    data: [{ position: endPoint }],
    getIcon: d => ({
      url: MapMarkerIconDataUri(),
      width: 48,
      height: 48,
      anchorY: 48, // Bottom of the icon
    }),
    getPosition: d => d.position,
    getSize: 48,
    sizeScale: 1,
  }) : null;

  // Charging stops layer
  const chargingStopsLayer = route?.chargingWaypoints ? new IconLayer({
    id: 'charging-stops',
    data: route.chargingWaypoints,
    getIcon: d => ({
      url: MapChargerIconDataUri(),
      width: 36,
      height: 36,
      anchorY: 36, // Bottom of the icon
    }),
    getPosition: d => d.location,
    getSize: 36,
    sizeScale: 1,
    pickable: true,
    onClick: ({object}) => {
      if (object && onChargingStopClick) {
        onChargingStopClick(object.stationId);
      }
    },
  }) : null;

  // Create a layer for the charging stations
  const layers = [
    routeLayer,
    showChargingStations && showStationsBasedOnZoom ? new ScatterplotLayer({
      id: 'charging-stations',
      data: chargingStations,
      pickable: true,
      opacity: 0.8,
      stroked: true,
      filled: true,
      radiusScale: 6,
      radiusMinPixels: 5,
      radiusMaxPixels: 15,
      lineWidthMinPixels: 1,
      getPosition: d => [d.lng, d.lat],
      getRadius: d => {
        // Scale radius based on power level if available
        return d.powerLevel ? Math.min(5000 + (d.powerLevel * 100), 10000) : 5000;
      },
      getFillColor: d => d.available ? [46, 204, 113, 200] : [231, 76, 60, 200], // Green if available, red if not
      getLineColor: d => [0, 0, 0],
      onClick: ({object}) => {
        if (object && onMarkerClick) {
          onMarkerClick(object.id);
        }
      },
      beforeId: 'waterway-label' // In interleaved mode render the layer under map labels
    }) : null,
    ...(startPointLayer ? [startPointLayer] : []),
    ...(endPointLayer ? [endPointLayer] : []),
    ...(chargingStopsLayer ? [chargingStopsLayer] : [])
  ];
  
  return (
    <div className="map-component">
      <div 
        ref={mapContainerRef}
        style={{ 
          height: heightStyle, 
          width: widthStyle,
          backgroundColor: '#f0f0f0',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          color: '#666',
          border: '2px dashed #ccc'
        }}>
        {
          <Map
            initialViewState={{
              longitude: centerLng,
              latitude: centerLat,
              zoom: zoom
            }}
            longitude={centerLng}
            latitude={centerLat}
            zoom={zoom}
            mapStyle="mapbox://styles/mapbox/light-v9"
            mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
            onMove={evt => {
              // Update visibility based on zoom level
              setShowStationsBasedOnZoom(evt.viewState.zoom >= 12);
              
              if (onMapMove) {
                onMapMove(
                  { 
                    lat: evt.viewState.latitude, 
                    lng: evt.viewState.longitude 
                  }, 
                  evt.viewState.zoom
                );
              }
            }}
          >
            <DeckGLOverlay layers={layers} />
          </Map>
        }
        <div style={{ fontSize: '0.9rem', textAlign: 'center', width: '100%' }}>
          <div className="flex justify-between items-center">
            <div>
              <span>Center: {centerLat.toFixed(4)}, {centerLng.toFixed(4)} </span>
              <span>Zoom: {zoom} </span>
              <span> Charging Stations: {chargingStations.length}</span>
            </div>
            <button 
              onClick={onToggleChargingStations}
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm ml-auto"
            >
              {showChargingStations ? 'Hide' : 'Show'} Charging Stations
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapComponent;

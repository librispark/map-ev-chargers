"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import MapComponent from './MapComponent';
import ChargingStationModal from './ChargingStationModal';
import { 
  fetchChargingStations, 
  fetchChargingStationDetails,
  ChargingStation, 
  ChargingStationDetails, 
  EvRoute
} from '@/services/mapbox';

interface MapWrapperProps {
  centerLat?: number;
  centerLng?: number;
  zoom?: number;
  height?: string | number;
  width?: string | number;
  chargingStations?: ChargingStation[];
  route?: EvRoute;
  startPoint?: [number, number];
  endPoint?: [number, number];
  searchRadius?: number; // Search radius in kilometers
  useRealData?: boolean; // Whether to use real data from Mapbox API
}

/**
 * MapWrapper - A client component wrapper for MapComponent
 * 
 * This component handles client-side interactions with the map
 * while allowing the parent page to remain server-rendered.
 */
const MapWrapper: React.FC<MapWrapperProps> = (props) => {
  const {
    centerLat = 38.9072, // Default to Washington DC
    centerLng = -77.0369, // Default to Washington DC
    zoom = 12, // Higher zoom level for city view
    searchRadius = 50, // Default 50km radius (max is 100km)
    useRealData = true // Default to using real data
  } = props;

  const [stations, setStations] = useState<ChargingStation[]>(props.chargingStations || []);
  // Cache stations by ID and location hash to avoid duplicates
  const [stationsCache, setStationsCache] = useState<{[key: string]: ChargingStation}>({});
  
  // Update stations array whenever the cache changes
  useEffect(() => {
    const allStations = Object.values(stationsCache) as ChargingStation[];
    setStations(allStations);
  }, [stationsCache]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({ lat: centerLat, lng: centerLng });
  const [mapZoom, setMapZoom] = useState<number>(zoom);
  const [startPoint, setStartPoint] = useState<[number, number]>([centerLng, centerLat]);
  const [endPoint, setEndPoint] = useState<[number, number]>([centerLng, centerLat]);
  const [route, setRoute] = useState<EvRoute | null>(null);
  const [showChargingStations, setShowChargingStations] = useState<boolean>(true);
  
  // State for the charging station details modal
  const [selectedStation, setSelectedStation] = useState<ChargingStationDetails | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState<boolean>(false);
  
  // Debounce timer reference
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Function to fetch charging stations with debouncing
  const fetchStations = useCallback(async (lat: number, lng: number, radius: number, immediate = false) => {
    if (!useRealData) return; // Skip if not using real data
    
    // Clear any existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // If immediate, fetch right away, otherwise debounce
    if (immediate) {
      setIsLoading(true);
      setError(null);
      
      try {
        let fetchedStations = await fetchChargingStations(
          lat,
          lng,
          radius,
          {
            limit: 100, // Fetch up to 100 stations (API maximum)
            availability: 'AVAILABLE' // Only fetch available stations
          }
        );
        
        // Process fetched stations and add only new ones to cache
        const newStations: {[key: string]: ChargingStation} = {};
        let cacheUpdated = false;
        
        fetchedStations.forEach(station => {
          // Create a location hash for the station
          const locationHash = `${station.lat.toFixed(6)},${station.lng.toFixed(6)}`;
          // Use a composite key of ID and location hash
          const cacheKey = `${station.id}_${locationHash}`;
          
          // Only add if not already in cache
          if (!stationsCache[cacheKey]) {
            newStations[cacheKey] = station;
            cacheUpdated = true;
          }
        });
        
        // Only update the cache if we have new stations
        if (cacheUpdated) {
          setStationsCache(prevCache => ({
            ...prevCache,
            ...newStations
          }));
        }
        
        // No need to manually update stations here, it will be done by the useEffect
      } catch (err) {
        console.error('Error fetching charging stations:', err);
        setError('Failed to fetch charging stations. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    } else {
      // Set a loading indicator after a short delay to avoid flickering for quick movements
      const loadingTimer = setTimeout(() => setIsLoading(true), 300);
      
      // Debounce the actual API call by 800ms
      debounceTimerRef.current = setTimeout(async () => {
        clearTimeout(loadingTimer);
        setIsLoading(true);
        setError(null);
        
        try {
        let fetchedStations = await fetchChargingStations(
          lat,
          lng,
          radius,
          {
            limit: 100, // Fetch up to 100 stations (API maximum)
            availability: 'AVAILABLE' // Only fetch available stations
          }
        );
        
        // Process fetched stations and add only new ones to cache
        const newStations: {[key: string]: ChargingStation} = {};
        let cacheUpdated = false;
        
        fetchedStations.forEach(station => {
          // Create a location hash for the station
          const locationHash = `${station.lat.toFixed(6)},${station.lng.toFixed(6)}`;
          // Use a composite key of ID and location hash
          const cacheKey = `${station.id}_${locationHash}`;
          
          // Only add if not already in cache
          if (!stationsCache[cacheKey]) {
            newStations[cacheKey] = station;
            cacheUpdated = true;
          }
        });
        
        // Only update the cache if we have new stations
        if (cacheUpdated) {
          setStationsCache(prevCache => ({
            ...prevCache,
            ...newStations
          }));
        }
        
        // No need to manually update stations here, it will be done by the useEffect
        } catch (err) {
          console.error('Error fetching charging stations:', err);
          setError('Failed to fetch charging stations. Please try again later.');
        } finally {
          setIsLoading(false);
        }
      }, 800);
    }
  }, [useRealData, stationsCache]);

  // Fetch stations when component mounts - use immediate fetch
  useEffect(() => {
    if (useRealData) {
      fetchStations(centerLat, centerLng, searchRadius, true);
    }
  }, [centerLat, centerLng, searchRadius, fetchStations, useRealData]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Function to fetch charging station details and open the modal
  const fetchStationDetails = async (stationId: string) => {
    // Find the station in our current list
    const station = stations.find(s => s.id === stationId);
    if (!station) {
      console.error(`Station with ID ${stationId} not found`);
      return;
    }
    
    setIsLoadingDetails(true);
    
    try {
      const details = await fetchChargingStationDetails(stationId);
      if (details) {
        setSelectedStation(details);
        setIsModalOpen(true);
      } else {
        setError('Failed to load charging station details. Please try again.');
      }
    } catch (err) {
      console.error('Error fetching charging station details:', err);
      setError('Failed to load charging station details. Please try again.');
    } finally {
      setIsLoadingDetails(false);
    }
  };
  
  // Client-side event handlers
  const handleMarkerClick = (stationId: string) => {
    fetchStationDetails(stationId);
  };
  
  // Function to close the modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  // Toggle charging stations visibility
  const handleToggleChargingStations = () => {
    setShowChargingStations(!showChargingStations);
  };

  const handleMapMove = (newCenter: { lat: number; lng: number }, newZoom: number) => {
    
    // Update state with new center and zoom
    setMapCenter(newCenter);
    setMapZoom(newZoom);
    
    
    // Always fetch new stations when the map moves with debouncing
    if (newZoom >= 12) {
      fetchStations(newCenter.lat, newCenter.lng, searchRadius);
    }
  };

  // Function to handle charging stop clicks
  const handleChargingStopClick = async (stationId: string) => {
    // Find the charging stop in the route
    const stop = props.route?.chargingWaypoints.find(wp => wp.stationId === stationId);
    if (!stop) return;
    
    setIsLoadingDetails(true);
    
    try {
      // Create a simplified ChargingStationDetails object from the waypoint data
      const details: ChargingStationDetails = {
        id: stop.stationId,
        name: stop.name,
        address: "Route charging stop",
        city: "",
        postalCode: "",
        country: "",
        coordinates: {
          latitude: stop.location[1],
          longitude: stop.location[0]
        },
        operator: {
          name: stop.providerNames?.[0] || "Unknown"
        },
        evses: [{
          uid: "1",
          status: "AVAILABLE",
          connectors: [{
            id: "1",
            standard: stop.plugType,
            format: "SOCKET",
            powerType: stop.currentType.toUpperCase(),
            maxVoltage: 0,
            maxAmperage: 0,
            maxElectricPower: stop.powerKw
          }]
        }]
      };
      
      setSelectedStation(details);
      setIsModalOpen(true);
    } catch (err) {
      console.error('Error preparing charging stop details:', err);
      setError('Failed to load charging stop details.');
    } finally {
      setIsLoadingDetails(false);
    }
  };

  return (
    <div>
      <div className="text-center mb-2 text-sm text-green-600" style={{visibility: isLoading ? 'initial' : 'hidden'}}>
        Loading charging stations...
      </div>
      
      {error && (
        <div className="text-center mb-2 text-sm text-red-600">
          {error}
        </div>
      )}
      
      <MapComponent 
        {...props}
        centerLat={mapCenter.lat}
        centerLng={mapCenter.lng}
        zoom={mapZoom}
        chargingStations={useRealData ? stations : props.chargingStations}
        onMarkerClick={handleMarkerClick}
        onMapMove={handleMapMove}
        route={props.route}
        startPoint={props.startPoint}
        endPoint={props.endPoint}
        onChargingStopClick={handleChargingStopClick}
        showChargingStations={showChargingStations}
        onToggleChargingStations={handleToggleChargingStations}
      />
      
      <div className="mt-2 text-sm text-gray-600">
        {stations.length > 0 && showChargingStations && mapZoom > 12 ? (
          <p>Found {stations.length} charging stations within {searchRadius}km</p>
        ) : !isLoading && showChargingStations && mapZoom > 12 && (
          <p>No charging stations found in this area. Try moving the map or increasing the search radius.</p>
        )}
      </div>
      
      {/* Charging Station Details Modal */}
      <ChargingStationModal 
        station={selectedStation}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
      
      {/* Loading overlay for station details */}
      {isLoadingDetails && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 flex flex-col items-center">
            <div className="animate-spin h-10 w-10 border-4 border-blue-500 rounded-full border-t-transparent mb-4"></div>
            <p className="text-lg">Loading charging station details...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapWrapper;

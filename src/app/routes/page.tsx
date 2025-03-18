"use client";

import React, { useState } from 'react';
import MapWrapper from '@/components/MapWrapper';
import LocationSearch from '@/components/LocationSearch';
import { 
  ChargingStation, 
  calculateEvRoute, 
  formatDistance, 
  formatDuration,
  calculateTotalChargingTime,
  EvRoute,
  EvVehicleParams
} from '@/services/mapbox';
import { LocationDetail } from '@/services/searchService';

export default function RoutesPage() {
  // State for selected locations
  const [startLocation, setStartLocation] = useState<LocationDetail | null>(null);
  const [endLocation, setEndLocation] = useState<LocationDetail | null>(null);
  
  // Default map center (will be updated when locations are selected)
  const [mapCenter, setMapCenter] = useState({
    lat: 38.9072, // Washington DC
    lng: -77.0369
  });
  
  const [mapZoom, setMapZoom] = useState(15);
  

  // State for route data
  const [route, setRoute] = useState<EvRoute | null>(null);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);
  
  // State for vehicle parameters
  const [vehicleType, setVehicleType] = useState<string>('');
  const [vehicleRange, setVehicleRange] = useState<number>(150); // Lower default range to encourage charging stops
  const [selectedConnectors, setSelectedConnectors] = useState<{[key: string]: boolean}>({
    ccs: true,
    chademo: false,
    j1772: true,
    tesla: false,
    nacs: false
  });

  // Handle location selection
  const handleStartLocationSelect = (location: LocationDetail) => {
    setStartLocation(location);
    updateMapView(location, endLocation);
  };
  
  const handleEndLocationSelect = (location: LocationDetail) => {
    setEndLocation(location);
    updateMapView(startLocation, location);
  };
  
  // Calculate distance between two points in kilometers using the Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // Distance in km
    return distance;
  };
  
  // Calculate appropriate zoom level based on distance
  const calculateZoomLevel = (distanceInKm: number): number => {
    // These values are approximate and may need adjustment
    if (distanceInKm > 1000) return 4;      // Continental view
    if (distanceInKm > 500) return 5;       // Large region
    if (distanceInKm > 250) return 6;       // Region
    if (distanceInKm > 100) return 7;       // Large area
    if (distanceInKm > 50) return 8;        // Area
    if (distanceInKm > 25) return 9;        // Small area
    if (distanceInKm > 10) return 10;       // City
    if (distanceInKm > 5) return 11;        // Town
    if (distanceInKm > 2) return 12;        // Village
    if (distanceInKm > 1) return 13;        // Neighborhood
    if (distanceInKm > 0.5) return 14;      // Streets
    return 15;                              // Street level
  };
  
  // Update map view based on selected locations
  const updateMapView = (start: LocationDetail | null, end: LocationDetail | null) => {
    
    if (start && end) {
      // If both locations are selected, center the map between them
      const newCenter = {
        lat: (start.coordinates.latitude + end.coordinates.latitude) / 2,
        lng: (start.coordinates.longitude + end.coordinates.longitude) / 2
      };
      
      // Calculate distance between points
      const distance = calculateDistance(
        start.coordinates.latitude,
        start.coordinates.longitude,
        end.coordinates.latitude,
        end.coordinates.longitude
      );
      
      // Calculate appropriate zoom level based on distance
      const newZoom = calculateZoomLevel(distance);
      
      
      setMapCenter(newCenter);
      setMapZoom(newZoom);
    } else if (start) {
      // If only start location is selected, center on it
      const newCenter = {
        lat: start.coordinates.latitude,
        lng: start.coordinates.longitude
      };
      setMapCenter(newCenter);
      setMapZoom(14);
    } else if (end) {
      // If only end location is selected, center on it
      const newCenter = {
        lat: end.coordinates.latitude,
        lng: end.coordinates.longitude
      };
      setMapCenter(newCenter);
      setMapZoom(14);
    }
  };
  
  // Handle connector type selection
  const handleConnectorChange = (connectorType: string, checked: boolean) => {
    setSelectedConnectors(prev => ({
      ...prev,
      [connectorType]: checked
    }));
  };
  
  // Calculate route when both locations are selected
  const calculateRoute = async () => {
    if (!startLocation || !endLocation) {
      alert('Please select both a starting point and destination');
      return;
    }
    
    setIsCalculatingRoute(true);
    setRouteError(null);
    
    try {
      
      // Prepare vehicle parameters with valid Mapbox connector types
      const connectorTypes: string[] = [];
      if (selectedConnectors.ccs) connectorTypes.push('ccs_combo_type2');
      if (selectedConnectors.chademo) connectorTypes.push('chademo');
      if (selectedConnectors.j1772) connectorTypes.push('ccs_combo_type1');
      if (selectedConnectors.tesla) connectorTypes.push('tesla');
      // NACS is not directly supported by Mapbox API, map to Tesla
      if (selectedConnectors.nacs) connectorTypes.push('tesla');
      
      const vehicleParams: EvVehicleParams = {
        vehicleType: vehicleType || undefined,
        range: vehicleRange * 1609.34, // Convert miles to meters
        initialCharge: 10, // Start with 10% charge to encourage charging stops (percentage units)
        minCharge: 10, // Don't go below 10% charge (percentage units)
        maxCharge: 100, // Maximum charge capacity (percentage units)
        connectorTypes: connectorTypes.length > 0 ? connectorTypes : undefined
      };
      
      
      // Call the EV routing API
      const routeResult = await calculateEvRoute(
        startLocation.coordinates.latitude,
        startLocation.coordinates.longitude,
        endLocation.coordinates.latitude,
        endLocation.coordinates.longitude,
        vehicleParams
      );
      
      if (routeResult) {
        setRoute(routeResult);
      } else {
        setRouteError('Could not calculate a route with the given parameters. Try adjusting your vehicle range or connector types.');
      }
    } catch (error) {
      console.error('Error calculating route:', error instanceof Error ? error.message : error);
      setRouteError('An error occurred while calculating the route. Please try again.');
    } finally {
      setIsCalculatingRoute(false);
    }
  };
  
  return (
    <div className="flex flex-col items-center py-8">
      <h1 className="text-4xl font-bold mb-6">Plan Your EV Route</h1>
      
      <div className="max-w-3xl text-center mb-10">
        <p className="text-xl mb-4">
          Plan your journey with optimal charging stops along the way.
        </p>
        <p className="mb-6">
          Enter your starting point and destination to find the best route with convenient charging stations.
        </p>
      </div>

      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="md:col-span-1 bg-gray-100 dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4">Route Details</h2>
          
          <div className="space-y-4">
            <LocationSearch
              label="Starting Point"
              placeholder="Enter starting address or city"
              onLocationSelect={handleStartLocationSelect}
            />
            
            <LocationSearch
              label="Destination"
              placeholder="Enter destination address or city"
              onLocationSelect={handleEndLocationSelect}
            />

            <div>
              <label htmlFor="vehicle" className="block mb-1 font-medium">Vehicle Type</label>
              <select 
                id="vehicle" 
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
              >
                <option value="">Select your vehicle</option>
                <option value="tesla_model3">Tesla Model 3</option>
                <option value="tesla_modely">Tesla Model Y</option>
                <option value="chevy_bolt">Chevy Bolt</option>
                <option value="nissan_leaf">Nissan Leaf</option>
                <option value="ford_mach_e">Ford Mustang Mach-E</option>
                <option value="hyundai_ioniq5">Hyundai IONIQ 5</option>
                <option value="kia_ev6">Kia EV6</option>
                <option value="rivian_r1t">Rivian R1T</option>
                <option value="other">Other (Custom Range)</option>
              </select>
            </div>

            <div>
              <label htmlFor="range" className="block mb-1 font-medium">Vehicle Range (miles)</label>
              <input 
                type="number" 
                id="range" 
                placeholder="Enter range in miles" 
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                value={vehicleRange}
                onChange={(e) => setVehicleRange(Number(e.target.value))}
                min={50}
                max={500}
              />
            </div>

            <div>
              <label htmlFor="chargerTypes" className="block mb-1 font-medium">Compatible Charger Types</label>
              <div className="space-y-1">
                <div className="flex items-center">
                  <input 
                    type="checkbox" 
                    id="ccs" 
                    className="mr-2" 
                    checked={selectedConnectors.ccs}
                    onChange={(e) => handleConnectorChange('ccs', e.target.checked)}
                  />
                  <label htmlFor="ccs">CCS Combo Type 2 (European)</label>
                </div>
                <div className="flex items-center">
                  <input 
                    type="checkbox" 
                    id="chademo" 
                    className="mr-2" 
                    checked={selectedConnectors.chademo}
                    onChange={(e) => handleConnectorChange('chademo', e.target.checked)}
                  />
                  <label htmlFor="chademo">CHAdeMO</label>
                </div>
                <div className="flex items-center">
                  <input 
                    type="checkbox" 
                    id="j1772" 
                    className="mr-2" 
                    checked={selectedConnectors.j1772}
                    onChange={(e) => handleConnectorChange('j1772', e.target.checked)}
                  />
                  <label htmlFor="j1772">CCS Combo Type 1 (J-plug)</label>
                </div>
                <div className="flex items-center">
                  <input 
                    type="checkbox" 
                    id="tesla" 
                    className="mr-2" 
                    checked={selectedConnectors.tesla}
                    onChange={(e) => handleConnectorChange('tesla', e.target.checked)}
                  />
                  <label htmlFor="tesla">Tesla</label>
                </div>
                <div className="flex items-center">
                  <input 
                    type="checkbox" 
                    id="nacs" 
                    className="mr-2" 
                    checked={selectedConnectors.nacs}
                    onChange={(e) => handleConnectorChange('nacs', e.target.checked)}
                  />
                  <label htmlFor="nacs">NACS (Maps to Tesla)</label>
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Note: Mapbox API supports ccs_combo_type1, ccs_combo_type2, tesla, and chademo connector types.
              </div>
            </div>

            <button 
              className="w-full bg-foreground text-background py-2 rounded-md hover:bg-opacity-90 transition-colors"
              onClick={calculateRoute}
              disabled={!startLocation || !endLocation}
            >
              Calculate Route
            </button>
          </div>
        </div>

        <div className="md:col-span-2">
          {/* Using the MapWrapper component */}
          <div className="w-full mb-4">
            <MapWrapper 
              key={`map-${mapCenter.lat}-${mapCenter.lng}-${mapZoom}`}
              height={500}
              width="100%"
              centerLat={mapCenter.lat}
              centerLng={mapCenter.lng}
              zoom={mapZoom}
              searchRadius={50} // 50km radius
              useRealData={true} // Use real data from the API
              route={route || undefined}
              startPoint={startLocation ? [startLocation.coordinates.longitude, startLocation.coordinates.latitude] : undefined}
              endPoint={endLocation ? [endLocation.coordinates.longitude, endLocation.coordinates.latitude] : undefined}
            />
          </div>

          {/* Route summary section */}
          <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-3">Route Summary</h3>
            
            {isCalculatingRoute && (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground"></div>
                <span className="ml-3">Calculating optimal route...</span>
              </div>
            )}
            
            {routeError && (
              <div className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 p-4 rounded-md mb-4">
                {routeError}
              </div>
            )}
            
            {!isCalculatingRoute && !routeError && route && (
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span>Total Distance:</span>
                  <span className="font-medium">{formatDistance(route.distance)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated Travel Time:</span>
                  <span className="font-medium">{formatDuration(route.duration)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Number of Charging Stops:</span>
                  <span className="font-medium">{route.chargingWaypoints.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Charging Time:</span>
                  <span className="font-medium">{formatDuration(calculateTotalChargingTime(route))}</span>
                </div>
              </div>
            )}
            
            {!isCalculatingRoute && !routeError && !route && (
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span>Total Distance:</span>
                  <span className="font-medium">-- miles</span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated Travel Time:</span>
                  <span className="font-medium">-- hours -- minutes</span>
                </div>
                <div className="flex justify-between">
                  <span>Number of Charging Stops:</span>
                  <span className="font-medium">--</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Charging Time:</span>
                  <span className="font-medium">-- hours -- minutes</span>
                </div>
              </div>
            )}

            <h3 className="text-xl font-semibold mt-6 mb-3">Charging Stops</h3>
            
            {!isCalculatingRoute && route && route.chargingWaypoints.length > 0 ? (
              <div className="space-y-4">
                {route.chargingWaypoints.map((waypoint, index) => (
                  <div key={index} className="bg-white dark:bg-gray-700 p-4 rounded-md shadow-sm">
                    <div className="font-medium text-lg">{waypoint.name}</div>
                    <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                      <div>Charging Time:</div>
                      <div>{formatDuration(waypoint.chargeTime)}</div>
                      
                      <div>Charge At Arrival:</div>
                      <div>{Math.round(waypoint.chargeAtArrival)} kWh</div>
                      
                      <div>Charge To:</div>
                      <div>{Math.round(waypoint.chargeTo)} kWh</div>
                      
                      <div>Connector Type:</div>
                      <div className="capitalize">{waypoint.plugType.replace(/_/g, ' ')}</div>
                      
                      <div>Power:</div>
                      <div>{waypoint.powerKw} kW</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 italic">
                {isCalculatingRoute ? 'Calculating charging stops...' : 'Enter a route to see recommended charging stops'}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-lg shadow-md w-full max-w-6xl">
        <h2 className="text-2xl font-semibold mb-4">About Route Planning</h2>
        <p className="mb-4">
          Our route planning tool calculates the optimal path between your starting point and destination, 
          taking into account your vehicle's range and compatible charging stations along the way.
        </p>
        <p>
          The algorithm prioritizes fast-charging stations located near your route to minimize detours 
          and overall travel time. It also considers factors like charging speed and station reliability 
          to ensure a smooth journey.
        </p>
      </div>
    </div>
  );
}

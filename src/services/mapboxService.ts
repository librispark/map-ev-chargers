/**
 * Charging Stations API Service
 * 
 * This service handles API calls to our server-side API route that proxies
 * requests to the Mapbox EV Charge Finder API. This keeps the Mapbox access token
 * secure on the server side.
 * 
 * API Reference: https://docs.mapbox.com/api/navigation/ev-charge-finder/
 */

export interface ChargingStation {
  id: string;
  lat: number;
  lng: number;
  name: string;
  chargerType: string[];
  powerLevel: number;
  network: string;
  available: boolean;
  address: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  distance?: number; // Distance from search point in km
}

/**
 * Interface for detailed charging station information
 */
export interface ChargingStationDetails {
  id: string;
  name: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  operator: {
    name: string;
    website?: string;
  };
  owner?: {
    name: string;
    website?: string;
  };
  evses: Array<{
    uid: string;
    status: string;
    connectors: Array<{
      id: string;
      standard: string;
      format: string;
      powerType: string;
      maxVoltage: number;
      maxAmperage: number;
      maxElectricPower: number;
    }>;
  }>;
  openingTimes?: {
    twentyfourseven: boolean;
    regularHours?: Array<{
      weekday: number;
      periodBegin: string;
      periodEnd: string;
    }>;
  };
  parkingType?: string;
  tariffs?: Array<{
    id: string;
    currency: string;
    elements: Array<{
      priceComponents: Array<{
        type: string;
        price: number;
        stepSize: number;
      }>;
    }>;
    type: string;
  }>;
}

/**
 * Interface for EV route charging waypoint
 */
export interface ChargingWaypoint {
  type: string; // 'charging-station'
  name: string;
  chargeTime: number; // Time in seconds to charge
  chargeTo: number; // Watt-hours to charge to
  chargeAtArrival: number; // Battery charge in Watt-hours on arrival
  plugType: string; // e.g., 'ccs_combo_type2'
  currentType: string; // e.g., 'dc'
  powerKw: number; // Maximum power in kW
  stationId: string;
  providerNames?: string[];
  location: [number, number]; // [longitude, latitude]
}

/**
 * Interface for EV route leg
 */
export interface RouteLeg {
  distance: number; // Distance in meters
  duration: number; // Duration in seconds
  summary: string;
  steps: RouteStep[];
  annotation?: {
    distance: number[];
    duration: number[];
    speed: number[];
    stateOfCharge?: number[]; // Battery state of charge as percentage
  };
}

/**
 * Interface for EV route step
 */
export interface RouteStep {
  distance: number; // Distance in meters
  duration: number; // Duration in seconds
  geometry: string; // Encoded polyline
  name: string;
  mode: string; // 'driving', 'ferry', etc.
  maneuver: {
    location: [number, number]; // [longitude, latitude]
    bearingBefore: number;
    bearingAfter: number;
    type: string; // 'depart', 'arrive', 'turn', etc.
    modifier?: string; // 'left', 'right', etc.
    instruction: string;
  };
  intersections: Array<{
    location: [number, number]; // [longitude, latitude]
    bearings: number[];
    entry: boolean[];
    in?: number;
    out?: number;
  }>;
}

/**
 * Interface for EV route
 */
export interface EvRoute {
  distance: number; // Total distance in meters
  duration: number; // Total duration in seconds
  geometry: string; // Encoded polyline of the entire route
  legs: RouteLeg[];
  waypoints: Array<{
    name: string;
    location: [number, number]; // [longitude, latitude]
    metadata?: {
      type: string; // 'charging-station' for charging waypoints
      name: string;
      chargeTime: number;
      chargeTo: number;
      chargeAtArrival: number;
      plugType: string;
      currentType: string;
      powerKw: number;
      stationId: string;
      providerNames?: string[];
    };
  }>;
  chargingWaypoints: ChargingWaypoint[];
}

/**
 * Interface for EV vehicle parameters
 */
export interface EvVehicleParams {
  vehicleType?: string; // e.g., 'tesla_model3'
  range?: number; // Range in meters
  initialCharge?: number; // Initial charge in percentage (0-100)
  maxCharge?: number; // Maximum charge in percentage (0-100)
  minCharge?: number; // Minimum charge in percentage (0-100)
  connectorTypes?: string[]; // e.g., ['ccs_combo_type2', 'tesla']
}

// Interfaces for the Mapbox EV Charge Finder API response
interface MapboxEvConnector {
  id: string;
  standard: string;
  format: string;
  power_type: string;
  max_voltage: number;
  max_amperage: number;
  max_electric_power: number;
  last_updated: string;
}

interface MapboxEvse {
  uid: string;
  evse_id: string;
  status: string;
  connectors: MapboxEvConnector[];
  coordinates: {
    latitude: string;
    longitude: string;
  };
  last_updated: string;
}

interface MapboxLocation {
  country_code: string;
  party_id: string;
  id: string;
  publish: boolean;
  name: string;
  address: string;
  city: string;
  postal_code: string;
  state: string;
  country: string;
  coordinates: {
    latitude: string;
    longitude: string;
  };
  evses: MapboxEvse[];
  operator: {
    name: string;
  };
  owner?: {
    name: string;
  };
  time_zone: string;
  opening_times: {
    twentyfourseven: boolean;
  };
  last_updated: string;
}

interface MapboxEvFeature {
  type: string;
  geometry: {
    type: string;
    coordinates: [number, number]; // [longitude, latitude]
  };
  properties: {
    location: MapboxLocation;
    proximity: {
      latitude: number;
      longitude: number;
      distance: number; // Distance in kilometers
    };
  };
}

interface MapboxEvResponse {
  type: string;
  features: MapboxEvFeature[];
}

/**
 * Fetches charging stations from our server-side API route
 * 
 * @param latitude - The latitude coordinate to search from
 * @param longitude - The longitude coordinate to search from
 * @param distance - The search radius in kilometers (default: 10km)
 * @param options - Optional parameters for the API request
 * @returns Promise<ChargingStation[]> - Array of charging stations
 */
export async function fetchChargingStations(
  latitude: number, 
  longitude: number, 
  distance: number = 10, // Default 10km radius
  options?: {
    limit?: number;
    connectorTypes?: string[];
    operators?: string[];
    excludeOperators?: string[];
    minChargingPower?: number;
    maxChargingPower?: number;
    availability?: string;
  }
): Promise<ChargingStation[]> {
  try {
    // Build the URL with required parameters
    let url = `/api/charging-stations?latitude=${latitude}&longitude=${longitude}&distance=${distance}`;
    
    // Add optional parameters if provided
    if (options) {
      if (options.limit) {
        url += `&limit=${options.limit}`;
      }
      if (options.connectorTypes && options.connectorTypes.length > 0) {
        url += `&connector_types=${options.connectorTypes.join(',')}`;
      }
      if (options.operators && options.operators.length > 0) {
        url += `&operators=${options.operators.join(',')}`;
      }
      if (options.excludeOperators && options.excludeOperators.length > 0) {
        url += `&exclude_operators=${options.excludeOperators.join(',')}`;
      }
      if (options.minChargingPower !== undefined) {
        url += `&min_charging_power=${options.minChargingPower}`;
      }
      if (options.maxChargingPower !== undefined) {
        url += `&max_charging_power=${options.maxChargingPower}`;
      }
      if (options.availability) {
        url += `&availability=${options.availability}`;
      }
    }
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `API request failed with status ${response.status}`);
    }
    
    // The server already transforms the data to match our ChargingStation interface
    const stations: ChargingStation[] = await response.json();
    return stations;
  } catch (error) {
    console.error('Error fetching charging stations:', error);
    return [];
  }
}

/**
 * Fetches detailed information about a specific charging station
 * 
 * @param stationId - The ID of the charging station to get details for
 * @returns Promise<ChargingStationDetails | null> - Detailed charging station information or null if not found
 */
export async function fetchChargingStationDetails(stationId: string): Promise<ChargingStationDetails | null> {
  try {
    const response = await fetch(`/api/charging-stations/details?id=${encodeURIComponent(stationId)}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `API request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    
    // Transform the Mapbox API response to our ChargingStationDetails interface
    if (data && data.properties && data.properties.location) {
      const location = data.properties.location;
      const tariffs = data.properties.tariffs || [];
      
      return {
        id: location.id,
        name: location.name,
        address: location.address,
        city: location.city,
        postalCode: location.postal_code,
        country: location.country,
        coordinates: {
          latitude: parseFloat(location.coordinates.latitude),
          longitude: parseFloat(location.coordinates.longitude)
        },
        operator: {
          name: location.operator?.name || 'Unknown',
          website: location.operator?.website
        },
        owner: location.owner ? {
          name: location.owner.name,
          website: location.owner.website
        } : undefined,
        evses: location.evses.map((evse: any) => ({
          uid: evse.uid,
          status: evse.status,
          connectors: evse.connectors.map((connector: any) => ({
            id: connector.id,
            standard: connector.standard,
            format: connector.format,
            powerType: connector.power_type,
            maxVoltage: connector.max_voltage,
            maxAmperage: connector.max_amperage,
            maxElectricPower: connector.max_electric_power
          }))
        })),
        openingTimes: location.opening_times ? {
          twentyfourseven: location.opening_times.twentyfourseven,
          regularHours: location.opening_times.regular_hours ? 
            location.opening_times.regular_hours.map((hour: any) => ({
              weekday: hour.weekday,
              periodBegin: hour.period_begin,
              periodEnd: hour.period_end
            })) : undefined
        } : undefined,
        parkingType: location.parking_type,
        tariffs: tariffs.map((tariff: any) => ({
          id: tariff.id,
          currency: tariff.currency,
          elements: tariff.elements.map((element: any) => ({
            priceComponents: element.price_components.map((component: any) => ({
              type: component.type,
              price: component.price,
              stepSize: component.step_size
            }))
          })),
          type: tariff.type
        }))
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching charging station details:', error);
    return null;
  }
}

/**
 * Calculates an EV route between two points with charging stops as needed
 * 
 * @param startLat - Starting point latitude
 * @param startLng - Starting point longitude
 * @param endLat - Destination point latitude
 * @param endLng - Destination point longitude
 * @param vehicleParams - EV vehicle parameters
 * @returns Promise<EvRoute | null> - The calculated route or null if no route could be found
 */
export async function calculateEvRoute(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number,
  vehicleParams: EvVehicleParams = {}
): Promise<EvRoute | null> {
  try {
    // Build the URL with required parameters
    let url = `/api/routes/ev?` +
      `start=${startLng},${startLat}&` +
      `end=${endLng},${endLat}`;
    
    // Add vehicle parameters if provided
    if (vehicleParams.vehicleType) {
      url += `&vehicle=${vehicleParams.vehicleType}`;
    }
    if (vehicleParams.range) {
      url += `&range=${vehicleParams.range}`;
    }
    if (vehicleParams.initialCharge !== undefined) {
      url += `&initial_charge=${vehicleParams.initialCharge}`;
    }
    if (vehicleParams.maxCharge !== undefined) {
      url += `&max_charge=${vehicleParams.maxCharge}`;
    }
    if (vehicleParams.minCharge !== undefined) {
      url += `&min_charge=${vehicleParams.minCharge}`;
    }
    if (vehicleParams.connectorTypes && vehicleParams.connectorTypes.length > 0) {
      url += `&connector_types=${vehicleParams.connectorTypes.join(',')}`;
    }
    
    // Add additional parameters for the route
    url += `&steps=true&geometries=polyline&overview=full&annotations=distance,duration,speed,state_of_charge&waypoints_per_route=true`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `API request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.routes || data.routes.length === 0) {
      return null;
    }
    
    const route = data.routes[0];
    
    // Extract charging waypoints
    const chargingWaypoints: ChargingWaypoint[] = route.waypoints

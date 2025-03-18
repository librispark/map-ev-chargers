/**
 * Type definitions for Mapbox API services
 */

/**
 * Interface for a charging station
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
  /**
   * Connector types supported by the vehicle
   * Valid values:
   * - ccs_combo_type1: Combined Charging System J-plug with fast charging DC
   * - ccs_combo_type2: Combined Charging System Mennekes with fast charging DC
   * - tesla: Proprietary connector for Tesla vehicles
   * - chademo: CHAdeMO fast charging standard
   * 
   * The API will automatically map common variations:
   * - type1, j1772 → ccs_combo_type1
   * - type2, mennekes → ccs_combo_type2
   * - ccs_type1 → ccs_combo_type1
   * - ccs_type2 → ccs_combo_type2
   */
  connectorTypes?: string[];
}

// Interfaces for the Mapbox EV Charge Finder API response
export interface MapboxEvConnector {
  id: string;
  standard: string;
  format: string;
  power_type: string;
  max_voltage: number;
  max_amperage: number;
  max_electric_power: number;
  last_updated: string;
}

export interface MapboxEvse {
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

export interface MapboxLocation {
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

export interface MapboxEvFeature {
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

export interface MapboxEvResponse {
  type: string;
  features: MapboxEvFeature[];
}

/**
 * EV Routing API Service
 * 
 * This service handles API calls to our server-side API route that proxies
 * requests to the Mapbox Directions API with EV routing capabilities.
 * 
 * API Reference: https://docs.mapbox.com/api/navigation/directions/
 */

import { 
  EvRoute, 
  EvVehicleParams,
  ChargingWaypoint
} from './types';

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
    if (vehicleParams.connectorTypes && vehicleParams.connectorTypes.length > 0) {
      // Map connector types to valid Mapbox connector types if needed
      const validConnectorTypes = vehicleParams.connectorTypes.map(type => {
        // Already handle mapping in the API route, but ensure we're using consistent naming
        return type;
      });
      url += `&connector_types=${validConnectorTypes.join(',')}`;
    } else {
      // Default to common connector types if none provided
      url += '&connector_types=ccs_combo_type2,ccs_combo_type1';
    }
    
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
    const chargingWaypoints: ChargingWaypoint[] = [];
    
    // Get waypoints from the correct location in the response
    const waypointsSource = data.waypoints || route.waypoints || [];
    
    
    // Check if we have any charging waypoints
    let hasChargingWaypoints = false;
    
    waypointsSource.forEach((waypoint: any) => {
      if (waypoint.metadata && waypoint.metadata.type === 'charging-station') {
        hasChargingWaypoints = true;
        // Values should already be in percentage units (0-100)
        chargingWaypoints.push({
          type: 'charging-station',
          name: waypoint.metadata.name,
          chargeTime: waypoint.metadata.charge_time,
          chargeTo: waypoint.metadata.charge_to,
          chargeAtArrival: waypoint.metadata.charge_at_arrival,
          plugType: waypoint.metadata.plug_type,
          currentType: waypoint.metadata.current_type || '',
          powerKw: waypoint.metadata.power_kw,
          stationId: waypoint.metadata.station_id,
          providerNames: waypoint.metadata.provider_names,
          location: waypoint.location
        });
      }
    });
    
    // Transform the route to our EvRoute interface
    const evRoute: EvRoute = {
      distance: route.distance,
      duration: route.duration,
      geometry: route.geometry,
      legs: route.legs.map((leg: any) => ({
        distance: leg.distance,
        duration: leg.duration,
        summary: leg.summary || '',
        steps: leg.steps.map((step: any) => ({
          distance: step.distance,
          duration: step.duration,
          geometry: step.geometry,
          name: step.name,
          mode: step.mode,
          maneuver: {
            location: step.maneuver.location,
            bearingBefore: step.maneuver.bearing_before,
            bearingAfter: step.maneuver.bearing_after,
            type: step.maneuver.type,
            modifier: step.maneuver.modifier,
            instruction: step.maneuver.instruction
          },
          intersections: step.intersections.map((intersection: any) => ({
            location: intersection.location,
            bearings: intersection.bearings,
            entry: intersection.entry,
            in: intersection.in,
            out: intersection.out
          }))
        })),
        annotation: leg.annotation ? {
          distance: leg.annotation.distance,
          duration: leg.annotation.duration,
          speed: leg.annotation.speed,
          stateOfCharge: leg.annotation.state_of_charge
        } : undefined
      })),
      waypoints: waypointsSource.map((waypoint: any) => ({
        name: waypoint.name,
        location: waypoint.location,
        metadata: waypoint.metadata ? {
          type: waypoint.metadata.type,
          name: waypoint.metadata.name,
          chargeTime: waypoint.metadata.charge_time,
          chargeTo: waypoint.metadata.charge_to,
          chargeAtArrival: waypoint.metadata.charge_at_arrival,
          plugType: waypoint.metadata.plug_type,
          currentType: waypoint.metadata.current_type || '',
          powerKw: waypoint.metadata.power_kw,
          stationId: waypoint.metadata.station_id,
          providerNames: waypoint.metadata.provider_names
        } : undefined
      })),
      chargingWaypoints
    };
    
    return evRoute;
  } catch (error) {
    console.error('Error calculating EV route:', error instanceof Error ? error.message : error);
    return null;
  }
}

/**
 * Formats a duration in seconds to a human-readable string
 * 
 * @param seconds - Duration in seconds
 * @returns Formatted duration string (e.g., "2 hours 30 minutes")
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ${minutes > 0 ? `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}` : ''}`;
  } else {
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;
  }
}

/**
 * Formats a distance in meters to a human-readable string
 * 
 * @param meters - Distance in meters
 * @param useImperial - Whether to use imperial units (miles) instead of metric (km)
 * @returns Formatted distance string (e.g., "10.5 miles" or "16.9 km")
 */
export function formatDistance(meters: number, useImperial: boolean = true): string {
  if (useImperial) {
    const miles = meters / 1609.34;
    return `${miles.toFixed(1)} ${miles === 1 ? 'mile' : 'miles'}`;
  } else {
    const km = meters / 1000;
    return `${km.toFixed(1)} km`;
  }
}

/**
 * Calculates the total charging time for a route
 * 
 * @param route - The EV route
 * @returns Total charging time in seconds
 */
export function calculateTotalChargingTime(route: EvRoute): number {
  return route.chargingWaypoints.reduce((total, waypoint) => total + waypoint.chargeTime, 0);
}

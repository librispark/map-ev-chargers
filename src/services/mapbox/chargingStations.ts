/**
 * Charging Stations API Service
 * 
 * This service handles API calls to our server-side API route that proxies
 * requests to the Mapbox EV Charge Finder API. This keeps the Mapbox access token
 * secure on the server side.
 * 
 * API Reference: https://docs.mapbox.com/api/navigation/ev-charge-finder/
 */

import { 
  ChargingStation, 
  ChargingStationDetails 
} from './types';

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

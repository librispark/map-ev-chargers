import { v4 as uuidv4 } from 'uuid';

/**
 * Interface for location search suggestions
 */
export interface LocationSuggestion {
  name: string;
  mapbox_id: string;
  feature_type: string;
  address?: string;
  full_address?: string;
  place_formatted: string;
}

/**
 * Interface for location details with coordinates
 */
export interface LocationDetail {
  name: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  address?: string;
  full_address?: string;
  place_formatted: string;
}

/**
 * Class to manage search session tokens
 * This ensures that suggest and retrieve calls are properly grouped for billing
 */
class SearchSessionManager {
  private static instance: SearchSessionManager;
  private sessionToken: string;
  
  private constructor() {
    this.sessionToken = uuidv4();
  }
  
  public static getInstance(): SearchSessionManager {
    if (!SearchSessionManager.instance) {
      SearchSessionManager.instance = new SearchSessionManager();
    }
    return SearchSessionManager.instance;
  }
  
  public getSessionToken(): string {
    return this.sessionToken;
  }
  
  public refreshSessionToken(): string {
    this.sessionToken = uuidv4();
    return this.sessionToken;
  }
}

/**
 * Get location suggestions based on search text
 * 
 * @param searchText - The text to search for
 * @param options - Optional parameters for the search
 * @returns Promise<LocationSuggestion[]> - Array of location suggestions
 */
export async function getLocationSuggestions(
  searchText: string,
  options?: {
    limit?: number;
    country?: string;
    proximity?: string;
    types?: string;
  }
): Promise<LocationSuggestion[]> {
  try {
    if (!searchText.trim()) {
      return [];
    }
    
    // Get the session token
    const sessionManager = SearchSessionManager.getInstance();
    const sessionToken = sessionManager.getSessionToken();
    
    // Build the URL with required parameters
    let url = `/api/search?q=${encodeURIComponent(searchText)}&session_token=${sessionToken}`;
    
    // Add optional parameters if provided
    if (options) {
      if (options.limit) {
        url += `&limit=${options.limit}`;
      }
      if (options.country) {
        url += `&country=${options.country}`;
      }
      if (options.proximity) {
        url += `&proximity=${options.proximity}`;
      }
      if (options.types) {
        url += `&types=${options.types}`;
      }
    }
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    
    // Extract the suggestions from the response
    return data.suggestions || [];
  } catch (error) {
    console.error('Error fetching location suggestions:', error);
    return [];
  }
}

/**
 * Get location details including coordinates based on mapbox_id
 * 
 * @param mapboxId - The mapbox_id from a suggestion
 * @returns Promise<LocationDetail | null> - Location details or null if not found
 */
export async function getLocationDetails(mapboxId: string): Promise<LocationDetail | null> {
  try {
    // Get the session token
    const sessionManager = SearchSessionManager.getInstance();
    const sessionToken = sessionManager.getSessionToken();
    
    const url = `/api/search/retrieve?id=${encodeURIComponent(mapboxId)}&session_token=${sessionToken}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    
    // After a successful retrieve call, refresh the session token
    // This is because the search session is complete once a retrieve call is made
    sessionManager.refreshSessionToken();
    
    // Extract and transform the location details
    if (data.features && data.features.length > 0) {
      const feature = data.features[0];
      
      return {
        name: feature.properties.name,
        coordinates: {
          latitude: feature.geometry.coordinates[1],
          longitude: feature.geometry.coordinates[0]
        },
        address: feature.properties.address,
        full_address: feature.properties.full_address,
        place_formatted: feature.properties.place_formatted
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching location details:', error);
    return null;
  }
}

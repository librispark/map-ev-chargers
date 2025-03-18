import { NextRequest, NextResponse } from 'next/server';

// This should be stored in .env.local and accessed via process.env
const MAPBOX_SERVER_TOKEN = process.env.MAPBOX_SERVER_TOKEN || new Error('MAPBOX_SERVER_TOKEN undefined');

/**
 * GET handler for /api/charging-stations
 * 
 * This is a server-side API route that proxies requests to the Mapbox EV Charge Finder API
 * to keep the access token secure on the server side.
 */
export async function GET(request: NextRequest) {
  try {
    // Get query parameters from the request
    const searchParams = request.nextUrl.searchParams;
    const latitude = searchParams.get('latitude');
    const longitude = searchParams.get('longitude');
    const distance = searchParams.get('distance') || '10'; // Default to 10km
    
    // Validate required parameters
    if (!latitude || !longitude) {
      return NextResponse.json(
        { error: 'Missing required parameters: latitude and longitude are required' },
        { status: 400 }
      );
    }
    
    // Optional parameters
    const limit = searchParams.get('limit');
    const connectorTypes = searchParams.get('connector_types');
    const operators = searchParams.get('operators');
    const excludeOperators = searchParams.get('exclude_operators');
    const minChargingPower = searchParams.get('min_charging_power');
    const maxChargingPower = searchParams.get('max_charging_power');
    const availability = searchParams.get('availability');
    
    // Build the Mapbox API URL
    let mapboxUrl = `https://api.mapbox.com/ev/v1/locations?access_token=${MAPBOX_SERVER_TOKEN}&latitude=${latitude}&longitude=${longitude}&distance=${distance}`;
    
    // Add optional parameters if provided
    if (limit) mapboxUrl += `&limit=${limit}`;
    if (connectorTypes) mapboxUrl += `&connector_types=${connectorTypes}`;
    if (operators) mapboxUrl += `&operators=${operators}`;
    if (excludeOperators) mapboxUrl += `&exclude_operators=${excludeOperators}`;
    if (minChargingPower) mapboxUrl += `&min_charging_power=${minChargingPower}`;
    if (maxChargingPower) mapboxUrl += `&max_charging_power=${maxChargingPower}`;
    if (availability) mapboxUrl += `&availability=${availability}`;
    
    // Make the request to Mapbox API with all required headers
    const response = await fetch(mapboxUrl, {
      headers: {
        'accept': '*/*',
        'accept-language': 'en-US,en;q=0.9',
        'cache-control': 'no-cache',
        'origin': 'https://docs.mapbox.com',
        'pragma': 'no-cache',
        'referer': 'https://docs.mapbox.com/',
        'sec-ch-ua': '"Not A(Brand";v="8", "Chromium";v="132", "Google Chrome";v="132"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"macOS"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-site',
        'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Mapbox API error:', errorText);
      return NextResponse.json(
        { error: `Mapbox API error: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }
    
    // Get the data from the response
    const data = await response.json();
    
    // Transform the data to match our ChargingStation interface
    const transformedData = data.features.map((feature: any) => {
      const location = feature.properties.location;
      const evse = location.evses[0]; // Use the first EVSE for simplicity
      const connector = evse?.connectors[0]; // Use the first connector for simplicity
      
      return {
        id: location.id,
        lat: parseFloat(location.coordinates.latitude),
        lng: parseFloat(location.coordinates.longitude),
        name: location.name,
        chargerType: evse?.connectors.map((c: any) => c.standard) || [],
        powerLevel: connector?.max_electric_power || 0,
        network: location.operator.name,
        available: evse?.status === 'AVAILABLE',
        address: location.address,
        city: location.city,
        state: location.state,
        postalCode: location.postal_code,
        country: location.country,
        distance: feature.properties.proximity.distance
      };
    });
    
    // Return the transformed data
    return NextResponse.json(transformedData);
  } catch (error) {
    console.error('Error in charging stations API route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

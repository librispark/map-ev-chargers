/**
 * EV Routing API Route
 * 
 * This API route proxies requests to the Mapbox Directions API with EV routing capabilities.
 * It keeps the Mapbox access token secure on the server side.
 * 
 * API Reference: https://docs.mapbox.com/api/navigation/directions/
 */

import { NextRequest, NextResponse } from 'next/server';

// This should be stored in .env.local and accessed via process.env
const MAPBOX_SERVER_TOKEN = process.env.MAPBOX_SERVER_TOKEN || new Error('MAPBOX_SERVER_TOKEN undefined');

export async function GET(request: NextRequest) {
  try {
    // Ensure Mapbox server token is available
    if (!MAPBOX_SERVER_TOKEN) {
      console.error('Mapbox server token is not configured');
      return NextResponse.json(
        { error: 'Mapbox server token is not configured' },
        { status: 500 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const start = searchParams.get('start');
    const end = searchParams.get('end');
    
    // Log all parameters for debugging
    console.log('Request parameters:', {
      start,
      end,
      vehicle: searchParams.get('vehicle'),
      range: searchParams.get('range'),
      initial_charge: searchParams.get('initial_charge'),
      min_charge: searchParams.get('min_charge'),
      connector_types: searchParams.get('connector_types'),
      steps: searchParams.get('steps'),
      geometries: searchParams.get('geometries'),
      overview: searchParams.get('overview'),
      annotations: searchParams.get('annotations'),
      waypoints_per_route: searchParams.get('waypoints_per_route')
    });

    // Validate required parameters
    if (!start || !end) {
      return NextResponse.json(
        { error: 'Missing required parameters: start and end coordinates are required' },
        { status: 400 }
      );
    }

    // Build Mapbox Directions API URL with EV routing parameters
    // Note: Mapbox expects coordinates in the format longitude,latitude
    let mapboxUrl = `https://api.mapbox.com/directions/v5/mapbox/driving/${start};${end}?alternatives=false&annotations=state_of_charge%2Cduration&geometries=geojson&language=en&overview=full&steps=true&engine=electric&ev_initial_charge=56000&ev_max_charge=70000&energy_consumption_curve=10%2C300%3B20%2C130%3B40%2C100%3B60%2C110%3B80%2C120%3B100%2C140%3B120%2C160%3B140%2C180&ev_charging_curve=7000%2C250000%3B14000%2C220000%3B21000%2C180000%3B28000%2C140000%3B35000%2C100000%3B42000%2C80000%3B49000%2C60000%3B63000%2C40000&ev_max_ac_charging_power=11500&ev_min_charge_at_destination=10500&ev_min_charge_at_charging_station=10500&auxiliary_consumption=1500&access_token=${MAPBOX_SERVER_TOKEN}`;
    
    const connectorTypes = searchParams.get('connector_types') || searchParams.get('connectorTypes');
    if (connectorTypes) {
      // Split by comma and validate/fix each connector type
      const validConnectorTypes = connectorTypes.split(',')
        .map(type => {
          type = type.trim();
          // Map common variations to valid types
          if (type === 'type1' || type === 'j1772') return 'ccs_combo_type1';
          if (type === 'type2' || type === 'mennekes') return 'ccs_combo_type2';
          if (type === 'ccs_type1') return 'ccs_combo_type1';
          if (type === 'ccs_type2') return 'ccs_combo_type2';
          
          // Return as is if it's already a valid type
          if (['ccs_combo_type1', 'ccs_combo_type2', 'tesla', 'chademo'].includes(type)) {
            return type;
          }
          
          // Default to ccs_combo_type2 for unknown types
          console.warn(`Unknown connector type: ${type}, defaulting to ccs_combo_type2`);
          return 'ccs_combo_type2';
        })
        .filter((value, index, self) => self.indexOf(value) === index); // Remove duplicates
      
      if (validConnectorTypes.length > 0) {
        mapboxUrl += `&ev_connector_types=${validConnectorTypes.join(',')}`;
      }
    } else {
      // Default to common connector types if none provided
      mapboxUrl += '&ev_connector_types=ccs_combo_type2,ccs_combo_type1';
    }

    // Log the URL for debugging
    console.log('Mapbox API URL:', mapboxUrl);

    // Make request to Mapbox Directions API with all required headers
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
      let errorMessage = `Mapbox API error: ${response.status} ${response.statusText}`;
      try {
        const errorText = await response.text();
        console.error('Mapbox API error response:', errorText);
        
        // Try to parse the error as JSON
        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.message) {
            errorMessage = `Mapbox API error: ${errorJson.message}`;
          }
        } catch (parseError) {
          // If it's not valid JSON, use the text as is
          errorMessage = `Mapbox API error: ${errorText}`;
        }
      } catch (textError) {
        console.error('Failed to get error text:', textError);
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      );
    }

    // Return the Mapbox API response
    const data = await response.json();
    
    // Log the response for debugging
    console.log('Mapbox API response waypoints:', data.waypoints);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in EV routing API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

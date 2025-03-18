import { NextRequest, NextResponse } from 'next/server';

// This should be stored in .env.local and accessed via process.env
const MAPBOX_SERVER_TOKEN = process.env.MAPBOX_SERVER_TOKEN || new Error('MAPBOX_SERVER_TOKEN undefined');

/**
 * GET handler for /api/search/retrieve
 * 
 * This is a server-side API route that proxies requests to the Mapbox Search Retrieve API
 * to get the full details of a location, including its coordinates.
 */
export async function GET(request: NextRequest) {
  try {
    // Get query parameters from the request
    const searchParams = request.nextUrl.searchParams;
    const mapboxId = searchParams.get('id');
    const sessionToken = searchParams.get('session_token');
    
    // Validate required parameters
    if (!mapboxId) {
      return NextResponse.json(
        { error: 'Missing required parameter: id (mapbox_id) is required' },
        { status: 400 }
      );
    }
    
    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Missing required parameter: session_token is required' },
        { status: 400 }
      );
    }
    
    // Build the Mapbox API URL
    const mapboxUrl = `https://api.mapbox.com/search/searchbox/v1/retrieve/${mapboxId}?access_token=${MAPBOX_SERVER_TOKEN}&session_token=${sessionToken}`;
    
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
    
    // Return the data
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in search retrieve API route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

# EV Charger Map

A Next.js application for mapping electric vehicle charging stations across the country and planning routes between locations. Uses the Mapbox EV Charge Finder API to display real charging station data.

## Features

- **Browse Map**: Explore EV charging stations across the country with filtering options
- **Plan Routes**: Calculate optimal routes between locations with charging stops
- **Support for All EV Types**: Compatible with all electric vehicle types and charger standards
- **Real Charging Station Data**: Uses the Mapbox EV Charge Finder API to display actual charging stations
- **Interactive Map**: Pan and zoom to discover charging stations in different areas
- **Location Search**: Autocomplete search for addresses and locations
- **Charging Station Details**: View detailed information about charging stations including:
  - Available connectors and power levels
  - Real-time availability status
  - Pricing information
  - Opening hours
  - Operator details

## Getting Started

### Prerequisites

- Node.js 18 or later
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone https://github.com/librispark/map-ev-chargers.git
cd map-ev-chargers
```

2. Install dependencies
```bash
npm install
# or
yarn install
```

3. Set up environment variables
```bash
cp .env.local.example .env.local
```
Then edit `.env.local` to add your Mapbox API tokens.

4. Run the development server
```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application

## Project Structure

- `src/app/`: Next.js App Router pages
  - `page.tsx`: Home page
  - `map/page.tsx`: Browse map page
  - `routes/page.tsx`: Route planning page
  - `api/`: Server-side API routes
    - `charging-stations/route.ts`: Proxy for Mapbox EV Charge Finder API
    - `charging-stations/details/route.ts`: Proxy for Mapbox EV Charge Point details API
    - `routes/ev/route.ts`: Proxy for Mapbox Directions API with EV routing
    - `search/route.ts`: Proxy for Mapbox Search API (location suggestions)
    - `search/retrieve/route.ts`: Proxy for Mapbox Search API (location details)
- `src/components/`: React components
  - `MapComponent.tsx`: Map implementation using deck.gl and Mapbox (client component)
  - `MapWrapper.tsx`: Client component wrapper for MapComponent that handles events and API calls
  - `LocationSearch.tsx`: Autocomplete search component for locations
  - `ChargingStationModal.tsx`: Modal for displaying detailed charging station information
- `src/services/`: Service modules
  - `mapbox/`: Services for interacting with Mapbox APIs
    - `types.ts`: Type definitions for Mapbox API services
    - `chargingStations.ts`: Service for interacting with the Mapbox EV Charge Finder API
    - `evRouting.ts`: Service for EV routing with charging stops
    - `index.ts`: Re-exports all Mapbox services and types
  - `searchService.ts`: Service for interacting with the Mapbox Search API
  - `index.ts`: Re-exports all services for easy importing

## Architecture

The application uses Next.js App Router with a hybrid rendering approach:

- Pages are server-rendered for better SEO and initial load performance
- Interactive components (like the map) are client components
- The `MapWrapper` component serves as a bridge between server and client components, handling client-side events
- Server-side API routes proxy requests to Mapbox APIs to keep API tokens secure

### Data Flow

1. The `MapWrapper` component initializes with default or provided coordinates
2. It calls the `fetchChargingStations` function from the `mapbox` service to get charging stations
3. The API response is transformed into the application's `ChargingStation` interface
4. The stations are passed to the `MapComponent` for rendering
5. When the user moves the map, new stations are fetched for the new location
6. When a user clicks on a station marker, detailed information is fetched and displayed in a modal
7. For route planning, the `calculateEvRoute` function is called with start and end coordinates
8. The route with charging waypoints is displayed to the user

## Mapbox API Integration

### EV Charge Finder API

The application uses the [Mapbox EV Charge Finder API](https://docs.mapbox.com/api/navigation/ev-charge-finder/) to fetch real charging station data. This API provides information about EV charging stations, including:

- Location (latitude, longitude)
- Station name and address
- Connector types (CCS, CHAdeMO, J1772, etc.)
- Power levels
- Network operator
- Availability status

#### Using the Charging Stations API Service

The `mapbox` services provide a clean interface for working with the charging stations API:

```typescript
import { fetchChargingStations } from '@/services/mapbox';

// Basic usage
const stations = await fetchChargingStations(
  latitude,
  longitude,
  distance // in kilometers
);

// With additional options
const stations = await fetchChargingStations(
  latitude,
  longitude,
  distance,
  {
    limit: 50, // Number of stations to return (max 100)
    connectorTypes: ['ccs_combo_type2', 'type2'], // Filter by connector types
    operators: ['ChargePoint', 'Tesla'], // Filter by operators
    excludeOperators: ['Blink'], // Exclude specific operators
    minChargingPower: 50, // Minimum charging power in kW
    maxChargingPower: 350, // Maximum charging power in kW
    availability: 'AVAILABLE' // Only return available stations
  }
);
```

#### Charging Station Details

The application also uses the Mapbox EV Charge Point details API to fetch detailed information about specific charging stations:

```typescript
import { fetchChargingStationDetails } from '@/services/mapbox';

// Fetch details for a specific charging station
const stationDetails = await fetchChargingStationDetails(stationId);
```

#### EV Routing with Charging Stops

The application uses the Mapbox Directions API with EV routing capabilities to calculate routes with optimal charging stops:

```typescript
import { 
  calculateEvRoute, 
  formatDistance, 
  formatDuration,
  calculateTotalChargingTime
} from '@/services/mapbox';

// Calculate an EV route with charging stops
const route = await calculateEvRoute(
  startLat,
  startLng,
  endLat,
  endLng,
  {
    vehicleType: 'tesla_model3',
    range: 400000, // 400km range in meters
    initialCharge: 80, // Starting with 80% charge
    minCharge: 10, // Don't go below 10% charge
    connectorTypes: ['ccs_combo_type2', 'tesla_supercharger']
  }
);

// Format the route information
console.log(`Distance: ${formatDistance(route.distance)}`);
console.log(`Duration: ${formatDuration(route.duration)}`);
console.log(`Charging Time: ${formatDuration(calculateTotalChargingTime(route))}`);
console.log(`Charging Stops: ${route.chargingWaypoints.length}`);

// Access charging waypoints
route.chargingWaypoints.forEach(waypoint => {
  console.log(`Stop at: ${waypoint.name}`);
  console.log(`Charging time: ${formatDuration(waypoint.chargeTime)}`);
  console.log(`Charge from ${Math.round(waypoint.chargeAtArrival / 100)}% to ${Math.round(waypoint.chargeTo / 100)}%`);
});
```

### Search API

The application uses the [Mapbox Search API](https://docs.mapbox.com/api/search/) to provide location search functionality:

- Autocomplete suggestions as the user types
- Detailed location information for selected suggestions
- Session token management for proper API billing

#### Using the Search API Service

The `searchService.ts` module provides a clean interface for working with the search API:

```typescript
import { 
  getLocationSuggestions, 
  getLocationDetails 
} from '@/services/searchService';

// Get location suggestions as the user types
const suggestions = await getLocationSuggestions(
  searchText,
  {
    limit: 5,
    types: 'address,place,poi'
  }
);

// Get detailed information about a selected location
const locationDetails = await getLocationDetails(locationId);
```

## Server-Side API Routes

The application includes server-side API routes that proxy requests to the Mapbox APIs:

- **Charging Stations**: `/api/charging-stations`
- **Charging Station Details**: `/api/charging-stations/details`
- **EV Routing**: `/api/routes/ev`
- **Location Search**: `/api/search`
- **Location Details**: `/api/search/retrieve`

This approach keeps the Mapbox access tokens secure on the server side and provides a clean interface for the client-side code. Each API route handles parameter validation, error handling, and transforms the Mapbox API responses to match our application's data models.

## Implementing Your Own deck.gl Components

The current implementation uses a basic deck.gl setup. To enhance it with more advanced features:

1. Install additional deck.gl modules if needed:
```bash
npm install @deck.gl/geo-layers @deck.gl/aggregation-layers
```

2. Create custom layers for different visualizations:

```typescript
// Example: Creating a heatmap of charging stations
import { HexagonLayer } from '@deck.gl/aggregation-layers';

const hexagonLayer = new HexagonLayer({
  id: 'hexagon-layer',
  data: chargingStations,
  getPosition: d => [d.lng, d.lat],
  getElevationWeight: d => d.powerLevel,
  elevationScale: 100,
  extruded: true,
  radius: 1000,
  coverage: 0.8,
  colorRange: [
    [65, 182, 196],
    [127, 205, 187],
    [199, 233, 180],
    [237, 248, 177],
    [255, 255, 204]
  ]
});
```

## Technologies Used

- [Next.js](https://nextjs.org/) - React framework
- [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [deck.gl](https://deck.gl/) - WebGL-powered framework for visual exploratory data analysis
- [Mapbox](https://www.mapbox.com/) - Maps and location data provider
- [Mapbox EV Charge Finder API](https://docs.mapbox.com/api/navigation/ev-charge-finder/) - API for EV charging station data
- [Mapbox Search API](https://docs.mapbox.com/api/search/) - API for location search and geocoding
- [UUID](https://github.com/uuidjs/uuid) - For generating session tokens

## License

This project is licensed under the MIT License - see the LICENSE file for details.

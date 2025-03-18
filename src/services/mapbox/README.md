# Mapbox Services

This directory contains services for interacting with Mapbox APIs, specifically for EV charging stations and routing.

## Structure

The services are organized into the following files:

- `types.ts` - Contains all type definitions and interfaces used by the services
- `chargingStations.ts` - Services for fetching charging stations and their details
- `evRouting.ts` - Services for calculating EV routes with charging stops
- `index.ts` - Re-exports all services and types for easy importing

## Usage

### Importing

You can import the services and types from the main index file:

```typescript
import { 
  ChargingStation, 
  fetchChargingStations,
  calculateEvRoute,
  formatDistance,
  formatDuration
} from '@/services/mapbox';
```

### Fetching Charging Stations

```typescript
// Fetch charging stations within 10km of a location
const stations = await fetchChargingStations(
  latitude,  // e.g., 38.9072
  longitude, // e.g., -77.0369
  10,        // 10km radius
  {
    limit: 50,                      // Limit to 50 results
    connectorTypes: ['ccs_combo_type2', 'type2'], // Filter by connector types
    minChargingPower: 50            // Minimum 50kW charging power
  }
);
```

### Fetching Charging Station Details

```typescript
// Fetch detailed information about a specific charging station
const stationDetails = await fetchChargingStationDetails('station_id_here');
```

### Calculating EV Routes

```typescript
// Calculate an EV route with charging stops
const route = await calculateEvRoute(
  startLat,
  startLng,
  endLat,
  endLng,
  {
    vehicleType: 'tesla_model3',
    range: 400000,                  // 400km range in meters
    initialCharge: 80,              // Starting with 80% charge
    maxCharge: 100,                 // Maximum charge capacity (required)
    minCharge: 10,                  // Don't go below 10% charge
    connectorTypes: ['ccs_combo_type2', 'tesla']
  }
);

// Format the route distance and duration
const distance = formatDistance(route.distance);        // e.g., "250.5 miles"
const duration = formatDuration(route.duration);        // e.g., "3 hours 45 minutes"
const chargingTime = formatDuration(calculateTotalChargingTime(route)); // e.g., "45 minutes"
```

### Supported Connector Types

The EV routing API supports the following connector types:

- `ccs_combo_type1`: Combined Charging System J-plug with fast charging DC
- `ccs_combo_type2`: Combined Charging System Mennekes with fast charging DC
- `tesla`: Proprietary connector for Tesla vehicles
- `chademo`: CHAdeMO fast charging standard

The API will automatically map common variations:
- `type1`, `j1772` → `ccs_combo_type1`
- `type2`, `mennekes` → `ccs_combo_type2`
- `ccs_type1` → `ccs_combo_type1`
- `ccs_type2` → `ccs_combo_type2`

### Important Notes

1. The `maxCharge` parameter is required by the Mapbox API. If not provided, a default value of 70kWh (70000 Wh) will be used.
2. Coordinates must be provided in the format `[longitude, latitude]` (note that longitude comes first).
3. The API uses watt-hours (Wh) for energy values, not percentages. The frontend service handles the conversion.
4. The API will automatically add default values for energy consumption curve, charging curve, and other EV-specific parameters if not provided.

## API Reference

For more details on the Mapbox APIs used by these services:

- [Mapbox EV Charge Finder API](https://docs.mapbox.com/api/navigation/ev-charge-finder/)
- [Mapbox Directions API (EV Routing)](https://docs.mapbox.com/api/navigation/directions/)

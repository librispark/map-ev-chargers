import React from 'react';
import MapWrapper from '@/components/MapWrapper';
import { ChargingStation } from '@/services/mapboxService';

// Sample data for demonstration
const sampleChargingStations: ChargingStation[] = [
  {
    id: '1',
    lat: 40.7128,
    lng: -74.0060,
    name: 'NYC Downtown Charging Hub',
    chargerType: ['CCS', 'CHAdeMO'],
    powerLevel: 150, // 150 kW DC Fast Charging
    network: 'Electrify America',
    available: true,
    address: '123 Broadway, New York, NY 10007',
    city: 'New York',
    state: 'NY',
    postalCode: '10007',
    country: 'USA',
    distance: 0
  },
  {
    id: '2',
    lat: 34.0522,
    lng: -118.2437,
    name: 'LA Central Station',
    chargerType: ['Tesla Supercharger'],
    powerLevel: 250, // 250 kW Supercharger
    network: 'Tesla',
    available: true,
    address: '456 Grand Ave, Los Angeles, CA 90012',
    city: 'Los Angeles',
    state: 'CA',
    postalCode: '90012',
    country: 'USA',
    distance: 0
  },
  {
    id: '3',
    lat: 41.8781,
    lng: -87.6298,
    name: 'Chicago Loop Chargers',
    chargerType: ['J1772', 'CCS'],
    powerLevel: 7.2, // 7.2 kW Level 2
    network: 'ChargePoint',
    available: false,
    address: '789 Michigan Ave, Chicago, IL 60601',
    city: 'Chicago',
    state: 'IL',
    postalCode: '60601',
    country: 'USA',
    distance: 0
  }
];

export default function MapPage() {
  return (
    <div className="flex flex-col items-center py-8">
      <h1 className="text-4xl font-bold mb-6">Browse EV Charging Stations</h1>
      
      <div className="max-w-3xl text-center mb-10">
        <p className="text-xl mb-4">
          Explore electric vehicle charging stations across the country.
        </p>
        <p className="mb-6">
          This interactive map will show all available charging stations with filtering options.
        </p>
      </div>

      {/* Using the MapWrapper component */}
      <div className="w-full max-w-6xl mb-8">
        <MapWrapper 
          height={600}
          width="100%"
          zoom={15}
          centerLat={38.9072} // Washington DC
          centerLng={-77.0369} // Washington DC
          searchRadius={50} // 50km radius
          useRealData={true} // Use real data from the API
        />
      </div>

      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-3">Filter by Charger Type</h3>
          <div className="space-y-2">
            <div className="flex items-center">
              <input type="checkbox" id="ccs" className="mr-2" />
              <label htmlFor="ccs">CCS (Combined Charging System)</label>
            </div>
            <div className="flex items-center">
              <input type="checkbox" id="chademo" className="mr-2" />
              <label htmlFor="chademo">CHAdeMO</label>
            </div>
            <div className="flex items-center">
              <input type="checkbox" id="j1772" className="mr-2" />
              <label htmlFor="j1772">J1772</label>
            </div>
            <div className="flex items-center">
              <input type="checkbox" id="tesla" className="mr-2" />
              <label htmlFor="tesla">Tesla Supercharger</label>
            </div>
            <div className="flex items-center">
              <input type="checkbox" id="nacs" className="mr-2" />
              <label htmlFor="nacs">NACS</label>
            </div>
          </div>
        </div>

        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-3">Filter by Power Level</h3>
          <div className="space-y-2">
            <div className="flex items-center">
              <input type="checkbox" id="level1" className="mr-2" />
              <label htmlFor="level1">Level 1 (120V)</label>
            </div>
            <div className="flex items-center">
              <input type="checkbox" id="level2" className="mr-2" />
              <label htmlFor="level2">Level 2 (240V)</label>
            </div>
            <div className="flex items-center">
              <input type="checkbox" id="dcfc" className="mr-2" />
              <label htmlFor="dcfc">DC Fast Charging</label>
            </div>
          </div>
        </div>

        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-3">Filter by Network</h3>
          <div className="space-y-2">
            <div className="flex items-center">
              <input type="checkbox" id="electrifyAmerica" className="mr-2" />
              <label htmlFor="electrifyAmerica">Electrify America</label>
            </div>
            <div className="flex items-center">
              <input type="checkbox" id="chargepoint" className="mr-2" />
              <label htmlFor="chargepoint">ChargePoint</label>
            </div>
            <div className="flex items-center">
              <input type="checkbox" id="evgo" className="mr-2" />
              <label htmlFor="evgo">EVgo</label>
            </div>
            <div className="flex items-center">
              <input type="checkbox" id="tesla" className="mr-2" />
              <label htmlFor="tesla">Tesla</label>
            </div>
            <div className="flex items-center">
              <input type="checkbox" id="other" className="mr-2" />
              <label htmlFor="other">Other</label>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-lg shadow-md w-full max-w-6xl">
        <h2 className="text-2xl font-semibold mb-4">About This Map</h2>
        <p className="mb-4">
          This map displays electric vehicle charging stations across the country. You can filter by charger type, 
          power level, and network to find the stations that are compatible with your vehicle.
        </p>
        <p>
          The data is regularly updated to ensure accuracy. In the future, we plan to add real-time availability 
          information and user reviews to help you find the best charging stations for your needs.
        </p>
      </div>
    </div>
  );
}

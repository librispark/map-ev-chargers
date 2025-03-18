import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center py-8">
      <h1 className="text-4xl font-bold mb-6">EV Charger Map</h1>
      
      <div className="max-w-3xl text-center mb-10">
        <p className="text-xl mb-4">
          Find electric vehicle charging stations across the country and plan your routes efficiently.
        </p>
        <p className="mb-6">
          Our application helps EV owners locate charging stations for all electric vehicle types and charger standards,
          making long-distance travel planning easier and more convenient.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl mb-12">
        <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4">Browse Map</h2>
          <p className="mb-4">
            Explore our interactive map showing all EV charging stations across the country.
            Filter by charger type, availability, and more.
          </p>
          <Link 
            href="/map" 
            className="inline-block bg-foreground text-background px-6 py-2 rounded-md hover:bg-opacity-90 transition-colors"
          >
            View Map
          </Link>
        </div>

        <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4">Plan Your Route</h2>
          <p className="mb-4">
            Enter your starting point and destination to find the optimal route with charging stops.
            Plan your journey with confidence.
          </p>
          <Link 
            href="/routes" 
            className="inline-block bg-foreground text-background px-6 py-2 rounded-md hover:bg-opacity-90 transition-colors"
          >
            Plan Route
          </Link>
        </div>
      </div>

      <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-lg shadow-md w-full max-w-4xl">
        <h2 className="text-2xl font-semibold mb-4">Features</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Comprehensive database of charging stations across the country</li>
          <li>Support for all EV types and charger standards</li>
          <li>Interactive map for browsing charging locations</li>
          <li>Route planning with optimal charging stops</li>
          <li>Real-time availability information (coming soon)</li>
          <li>User reviews and ratings for charging stations (coming soon)</li>
        </ul>
      </div>
    </div>
  );
}

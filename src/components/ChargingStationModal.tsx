"use client";

import React from 'react';
import { ChargingStationDetails } from '@/services/mapbox';

interface ChargingStationModalProps {
  station: ChargingStationDetails | null;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Modal component to display detailed information about a charging station
 */
const ChargingStationModal: React.FC<ChargingStationModalProps> = ({ station, isOpen, onClose }) => {
  if (!isOpen || !station) {
    return null;
  }

  // Helper function to format connector standards to be more readable
  const formatConnectorStandard = (standard: string): string => {
    const standards: Record<string, string> = {
      'IEC_62196_T1': 'J1772 (Type 1)',
      'IEC_62196_T2': 'Mennekes (Type 2)',
      'IEC_62196_T1_COMBO': 'CCS1',
      'IEC_62196_T2_COMBO': 'CCS2',
      'CHADEMO': 'CHAdeMO',
      'TESLA': 'Tesla',
      'NACS': 'NACS (Tesla)',
      'IEC_60309_2_single_16': 'IEC 60309 (16A)',
      'IEC_60309_2_three_16': 'IEC 60309 (16A, 3-phase)',
      'IEC_60309_2_three_32': 'IEC 60309 (32A, 3-phase)',
      'IEC_60309_2_three_64': 'IEC 60309 (64A, 3-phase)',
    };
    
    return standards[standard] || standard;
  };

  // Helper function to format power type to be more readable
  const formatPowerType = (powerType: string): string => {
    const types: Record<string, string> = {
      'AC_1_PHASE': 'AC (1-phase)',
      'AC_3_PHASE': 'AC (3-phase)',
      'DC': 'DC'
    };
    
    return types[powerType] || powerType;
  };

  // Helper function to format connector format to be more readable
  const formatConnectorFormat = (format: string): string => {
    const formats: Record<string, string> = {
      'SOCKET': 'Socket',
      'CABLE': 'Attached Cable'
    };
    
    return formats[format] || format;
  };

  // Helper function to format status to be more readable
  const formatStatus = (status: string): string => {
    const statuses: Record<string, string> = {
      'AVAILABLE': 'Available',
      'CHARGING': 'In Use',
      'OCCUPIED': 'Occupied',
      'RESERVED': 'Reserved',
      'UNAVAILABLE': 'Unavailable',
      'UNKNOWN': 'Unknown'
    };
    
    return statuses[status] || status;
  };

  // Helper function to get status color
  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      'AVAILABLE': 'text-green-600',
      'CHARGING': 'text-blue-600',
      'OCCUPIED': 'text-orange-600',
      'RESERVED': 'text-yellow-600',
      'UNAVAILABLE': 'text-red-600',
      'UNKNOWN': 'text-gray-600'
    };
    
    return colors[status] || 'text-gray-600';
  };

  // Helper function to format power in kW
  const formatPower = (power: number): string => {
    return `${(power / 1000).toFixed(1)} kW`;
  };

  // Helper function to format price
  const formatPrice = (price: number, currency: string): string => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: currency 
    }).format(price);
  };

  // Helper function to get day name from weekday number
  const getDayName = (weekday: number): string => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return days[weekday - 1] || `Day ${weekday}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-2xl font-bold">{station.name}</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6">
          {/* Address */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Location</h3>
            <p className="mb-1">{station.address}</p>
            <p className="mb-1">{station.city}, {station.postalCode}</p>
            <p className="mb-3">{station.country}</p>
            
            <a 
              href={`https://www.google.com/maps/search/?api=1&query=${station.coordinates.latitude},${station.coordinates.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Open in Google Maps
            </a>
          </div>
          
          {/* Operator */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Operator</h3>
            <p className="mb-1">{station.operator.name}</p>
            {station.operator.website && (
              <a 
                href={station.operator.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              >
                {station.operator.website}
              </a>
            )}
          </div>
          
          {/* Charging Points */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Charging Points</h3>
            {station.evses.map((evse) => (
              <div key={evse.uid} className="mb-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex justify-between items-center mb-3">
                  <span className="font-medium">Charging Point #{evse.uid}</span>
                  <span className={`font-medium ${getStatusColor(evse.status)}`}>
                    {formatStatus(evse.status)}
                  </span>
                </div>
                
                <h4 className="text-md font-medium mb-2">Connectors:</h4>
                <div className="space-y-3">
                  {evse.connectors.map((connector) => (
                    <div key={connector.id} className="pl-4 border-l-2 border-gray-300 dark:border-gray-600">
                      <div className="grid grid-cols-2 gap-2">
                        <span className="text-gray-600 dark:text-gray-400">Type:</span>
                        <span>{formatConnectorStandard(connector.standard)}</span>
                        
                        <span className="text-gray-600 dark:text-gray-400">Format:</span>
                        <span>{formatConnectorFormat(connector.format)}</span>
                        
                        <span className="text-gray-600 dark:text-gray-400">Power Type:</span>
                        <span>{formatPowerType(connector.powerType)}</span>
                        
                        <span className="text-gray-600 dark:text-gray-400">Max Power:</span>
                        <span>{formatPower(connector.maxElectricPower)}</span>
                        
                        <span className="text-gray-600 dark:text-gray-400">Voltage:</span>
                        <span>{connector.maxVoltage}V</span>
                        
                        <span className="text-gray-600 dark:text-gray-400">Amperage:</span>
                        <span>{connector.maxAmperage}A</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          {/* Opening Hours */}
          {station.openingTimes && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Opening Hours</h3>
              {station.openingTimes.twentyfourseven ? (
                <p>Open 24/7</p>
              ) : station.openingTimes.regularHours && station.openingTimes.regularHours.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {station.openingTimes.regularHours.map((hour, index) => (
                    <React.Fragment key={index}>
                      <span className="text-gray-600 dark:text-gray-400">{getDayName(hour.weekday)}:</span>
                      <span>{hour.periodBegin} - {hour.periodEnd}</span>
                    </React.Fragment>
                  ))}
                </div>
              ) : (
                <p>Opening hours not specified</p>
              )}
            </div>
          )}
          
          {/* Pricing */}
          {station.tariffs && station.tariffs.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Pricing</h3>
              {station.tariffs.map((tariff, index) => (
                <div key={index} className="mb-3">
                  <h4 className="font-medium mb-1">
                    {tariff.type === 'AD_HOC_PAYMENT' ? 'Pay as you go' : tariff.type}
                  </h4>
                  <div className="pl-4 border-l-2 border-gray-300 dark:border-gray-600">
                    {tariff.elements.map((element, elemIndex) => (
                      <div key={elemIndex}>
                        {element.priceComponents.map((component, compIndex) => (
                          <div key={compIndex} className="mb-1">
                            {component.type === 'FLAT' && component.price === 0 ? (
                              <p>Free charging</p>
                            ) : component.type === 'FLAT' ? (
                              <p>Flat fee: {formatPrice(component.price, tariff.currency)}</p>
                            ) : component.type === 'TIME' ? (
                              <p>Per minute: {formatPrice(component.price, tariff.currency)}</p>
                            ) : component.type === 'ENERGY' ? (
                              <p>Per kWh: {formatPrice(component.price, tariff.currency)}</p>
                            ) : (
                              <p>{component.type}: {formatPrice(component.price, tariff.currency)}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChargingStationModal;
